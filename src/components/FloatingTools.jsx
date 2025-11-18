// src/components/FloatingTools.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function FloatingTools() {
  const { cart, total } = useCart();
  const navigate = useNavigate();

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

  function openHelp() {
    const url = `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${encodeURIComponent(
      "Hi, I need help with my order"
    )}`;
    window.open(url, "_blank");
  }

  function openCart() {
    navigate("/checkout");
  }

  return (
    <>
      <div className="fab-whatsapp" onClick={openHelp} title="Help">
  <span className="fab-help-text"> Need help?</span>
</div>



      <div
        className="fab-cart"
        title="Cart"
        onClick={openCart}
        style={{ cursor: "pointer" }}
      >
        <div style={{ fontWeight: 700 }}>{cart.length}</div>
        <div style={{ opacity: 0.9 }}>₹{total}</div>
      </div>
    </>
  );
}
