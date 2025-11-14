// src/components/FloatingTools.jsx
import React from "react";
import { useCart } from "../context/CartContext";

export default function FloatingTools(){
  const { cart, total } = useCart();
  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

  function openHelp(){
    const url = `https://wa.me/${WHATSAPP_NUM.replace(/\+/g,"")}?text=${encodeURIComponent("Hi, I need help with my order")}`;
    window.open(url, "_blank");
  }

  return (
    <>
      <div className="fab-whatsapp" title="Contact via WhatsApp" onClick={openHelp}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden><path d="M20.5 3.5A11.9 11.9 0 1 0 12 24l-1.3-.7A11.9 11.9 0 0 0 20.5 3.5zM6.9 7.7a.9.9 0 0 1 .9-.8h.7c.2 0 .5.1.7.2.7.4 1.8 1.1 2.1 1.3.3.2.6.1.9-.1l.5-.5c.4-.4 1-.4 1.4 0l.9.9c.4.4.4 1 0 1.4l-.6.6c-.4.4-1 1-1.2 1.1-.6.3-1.6.6-2.3.6s-1.1-.2-1.6-.5c-.5-.3-1.1-.9-1.5-1.4-.4-.5-.7-1.1-.8-1.8-.1-.5.1-1 .5-1.4z"/></svg>
      </div>

      <div className="fab-cart" title="Cart">
        <div style={{fontWeight:700}}>{cart.length}</div>
        <div style={{opacity:0.9}}>₹{total}</div>
      </div>
    </>
  );
}
