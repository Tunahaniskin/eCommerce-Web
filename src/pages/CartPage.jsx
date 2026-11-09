import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Api, formatPrice } from '../services/api';
import DepositModal from '../components/DepositModal';

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, total, toOrderItems } = useCart();
  const { isLoggedIn, token, balance, refreshBalance } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  const grandTotal = total;

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('redirect_after_login', '/cart');
      showToast('Sipariş vermek için lütfen giriş yapın.', 'info');
      navigate('/auth');
      return;
    }

    if (!items.length) {
      showToast('Sepetiniz boş!', 'error');
      return;
    }

    if (balance < grandTotal) {
      showToast(
        `Yetersiz bakiye. Bu sipariş için ${formatPrice(grandTotal)} gereklidir. Mevcut: ${formatPrice(balance)}. Lütfen bakiye yükleyin.`,
        'error'
      );
      setDepositOpen(true);
      return;
    }

    setCheckingOut(true);
    try {
      const orderItems = toOrderItems();
      await Api.createOrder(orderItems, token);
      clearCart();
      await refreshBalance();
      showToast('Siparişiniz başarıyla alındı ve bakiyenizden tahsil edildi!', 'success');
      navigate('/orders');
    } catch (err) {
      showToast(err.message || 'Sipariş oluşturulamadı.', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Sepetinizi temizlemek istediğinizden emin misiniz?')) {
      clearCart();
      showToast('Sepetiniz temizlendi.', 'info');
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 1.5rem)', minHeight: '80vh', marginBottom: '5rem' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--clr-text-muted)',
            marginBottom: '0.75rem'
          }}
        >
          <Link to="/" style={{ color: 'var(--clr-text-muted)' }}>Anasayfa</Link>
          <span>/</span>
          <span style={{ color: 'var(--clr-text)' }}>Sepetim</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Sepetim
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>
          Seçtiğiniz ürünler aşağıda listelenmektedir.
        </p>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2>Sepetiniz boş</h2>
            <p>Sepetinizde henüz ürün bulunmuyor. Seçkin koleksiyonumuzu keşfetmek için mağazaya göz atın.</p>
            <Link to="/shop" className="btn-primary" style={{ marginTop: '1.5rem' }}>
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="cart-layout" id="cart-content">
            {/* CART ITEMS LIST */}
            <div>
              <div className="cart-items" id="cart-items-list">
                {items.map((item) => {
                  const imgUrl = Api.getImageUrl(item.thumbnailPath);
                  return (
                    <div className="cart-item" key={item.productId}>
                      <div className="cart-item-img">
                        {imgUrl ? (
                          <img src={imgUrl} alt={item.name} />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f0ede8'
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="cart-item-info">
                        <Link to={`/products/${item.productId}`} className="cart-item-name">
                          {item.name}
                        </Link>
                        <div className="cart-item-price-unit">
                          Birim Fiyat: {formatPrice(item.price)}
                        </div>

                        <div className="cart-item-actions">
                          <div className="qty-control">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQty(item.productId, item.qty - 1)}
                            >
                              &minus;
                            </button>
                            <span className="qty-val">{item.qty}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQty(item.productId, item.qty + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-remove-btn"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                            Kaldır
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-price">
                        {formatPrice(item.price * item.qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/shop" className="btn-outline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                  Alışverişe Devam Et
                </Link>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleClearCart}
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  Sepeti Temizle
                </button>
              </div>
            </div>

            {/* CART SUMMARY */}
            <div className="cart-summary">
              <h2 className="cart-summary-title">Sipariş Özeti</h2>

              <div className="summary-row total">
                <span>Toplam Tutar</span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* USER WALLET BALANCE DISPLAY */}
              {isLoggedIn && (
                <div className="cart-wallet-box">
                  <div className="cart-wallet-head">
                    <div className="cart-wallet-title-wrap">
                      <div className="cart-wallet-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="3" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <circle cx="17" cy="15" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="cart-wallet-title">Cüzdan Bakiyeniz</span>
                    </div>
                    <strong className="cart-wallet-balance-val">{formatPrice(balance)}</strong>
                  </div>

                  {balance >= grandTotal ? (
                    <div className="cart-wallet-status sufficient">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Bakiyeniz bu sipariş için yeterlidir.</span>
                    </div>
                  ) : (
                    <div className="cart-wallet-status insufficient">
                      <div className="insufficient-text">
                        <span>Yetersiz Bakiye ({formatPrice(grandTotal - balance)} eksik)</span>
                      </div>
                      <button
                        type="button"
                        className="btn-cart-deposit"
                        onClick={() => setDepositOpen(true)}
                      >
                        + Bakiye Yükle
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Sipariş Veriliyor...' : 'Siparişi Tamamla'}
                {!checkingOut && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                )}
              </button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                  Güvenli Ödeme &bull; Cüzdan Bakiyesi ile Anında Sipariş
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
}
