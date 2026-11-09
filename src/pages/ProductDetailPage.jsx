import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Api, formatPrice } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Lightbox keyboard navigation (Esc to close, Left/Right arrows to navigate)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIdx((prev) => (prev + 1) % (product?.images?.length || 1));
      } else if (e.key === 'ArrowLeft') {
        const len = product?.images?.length || 1;
        setActiveImageIdx((prev) => (prev - 1 + len) % len);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, product]);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedQty(1);
    setActiveImageIdx(0);

    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const p = await Api.getProductById(id);
        if (!isMounted) return;
        setProduct(p);

        // Load related products
        try {
          const res = await Api.getProducts({
            categoryId: p.categoryId || null,
            pageSize: 4
          });
          if (isMounted) {
            setRelatedProducts((res.items || []).filter((item) => item.id !== p.id));
          }
        } catch {
          // ignore related err
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Ürün bulunamadı.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchDetail();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 2rem 5rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '3px solid var(--clr-border)',
            borderTopColor: 'var(--clr-accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '8rem 2rem 5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>
          Ürün Bulunamadı
        </h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>
          İstediğiniz ürün mevcut değil veya kaldırılmış olabilir.
        </p>
        <Link to="/shop" className="btn-primary">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : product.thumbnailPath
    ? [{ imagePath: product.thumbnailPath, thumbnailPath: product.thumbnailPath }]
    : [];

  const safeActiveIdx = activeImageIdx < images.length ? activeImageIdx : 0;
  const activeImg = images[safeActiveIdx];
  // Asıl halini (orijinal büyük görseli) her zaman imagePath'ten alıyoruz
  const mainImgUrl = activeImg
    ? Api.getImageUrl(activeImg.imagePath || activeImg.thumbnailPath)
    : null;

  const stock = product.stock || 0;
  const stockStatus =
    stock > 10
      ? { cls: 'in-stock', text: 'Stokta var' }
      : stock > 0
      ? { cls: 'low-stock', text: `Sadece ${stock} adet kaldı!` }
      : { cls: 'out-of-stock', text: 'Stokta yok' };

  const handleAddToCart = () => {
    addToCart(product, selectedQty);
  };

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 1.5rem)' }}>
      <div className="container">
        {/* BREADCRUMB */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--clr-text-muted)',
            marginBottom: '2rem'
          }}
        >
          <Link to="/" style={{ color: 'var(--clr-text-muted)' }}>Anasayfa</Link>
          <span>/</span>
          <Link to="/shop" style={{ color: 'var(--clr-text-muted)' }}>Ürünler</Link>
          <span>/</span>
          <span style={{ color: 'var(--clr-text)', fontWeight: '500' }}>{product.name}</span>
        </div>

        {/* PRODUCT DETAIL LAYOUT */}
        <div className="product-detail-layout" id="product-detail">
          {/* GALLERY */}
          <div className="product-gallery">
            <div
              className="gallery-main"
              id="gallery-main"
              onClick={() => mainImgUrl && setLightboxOpen(true)}
              title="Görselin asıl halini büyük boyutta incelemek için tıklayın"
              role="button"
              tabIndex={0}
            >
              {mainImgUrl ? (
                <>
                  <img src={mainImgUrl} alt={product.name} id="gallery-main-img" />
                  <div className="gallery-zoom-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Asıl Halini Gör</span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0ede8',
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="gallery-thumbs" id="gallery-thumbs">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`gallery-thumb ${idx === safeActiveIdx ? 'active' : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                    role="button"
                    tabIndex={0}
                    title={`${product.name} - Görsel ${idx + 1}`}
                  >
                    <img
                      src={Api.getImageUrl(img.thumbnailPath || img.imagePath)}
                      alt={`${product.name} ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETAIL INFO */}
          <div className="product-detail-info">
            <span className="product-detail-category">{product.categoryName || 'Seçkin Tasarım'}</span>
            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-price">{formatPrice(product.price)}</div>

            <div className="product-detail-divider" />

            <div className="product-detail-stock">
              <span className={`stock-indicator ${stockStatus.cls}`} />
              <span>{stockStatus.text}</span>
              {stock > 0 && (
                <span style={{ color: 'var(--clr-text-muted)' }}> &bull; {stock} adet stokta</span>
              )}
            </div>

            <div className="product-detail-divider" />

            {/* QTY & ADD TO CART */}
            {stock > 0 ? (
              <>
                <div className="qty-selector" style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--clr-text-muted)',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Adet
                  </label>
                  <div className="qty-input">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    >
                      &#8722;
                    </button>
                    <span className="qty-number">{selectedQty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setSelectedQty((q) => Math.min(stock, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, minWidth: '200px', justifyContent: 'center' }}
                    onClick={handleAddToCart}
                  >
                    Sepete Ekle ({selectedQty})
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: 'var(--radius-sm)',
                  color: '#991b1b',
                  fontSize: '0.9rem'
                }}
              >
                Bu ürün şu anda stoklarımızda tükenmiştir. Yakında tekrar stokta olacaktır.
              </div>
            )}

            {/* DESCRIPTION */}
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Ürün Açıklaması
              </h3>
              <p style={{ color: 'var(--clr-text-muted)', lineHeight: '1.8' }}>
                {product.description ||
                  'Nexara özel koleksiyonuna ait bu ürün, en kaliteli malzemeler ve titiz işçilik ile hayata geçirilmiştir. Günlük kullanım ve özel anlarınız için mükemmel bir zarafet sunar.'}
              </p>
            </div>

            {/* TRUST BADGES */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--clr-border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                fontSize: '0.8rem',
                color: 'var(--clr-text-muted)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> 14 Gün Koşulsuz İade
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> Orijinallik Garantisi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> Ücretsiz Kargo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span> Hızlı ve Sigortalı Gönderim
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section
            className="section"
            style={{
              background: 'transparent',
              borderTop: '1px solid var(--clr-border)',
              marginTop: '5rem',
              paddingTop: '4rem'
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-label">
                  <span className="label-dot" />
                  BENZER ÜRÜNLER
                </div>
                <h2 className="section-title">
                  İlginizi<br />
                  <em>Çekebilir</em>
                </h2>
              </div>
              <Link to="/shop" className="section-link">
                Tümünü Gör
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Link>
            </div>

            <div className="products-grid">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* LIGHTBOX MODAL — TAM BOYUT ASIL GÖRSEL GÖRÜNTÜLEYİCİ */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
          id="lightbox-modal"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="lightbox-header">
              <div className="lightbox-title-wrap">
                <h3 className="lightbox-title">{product.name}</h3>
                {images.length > 1 && (
                  <span className="lightbox-counter">
                    {safeActiveIdx + 1} / {images.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxOpen(false)}
                title="Kapat (Esc)"
                aria-label="Kapat"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="lightbox-body">
              {images.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn prev"
                  onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                  title="Önceki Görsel (Sol Ok)"
                  aria-label="Önceki Görsel"
                >
                  &#8249;
                </button>
              )}

              <div className="lightbox-img-wrap">
                <img
                  src={mainImgUrl}
                  alt={product.name}
                  className="lightbox-img"
                />
              </div>

              {images.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn next"
                  onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                  title="Sonraki Görsel (Sağ Ok)"
                  aria-label="Sonraki Görsel"
                >
                  &#8250;
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="lightbox-thumbs">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`lightbox-thumb ${idx === safeActiveIdx ? 'active' : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                    title={`Görsel ${idx + 1}`}
                  >
                    <img
                      src={Api.getImageUrl(img.thumbnailPath || img.imagePath)}
                      alt={`Küçük Görsel ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
