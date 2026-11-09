import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Api } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useToast } from '../context/ToastContext';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const { showToast } = useToast();
  const location = useLocation();

  // Scroll to hash if navigated to e.g. /#about or /#contact
  useEffect(() => {
    if (location.hash) {
      const elem = document.querySelector(location.hash);
      if (elem) {
        setTimeout(() => elem.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [featRes, allRes] = await Promise.all([
          Api.getProducts({ page: 1, pageSize: 4 }),
          Api.getProducts({ page: 1, pageSize: 8 })
        ]);

        if (isMounted) {
          setFeaturedProducts(featRes.items || []);
          setTotalCount(featRes.totalCount || featRes.items?.length || 0);
          setRecentProducts(allRes.items || []);
        }
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setSendingContact(true);
    try {
      await Api.logClientError(
        `Contact form submission from ${contactName} <${contactEmail}>: ${contactMessage}`,
        ''
      );
      showToast('Mesajınız başarıyla iletildi! En kısa sürede döneceğiz.', 'success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch {
      showToast('Mesaj iletilirken bir hata oluştu.', 'error');
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <span className="hero-badge">
            <span className="hero-badge-dot" />
            Yeni Koleksiyon
          </span>
          <h1 className="hero-title">
            Kaliteli Ürünler,<br />
            <em>Seçkin Alışveriş</em>
          </h1>
          <p className="hero-subtitle">
            En iyi markaların en seçkin ürünlerini keşfedin.<br />
            Hızlı teslimat, güvenli ödeme ve benzersiz bir deneyim.
          </p>

          <div className="hero-actions">
            <Link to="/shop" className="btn-primary">
              Alışverişe Başla
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </Link>
            <a href="#featured" className="btn-ghost">
              Öne Çıkanlar
            </a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-number" id="stat-products">
              {totalCount > 0 ? `${totalCount}+` : '20+'}
            </span>
            <span className="hero-stat-label">Aktif Ürün</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">%100</span>
            <span className="hero-stat-label">Güvenli Ödeme</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">24/7</span>
            <span className="hero-stat-label">Müşteri Desteği</span>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="about-teaser" id="about">
        <div className="container">
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>
              <span className="label-dot" />
              NEXARA MANİFESTOSU
            </div>
            <h2 className="section-title" style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              Zarafet ve Kalitenin<br />
              <em>Modern Yansıması</em>
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '1.1rem', lineHeight: '1.8' }}>
              Nexara, sadece alışveriş yapılan bir platform değil; hayatınıza dokunan, her ayrıntısında incelik ve üstün kalite barındıran seçkin ürünlerin buluşma noktasıdır. Güvenilir ödeme altyapımız ve özenle paketlenen kargolarımızla alışverişi keyfe dönüştürüyoruz.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="section" id="featured">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-label">
                <span className="label-dot" />
                ÖNE ÇIKANLAR
              </div>
              <h2 className="section-title">
                Sezonun En Çok<br />
                <em>Beğenilenleri</em>
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

          <div className="products-grid" id="featured-products">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-skeleton" />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <p style={{ color: 'var(--clr-text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                Henüz öne çıkan ürün bulunmuyor.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3 className="feature-title">Hızlı ve Güvenli Teslimat</h3>
              <p className="feature-desc">Tüm siparişlerde ücretsiz kargo.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="feature-title">256-Bit SSL Ödeme</h3>
              <p className="feature-desc">Banka standartlarında en üst düzey güvenlik şifrelemesi.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="feature-title">%100 Orijinal Ürün</h3>
              <p className="feature-desc">Tüm ürünlerimiz doğrudan yetkili distribütör garantilidir.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="feature-title">7/24 Kesintisiz Destek</h3>
              <p className="feature-desc">Her türlü soru ve talebinizde uzman ekibimiz yanınızda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ALL PRODUCTS PREVIEW ===== */}
      <section className="section" style={{ background: '#f0ede8' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-label">
                <span className="label-dot" />
                GENİŞ KATALOG
              </div>
              <h2 className="section-title">
                Son Eklenen<br />
                <em>Tasarımlar</em>
              </h2>
            </div>
            <Link to="/shop" className="btn-outline">
              Mağazaya Git
            </Link>
          </div>

          <div className="products-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-skeleton" />
              ))
            ) : recentProducts.length > 0 ? (
              recentProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <p style={{ color: 'var(--clr-text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                Katalog yüklenemedi veya henüz ürün bulunmuyor.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== CONTACT FORM SECTION ===== */}
      <section className="contact-section" id="contact" style={{ padding: '6rem 0', background: 'var(--clr-bg)' }}>
        <div className="container">
          <div className="contact-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="section-label">
                <span className="label-dot" />
                İLETİŞİM
              </div>
              <h2 className="section-title" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                Bizimle<br />
                <em>İletişime Geçin</em>
              </h2>
              <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem', lineHeight: '1.7' }}>
                Ürünlerimiz, kurumsal siparişler veya önerileriniz hakkında bize dilediğiniz zaman yazabilirsiniz. Ekibimiz en geç 24 saat içinde dönüş yapacaktır.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    ✉
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>E-Posta</div>
                    <div style={{ fontWeight: '500' }}>destek@nexara.com</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    📞
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Telefon</div>
                    <div style={{ fontWeight: '500' }}>+90 (850) 444 00 00</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--clr-border)' }}>
              <form onSubmit={handleContactSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Adınız Soyadınız
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Adınız..."
                    required
                    style={{ width: '100%', padding: '0.85rem 1rem', background: '#f9f8f6', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    E-Posta Adresiniz
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    required
                    style={{ width: '100%', padding: '0.85rem 1rem', background: '#f9f8f6', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Mesajınız
                  </label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Size nasıl yardımcı olabiliriz?"
                    required
                    style={{ width: '100%', padding: '0.85rem 1rem', background: '#f9f8f6', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingContact}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {sendingContact ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
