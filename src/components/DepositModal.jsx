import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../services/api';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500];

export default function DepositModal({ isOpen, onClose }) {
  const { balance, requestDeposit } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('250');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      showToast('Lütfen geçerli bir tutar girin.', 'error');
      return;
    }

    setLoading(true);
    try {
      await requestDeposit(num);
      showToast(`${formatPrice(num)} tutarındaki bakiye yükleme talebiniz iletildi. Onaylandığında bakiyenize yansıyacaktır.`, 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Bakiye talebi oluşturulamadı.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="deposit-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="deposit-modal-header">
          <div className="deposit-header-title-wrap">
            <div className="deposit-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="17" cy="15" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3>Bakiye Yükle</h3>
              <p>Cüzdanınıza güvenle bakiye ekleyin</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Kapat">
            &times;
          </button>
        </div>

        {/* Current Balance Pill */}
        <div className="deposit-current-balance-row">
          <span className="deposit-current-label">Mevcut Bakiyeniz</span>
          <span className="deposit-current-value">{formatPrice(balance)}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="deposit-form">
          <label className="deposit-input-label">Hızlı Tutar Seçimi</label>
          <div className="quick-amounts-grid">
            {QUICK_AMOUNTS.map((val) => (
              <button
                type="button"
                key={val}
                className={`quick-amount-pill ${Number(amount) === val ? 'active' : ''}`}
                onClick={() => setAmount(String(val))}
              >
                ₺{val.toLocaleString('tr-TR')}
              </button>
            ))}
          </div>

          <div className="deposit-custom-input-group">
            <label htmlFor="custom-deposit-amount" className="deposit-input-label">
              Veya Özel Tutar Girin (₺)
            </label>
            <div className="deposit-input-wrap">
              <span className="deposit-currency-symbol">₺</span>
              <input
                id="custom-deposit-amount"
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Örn: 350"
                required
              />
            </div>
          </div>

          <div className="deposit-info-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              Yükleme talebiniz finans birimine iletilecek ve onaylandığında bakiyeniz anında güncellenecektir.
            </span>
          </div>

          <div className="deposit-modal-actions">
            <button type="button" className="btn-deposit-cancel" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn-deposit-submit" disabled={loading}>
              {loading ? 'İşleniyor...' : `${amount ? formatPrice(Number(amount)) : '0,00'} Yükleme Talebi Gönder`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
