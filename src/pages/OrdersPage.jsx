import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Api, formatPrice, formatDate } from '../services/api';
import DepositModal from '../components/DepositModal';

const STATUS_MAP = {
  Pending: { cls: 'status-pending', text: 'Beklemede' },
  Processing: { cls: 'status-processing', text: 'İşleniyor' },
  Shipped: { cls: 'status-shipped', text: 'Kargoda' },
  Delivered: { cls: 'status-delivered', text: 'Teslim Edildi' },
  Cancelled: { cls: 'status-cancelled', text: 'İptal Edildi' },
  Refunded: { cls: 'status-cancelled', text: 'İade Edildi' }
};

const STATUS_DESCRIPTIONS = {
  Pending: 'Siparişiniz alındı, onay ve hazırlık aşamasına geçmesi bekleniyor.',
  Processing: 'Siparişiniz depomuzda özenle hazırlanıyor ve paketleniyor.',
  Shipped: 'Siparişiniz kargo firmasına teslim edildi. Teslimat sürecindedir.',
  Delivered: 'Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkürler!',
  Cancelled: 'Bu sipariş iptal edilmiştir.',
  Refunded: 'Bu siparişin tutarı cüzdanınıza iade edilmiştir.'
};

export default function OrdersPage() {
  const { isLoggedIn, user, token, logout, balance, walletTransactions, refreshBalance, balanceLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wallet'
  const [depositOpen, setDepositOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Order Item Details state
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [productThumbsMap, setProductThumbsMap] = useState({});

  // Sipariş ürünlerinin thumbnail görsellerini önceden veya arka planda yükle
  useEffect(() => {
    let isMounted = true;
    Api.getProducts({ pageSize: 100 })
      .then((res) => {
        if (!isMounted) return;
        const map = {};
        const items = res?.items || (Array.isArray(res) ? res : []);
        items.forEach((p) => {
          if (p.id) {
            map[p.id] = p.thumbnailPath || (p.images && p.images[0]?.imagePath) || null;
          }
        });
        setProductThumbsMap((prev) => ({ ...map, ...prev }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Sipariş detayları açıldığında katalogda olmayan veya eksik ürünlerin görselini tekil olarak getir
  useEffect(() => {
    let isMounted = true;
    const missingIds = [];
    Object.values(orderDetailsMap).forEach((detail) => {
      const items = detail?.items || [];
      items.forEach((item) => {
        if (item.productId && !item.thumbnailPath && !productThumbsMap[item.productId]) {
          if (!missingIds.includes(item.productId)) {
            missingIds.push(item.productId);
          }
        }
      });
    });

    if (missingIds.length > 0) {
      Promise.allSettled(missingIds.map((id) => Api.getProductById(id))).then((results) => {
        if (!isMounted) return;
        setProductThumbsMap((prev) => {
          const next = { ...prev };
          let changed = false;
          results.forEach((res) => {
            if (res.status === 'fulfilled' && res.value?.id) {
              const p = res.value;
              const thumb = p.thumbnailPath || (p.images && p.images[0]?.imagePath) || null;
              if (thumb && next[p.id] !== thumb) {
                next[p.id] = thumb;
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [orderDetailsMap, productThumbsMap]);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      sessionStorage.setItem('redirect_after_login', '/orders');
      navigate('/auth');
    }
  }, [isLoggedIn, navigate]);

  // URL hash navigation for #wallet
  useEffect(() => {
    if (window.location.hash === '#wallet') {
      setActiveTab('wallet');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchOrders() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const data = await Api.getOrders(token);
        if (!isMounted) return;
        const list = Array.isArray(data)
          ? data
          : data.value || data.items || [];
        setOrders(list);

        // İlk (en güncel) siparişin detaylarını otomatik aç ve yükle
        if (list.length > 0) {
          const firstId = list[0].id;
          setExpandedOrders({ [firstId]: true });
          setLoadingDetails((prev) => ({ ...prev, [firstId]: true }));
          Api.getOrderById(firstId, token)
            .then((details) => {
              if (isMounted) {
                setOrderDetailsMap((prev) => ({ ...prev, [firstId]: details }));
              }
            })
            .catch((err) => {
              console.error('İlk sipariş detayı alınamadı:', err);
            })
            .finally(() => {
              if (isMounted) {
                setLoadingDetails((prev) => ({ ...prev, [firstId]: false }));
              }
            });
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Siparişler yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isLoggedIn && token) {
      fetchOrders();
    }
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, token]);

  const toggleOrderDetails = async (orderId) => {
    const isCurrentlyExpanded = !!expandedOrders[orderId];
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !isCurrentlyExpanded
    }));

    if (!isCurrentlyExpanded && !orderDetailsMap[orderId] && !loadingDetails[orderId]) {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
      try {
        const details = await Api.getOrderById(orderId, token);
        setOrderDetailsMap((prev) => ({ ...prev, [orderId]: details }));
      } catch (err) {
        console.error('Sipariş detayı alınamadı:', err);
        showToast('Sipariş detayları alınamadı.', 'error');
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const toggleAllDetails = async () => {
    const allExpanded = orders.length > 0 && orders.every((o) => expandedOrders[o.id]);
    if (allExpanded) {
      setExpandedOrders({});
      return;
    }

    const nextExpanded = {};
    orders.forEach((o) => {
      nextExpanded[o.id] = true;
    });
    setExpandedOrders(nextExpanded);

    // Henüz detayı çekilmemiş siparişleri çek
    const toFetch = orders.filter((o) => !orderDetailsMap[o.id] && !loadingDetails[o.id]);
    if (toFetch.length > 0) {
      toFetch.forEach((o) => {
        setLoadingDetails((prev) => ({ ...prev, [o.id]: true }));
      });
      await Promise.allSettled(
        toFetch.map(async (o) => {
          try {
            const details = await Api.getOrderById(o.id, token);
            setOrderDetailsMap((prev) => ({ ...prev, [o.id]: details }));
          } catch (err) {
            console.error(`Sipariş detayı alınamadı (#${o.id}):`, err);
          } finally {
            setLoadingDetails((prev) => ({ ...prev, [o.id]: false }));
          }
        })
      );
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
      showToast('Cüzdan bakiyesi güncellendi.', 'success');
    } catch {
      showToast('Bakiye güncellenemedi.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Oturum kapatıldı.', 'info');
    navigate('/');
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email
    ? user.email.split('@')[0]
    : 'Değerli Müşterimiz';

  const totalSpent = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const lastOrderDate = orders.length > 0 ? formatDate(orders[0].createdAt) : '—';

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 1.5rem)', minHeight: '80vh', marginBottom: '5rem' }}>
      <div className="container orders-page-wrap">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div className="section-label">
              <span className="label-dot" />
              HESABIM
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem' }}>
              Hesabım & Siparişlerim
            </h1>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
              Merhaba, <strong style={{ color: 'var(--clr-text)' }}>{displayName}</strong>
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/shop" className="section-link">
                Alışverişe Devam Et
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Link>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', color: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleLogout}
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="orders-stats-grid">
          {/* CÜZDAN BAKİYESİ KARTI */}
          <div className="stat-card-wallet" id="wallet-summary-card">
            <div className="wallet-card-top">
              <div className="wallet-card-label">
                <span className="wallet-badge-indicator" />
                CÜZDAN BAKİYESİ
              </div>
              <button
                type="button"
                className={`wallet-refresh-btn ${refreshing || balanceLoading ? 'spinning' : ''}`}
                onClick={handleRefreshBalance}
                title="Bakiyeyi Yenile"
                aria-label="Bakiyeyi Yenile"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>
            </div>

            <div className="wallet-card-balance" id="wallet-balance-display">
              {formatPrice(balance)}
            </div>

            <div className="wallet-card-action">
              <button
                type="button"
                className="btn-wallet-deposit"
                onClick={() => setDepositOpen(true)}
                id="btn-deposit-open"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Bakiye Yükle</span>
              </button>
            </div>
          </div>

          {/* TOPLAM SİPARİŞ */}
          <div className="stat-card-standard">
            <div className="stat-card-label">
              Toplam Sipariş
            </div>
            <div className="stat-card-value">
              {orders.length}
            </div>
            <div className="stat-card-sub">Adet tamamlanan sipariş</div>
          </div>

          {/* TOPLAM HARCAMA */}
          <div className="stat-card-standard">
            <div className="stat-card-label">
              Toplam Harcama
            </div>
            <div className="stat-card-value">
              {formatPrice(totalSpent)}
            </div>
            <div className="stat-card-sub">Yapılan harcama tutarı</div>
          </div>

          {/* SON SİPARİŞ */}
          <div className="stat-card-standard">
            <div className="stat-card-label">
              Son Sipariş Tarihi
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
              {lastOrderDate}
            </div>
            <div className="stat-card-sub">En son verilen sipariş</div>
          </div>
        </div>

        {/* Account Tabs */}
        <div className="account-tabs-bar">
          <button
            type="button"
            className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            id="tab-orders-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Siparişlerim ({orders.length})</span>
          </button>

          <button
            type="button"
            className={`account-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
            id="tab-wallet-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="17" cy="15" r="1.5" fill="currentColor" />
            </svg>
            <span>Cüzdan Hareketleri ({walletTransactions.length})</span>
          </button>
        </div>

        {/* TAB 1: WALLET TRANSACTIONS */}
        {activeTab === 'wallet' && (
          <div className="wallet-transactions-section" id="wallet-section-content">
            <div className="wallet-section-header">
              <div>
                <h3>Cüzdan İşlem Geçmişi</h3>
                <p>Cüzdanınıza yapılan yüklemeler, harcamalar ve iadeler</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setDepositOpen(true)}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
              >
                + Yeni Bakiye Talebi
              </button>
            </div>

            {walletTransactions.length === 0 ? (
              <div className="empty-wallet-card">
                <div className="empty-wallet-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <circle cx="17" cy="15" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <h4>Kayıtlı cüzdan hareketi bulunamadı</h4>
                <p>Alışveriş yaptıkça veya bakiye yükledikçe işlemleriniz burada kronolojik olarak listelenecektir.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setDepositOpen(true)}
                  style={{ marginTop: '1rem' }}
                >
                  Şimdi Bakiye Yükle
                </button>
              </div>
            ) : (
              <div className="wallet-tx-table-wrap">
                <table className="wallet-tx-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>İşlem Türü</th>
                      <th>Açıklama</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTransactions.map((tx, idx) => {
                      const isPositive = Number(tx.amount) > 0;
                      return (
                        <tr key={tx.id || idx}>
                          <td style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                            {formatDate(tx.createdAt)}
                          </td>
                          <td>
                            <span className={`tx-type-pill ${isPositive ? 'positive' : 'negative'}`}>
                              {tx.type || (isPositive ? 'Yükleme' : 'Harcama')}
                            </span>
                          </td>
                          <td style={{ color: 'var(--clr-text)' }}>
                            {tx.description || 'İşlem'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            <span className={isPositive ? 'tx-amount-green' : 'tx-amount-red'}>
                              {isPositive ? '+' : ''}{formatPrice(tx.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS CONTENT */}
        {activeTab === 'orders' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div
                  style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--clr-border)',
                    borderTopColor: 'var(--clr-accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#fff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--clr-border)'
                }}
              >
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => window.location.reload()}
                >
                  Tekrar Dene
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-orders-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <h2>Henüz bir siparişiniz yok</h2>
                <p>Verdiğiniz siparişlerin takibini buradan yapabilirsiniz.</p>
                <Link to="/shop" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                  Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {/* Orders Toolbar */}
                <div className="orders-list-toolbar">
                  <div className="orders-list-count">
                    Toplam <strong>{orders.length}</strong> siparişiniz listeleniyor
                  </div>

                  <button
                    type="button"
                    className="btn-expand-all"
                    onClick={toggleAllDetails}
                    id="btn-toggle-all-details"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m7 15 5 5 5-5" />
                      <path d="m7 9 5-5 5 5" />
                    </svg>
                    <span>
                      {orders.length > 0 && orders.every((o) => expandedOrders[o.id])
                        ? 'Tüm Detayları Daralt'
                        : 'Tüm Siparişlerin Detayını Gör'}
                    </span>
                  </button>
                </div>

                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    cls: 'status-pending',
                    text: order.status || 'Bilinmiyor'
                  };

                  const isExpanded = !!expandedOrders[order.id];
                  const isLoadingThis = !!loadingDetails[order.id];
                  const details = orderDetailsMap[order.id] || (order.items?.length ? order : null);

                  const itemsList = details?.items || [];
                  const totalItemsQty = itemsList.reduce((acc, i) => acc + (i.quantity || i.qty || 1), 0);

                  return (
                    <div className="order-card" key={order.id} id={`order-${order.id}`}>
                      {/* Order Header */}
                      <div className="order-header">
                        <div className="order-header-info">
                          <div className="order-header-col">
                            <span className="order-col-label">Sipariş No</span>
                            <span className="order-col-val monospace">
                              #{order.id?.slice(0, 8).toUpperCase()}
                            </span>
                          </div>

                          <div className="order-header-col">
                            <span className="order-col-label">Tarih</span>
                            <span className="order-col-val">{formatDate(order.createdAt)}</span>
                          </div>

                          <div className="order-header-col">
                            <span className="order-col-label">Toplam Tutar</span>
                            <span className="order-col-val total-price">
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>

                          <div className="order-header-col">
                            <span className="order-col-label">Durum</span>
                            <div>
                              <span className={`order-status ${statusInfo.cls}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="order-header-actions">
                          <button
                            type="button"
                            className="btn-order-toggle"
                            onClick={() => toggleOrderDetails(order.id)}
                            id={`btn-toggle-order-${order.id}`}
                            aria-expanded={isExpanded}
                          >
                            <span>
                              {isExpanded ? 'Detayları Gizle' : 'Ürünleri & Detayı Gör'}
                            </span>
                            <svg
                              className={`order-chevron ${isExpanded ? 'rotated' : ''}`}
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Order Details Body */}
                      {isExpanded && (
                        <div className="order-details-body" id={`order-details-${order.id}`}>
                          {isLoadingThis ? (
                            <div className="order-details-loading">
                              <div className="order-loading-spinner" />
                              <span>Sipariş içeriği ve ürünler yükleniyor...</span>
                            </div>
                          ) : details ? (
                            <>
                              {/* Order Meta Bar */}
                              <div className="order-details-meta">
                                <div className="order-meta-item">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                  </svg>
                                  <span>
                                    İçerik: <strong>{itemsList.length} Çeşit Ürün</strong> ({totalItemsQty} Adet)
                                  </span>
                                </div>

                                {details.customerName && (
                                  <div className="order-meta-item">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>Alıcı: <strong>{details.customerName}</strong></span>
                                  </div>
                                )}

                                {details.shippingAddress && (
                                  <div className="order-meta-item">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span>Adres: <strong>{details.shippingAddress}</strong></span>
                                  </div>
                                )}
                              </div>

                              {/* Order Items List */}
                              {itemsList.length > 0 ? (
                                <div className="order-items-list">
                                  {itemsList.map((item, idx) => {
                                    const qty = item.quantity || item.qty || 1;
                                    const unitPrice = item.unitPrice ?? item.price ?? 0;
                                    const lineTotal = item.totalPrice ?? (unitPrice * qty);
                                    const name = item.productName || item.name || `Ürün #${item.productId?.slice(0, 8) || idx + 1}`;
                                    const rawThumb = item.thumbnailPath || item.ThumbnailPath || item.thumbPath || item.imagePath || productThumbsMap[item.productId];
                                    const thumbUrl = Api.getImageUrl(rawThumb);

                                    return (
                                      <div className="order-item-row" key={item.productId || idx}>
                                        <div className="order-item-left">
                                          {item.productId ? (
                                            <Link
                                              to={`/product/${item.productId}`}
                                              className="order-item-thumb has-link"
                                              title={`${name} detayına git`}
                                            >
                                              {thumbUrl ? (
                                                <img
                                                  src={thumbUrl}
                                                  alt={name}
                                                  loading="lazy"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextSibling) {
                                                      e.currentTarget.nextSibling.style.display = 'flex';
                                                    }
                                                  }}
                                                />
                                              ) : null}
                                              <div
                                                className="order-item-thumb-fallback"
                                                style={{ display: thumbUrl ? 'none' : 'flex' }}
                                              >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                                  <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                              </div>
                                            </Link>
                                          ) : (
                                            <div className="order-item-thumb">
                                              {thumbUrl ? (
                                                <img
                                                  src={thumbUrl}
                                                  alt={name}
                                                  loading="lazy"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextSibling) {
                                                      e.currentTarget.nextSibling.style.display = 'flex';
                                                    }
                                                  }}
                                                />
                                              ) : null}
                                              <div
                                                className="order-item-thumb-fallback"
                                                style={{ display: thumbUrl ? 'none' : 'flex' }}
                                              >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                                  <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                              </div>
                                            </div>
                                          )}

                                          <div className="order-item-info">
                                            {item.productId ? (
                                              <Link
                                                to={`/product/${item.productId}`}
                                                className="order-item-name"
                                                title={name}
                                              >
                                                {name}
                                              </Link>
                                            ) : (
                                              <span className="order-item-name">{name}</span>
                                            )}

                                            <div className="order-item-sub">
                                              <span className="order-item-qty-badge">
                                                {qty} Adet
                                              </span>
                                              <span>Birim Fiyat: {formatPrice(unitPrice)}</span>
                                              {item.productId && (
                                                <Link
                                                  to={`/product/${item.productId}`}
                                                  style={{
                                                    fontSize: '0.78rem',
                                                    color: 'var(--clr-text)',
                                                    fontWeight: 600,
                                                    textDecoration: 'underline'
                                                  }}
                                                >
                                                  Ürüne Git &rarr;
                                                </Link>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="order-item-right">
                                          <span className="order-item-price-unit">
                                            {qty} Adet &times; {formatPrice(unitPrice)}
                                          </span>
                                          <span className="order-item-price-total">
                                            {formatPrice(lineTotal)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--clr-text-muted)' }}>
                                  Bu siparişe ait ürün kaydı bulunamadı.
                                </div>
                              )}

                              {/* Order Detail Footer */}
                              <div className="order-details-footer">
                                <div className="order-status-hint">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                  <span>{STATUS_DESCRIPTIONS[order.status] || 'Sipariş durumu güncel.'}</span>
                                </div>

                                <div className="order-breakdown">
                                  <div>
                                    <span style={{ color: 'var(--clr-text-muted)' }}>Kargo: </span>
                                    <strong style={{ color: '#059669' }}>Ücretsiz</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--clr-text-muted)' }}>Toplam: </span>
                                    <span className="order-breakdown-val">
                                      {formatPrice(order.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ef4444' }}>
                              Detaylar yüklenirken bir sorun oluştu.
                              <button
                                type="button"
                                className="btn-outline"
                                style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => toggleOrderDetails(order.id)}
                              >
                                Tekrar Dene
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
}
