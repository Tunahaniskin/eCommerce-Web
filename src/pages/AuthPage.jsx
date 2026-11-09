import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const { isLoggedIn, login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/orders');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (location.hash === '#register') {
      setActiveTab('register');
    }
  }, [location.hash]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Lütfen e-posta ve şifrenizi girin.', 'error');
      return;
    }

    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('Giriş başarılı! Hoş geldiniz.', 'success');
      const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      navigate(redirectUrl);
    } catch (err) {
      showToast(err.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regEmail || !regPassword) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setRegLoading(true);
    try {
      await register({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        password: regPassword
      });

      showToast('Hesabınız oluşturuldu! Oturum açılıyor...', 'success');

      // Auto login
      try {
        await login(regEmail, regPassword);
        const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectUrl);
      } catch {
        setActiveTab('login');
        setLoginEmail(regEmail);
      }
    } catch (err) {
      showToast(err.message || 'Kayıt başarısız. Lütfen tekrar deneyin.', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <span style={{ color: 'var(--clr-accent)', marginRight: '0.5rem' }}>&#10022;</span>
            Nexara
          </Link>
          <div className="auth-tagline">
            Hoş geldiniz,<br />
            <em>tekrar görüştüğümüze</em><br />
            sevindik.
          </div>
          <p className="auth-tagline-sub">
            Hesabınızla giriş yaparak siparişlerinizi takip edin, favori ürünlerinize ve kişiselleştirilmiş deneyime kolayca erişim sağlayın.
          </p>
        </div>

        <div className="auth-left-bottom">
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Güvenli ve şifrelenmiş oturum
          </div>
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Sipariş takibi ve detaylı fatura geçmişi
          </div>
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Tek tıkla hızlı ve güvenli ödeme deneyimi
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-box">
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: '1.25rem',
              marginBottom: '2rem'
            }}
          >
            <span style={{ color: 'var(--clr-accent)' }}>&#10022;</span> Nexara
          </Link>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Kayıt Ol
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ornek@domain.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: '#f9f8f6',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Şifre
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: '#f9f8f6',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loginLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                {!loginLoading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                )}
              </button>

              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                Henüz hesabınız yok mu?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{ color: 'var(--clr-text)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Kayıt Olun
                </button>
              </p>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Adınız
                  </label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Ad"
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      background: '#f9f8f6',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Soyadınız
                  </label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Soyad"
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      background: '#f9f8f6',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ornek@domain.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: '#f9f8f6',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Şifre
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: '#f9f8f6',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {regLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                {!regLoading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                )}
              </button>

              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                Zaten hesabınız var mı?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  style={{ color: 'var(--clr-text)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Giriş Yapın
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
