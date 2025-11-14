import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function FloatingCart(){
  const { totalItems, total } = useCart();
  const navigate = useNavigate();
  if (!totalItems) return null;
  return (
    <div className="floating-cart" onClick={() => navigate("/checkout")}>
      <div className="cart-count">{totalItems}</div>
      <div className="cart-total">₹{total}</div>
    </div>
  );
}
