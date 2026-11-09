import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" style={{ marginTop: '5rem' }}>
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-star">&#10022;</span>
              <span className="logo-text">Nexara</span>
            </Link>
            <p className="footer-tagline">
              Kaliteyi keşfet. Modern yaşamın seçkin tasarım ve estetikle buluştuğu nokta.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4 className="footer-col-title">Mağaza</h4>
              <ul>
                <li><Link to="/shop">Tüm Ürünler</Link></li>
                <li><Link to="/shop">Yeni Koleksiyon</Link></li>
                <li><Link to="/shop">Öne Çıkanlar</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Hesap</h4>
              <ul>
                <li><Link to="/auth">Giriş Yap / Kayıt</Link></li>
                <li><Link to="/orders">Siparişlerim</Link></li>
                <li><Link to="/cart">Sepetim</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Destek & Bilgi</h4>
              <ul>
                <li><Link to="/#contact">İletişim</Link></li>
                <li><Link to="/#about">Hakkımızda</Link></li>
                <li><a href="#faq" onClick={(e) => e.preventDefault()}>Sıkça Sorulan Sorular</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Nexara. Tüm hakları saklıdır.</p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            <span>Güvenli Alışveriş (256-Bit SSL)</span>
            <span>Hızlı Teslimat</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
