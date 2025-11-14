import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sakthi_cart") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("sakthi_cart", JSON.stringify(cart)); }, [cart]);

  function addToCart(item) {
    setCart(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id, qty){
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, qty) } : p));
  }

  function removeFromCart(id){
    setCart(prev => prev.filter(p => p.id !== id));
  }

  function clearCart(){ setCart([]); }

  const total = cart.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0);
  const totalItems = cart.reduce((s, it) => s + (it.qty || 0), 0);

  return <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, total, totalItems }}>
    {children}
  </CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
