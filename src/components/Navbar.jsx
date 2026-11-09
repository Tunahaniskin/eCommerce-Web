import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../services/api';
import SearchModal from './SearchModal';
import DepositModal from './DepositModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const location = useLocation();

  const { isLoggedIn, user, logout, balance } = useAuth();
  const { count } = useCart();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on page change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navbarClass = `navbar ${!isHome || scrolled ? 'scrolled' : 'hero-nav'}`;

  const displayName = user?.firstName
    ? `${user.firstName}`
    : user?.email
    ? user.email.split('@')[0]
    : 'Hesabım';

  return (
    <>
      <nav className={navbarClass} id="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo" id="nav-logo-link">
            <span className="logo-star">&#10022;</span>
            <span className="logo-text">Nexara</span>
          </Link>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`} id="nav-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Anasayfa
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}
              >
                Ürünler
              </Link>
            </li>
            <li>
              <Link to="/#about" className="nav-link">
                Hakkımızda
              </Link>
            </li>
            <li>
              <Link to="/#contact" className="nav-link">
                İletişim
              </Link>
            </li>

            {/* Mobile-only user & balance section if logged in */}
            {menuOpen && isLoggedIn && (
              <li className="mobile-user-card">
                <div className="mobile-user-card-head">
                  <div className="mobile-user-avatar">
                    {displayName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{displayName}</span>
                    <span className="mobile-user-email">{user?.email}</span>
                  </div>
                </div>

                <div className="mobile-user-balance-box">
                  <div>
                    <span className="mobile-balance-title">Cüzdan Bakiyesi</span>
                    <span className="mobile-balance-amount">{formatPrice(balance)}</span>
                  </div>
                  <button
                    type="button"
                    className="mobile-btn-deposit"
                    onClick={() => {
                      setMenuOpen(false);
                      setDepositOpen(true);
                    }}
                  >
                    + Yükle
                  </button>
                </div>

                <div className="mobile-user-links">
                  <Link to="/orders" className="mobile-user-link">
                    Siparişlerim & Cüzdan
                  </Link>
                  <button
                    onClick={logout}
                    className="mobile-user-link logout"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            <button
              className="nav-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Ürün Ara"
              id="search-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            <Link to="/cart" className="nav-icon-btn" aria-label="Alışveriş Sepeti" id="cart-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className={`cart-badge ${count > 0 ? 'visible' : ''}`} id="cart-count">
                {count}
              </span>
            </Link>

            {isLoggedIn ? (
              <div className="nav-user-cluster">
                {/* Balance Badge Pill */}
                <div
                  className="nav-wallet-pill"
                  id="nav-wallet-pill"
                  title="Cüzdan Bakiyeniz — Bakiye yüklemek için tıklayın"
                  onClick={() => setDepositOpen(true)}
                >
                  <span className="wallet-pill-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <circle cx="17" cy="15" r="1.2" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="wallet-pill-content">
                    <span className="wallet-pill-label">Bakiye</span>
                    <span className="wallet-pill-amount">{formatPrice(balance)}</span>
                  </div>
                  <span className="wallet-pill-add" title="Hızlı Bakiye Ekle">+</span>
                </div>

                <Link to="/orders" className="nav-cta-btn" id="auth-nav-btn" title="Hesabım & Siparişlerim">
                  <span>{displayName}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="nav-cta-btn" id="auth-nav-btn">
                <span>Giriş Yap</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Link>
            )}

            <button
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü"
              id="hamburger"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />
    </>
  );
}
