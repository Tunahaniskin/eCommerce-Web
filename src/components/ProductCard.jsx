import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Api, formatPrice } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const imgUrl = Api.getImageUrl(product.thumbnailPath || (product.images && product.images[0]?.imagePath));

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="product-card" onClick={handleCardClick} role="button" tabIndex={0}>
      <div className="product-img-wrap">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
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
          className="product-no-img"
          style={{ display: imgUrl ? 'none' : 'flex' }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>

        <div className="product-img-overlay">
          <button className="btn-primary product-quick-add" onClick={handleQuickAdd}>
            Sepete Ekle
          </button>
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">{product.categoryName || 'Seçkin Koleksiyon'}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          <button
            className="product-add-btn"
            title="Sepete Ekle"
            onClick={handleQuickAdd}
            aria-label="Sepete Ekle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
