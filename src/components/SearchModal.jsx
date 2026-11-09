import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api, formatPrice } from '../services/api';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await Api.getProducts({ search: query.trim(), pageSize: 6 });
        setResults(data.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectProduct = (id) => {
    onClose();
    navigate(`/product/${id}`);
  };

  return (
    <div
      className={`search-overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-container">
        <button className="search-close" onClick={onClose} aria-label="Kapat">
          &times;
        </button>
        <p className="search-hint">Ne arıyorsunuz?</p>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Ürün adı yazın..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />

        <div className="search-results">
          {loading && (
            <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '1rem' }}>
              Aranıyor...
            </p>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '1rem' }}>
              Sonuç bulunamadı.
            </p>
          )}

          {!loading &&
            results.map((product) => {
              const imgUrl = Api.getImageUrl(product.thumbnailPath);
              return (
                <div
                  key={product.id}
                  className="search-result-item"
                  onClick={() => handleSelectProduct(product.id)}
                >
                  {imgUrl ? (
                    <img className="search-result-img" src={imgUrl} alt={product.name} />
                  ) : (
                    <div className="search-result-img" style={{ background: '#eee' }} />
                  )}
                  <div>
                    <div className="search-result-name">{product.name}</div>
                    <div className="search-result-price">{formatPrice(product.price)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
