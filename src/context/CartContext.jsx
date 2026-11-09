import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

const CART_KEY = 'nexara_cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage error
    }
  }, [items]);

  const addToCart = useCallback((product, qty = 1) => {
    const productId = product.id || product.productId;
    const name = product.name;
    const price = Number(product.price) || 0;
    const thumbnailPath = product.thumbnailPath || (product.images && product.images[0]?.imagePath) || '';

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { productId, name, price, thumbnailPath, qty }];
    });

    showToast(`"${name}" sepete eklendi!`, 'success');
  }, [showToast]);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const count = items.reduce((sum, i) => sum + (i.qty || 0), 0);
  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0);

  const toOrderItems = useCallback(() => {
    return items.map((i) => ({
      productId: i.productId,
      quantity: i.qty
    }));
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        count,
        total,
        toOrderItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
