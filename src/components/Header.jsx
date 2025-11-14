// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-brand">
        <div className="logo">🍲</div>
        <div className="brand-name">Sakthi Kitchen</div>
      </div>

      {/* Desktop Links */}
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/orders?meal=lunch">Orders</Link>
        <Link to="/checkout">Checkout</Link>
      </nav>

      {/* Hamburger Icon */}
      <div className="hamburger" onClick={() => setOpen(!open)}>
        <span style={{
          width: "26px",
          height: "3px",
          background: "white",
          borderRadius: "4px"
        }}></span>
        <span style={{
          width: "20px",
          height: "3px",
          background: "white",
          borderRadius: "4px"
        }}></span>
      </div>

      {/* MOBILE SLIDE MENU */}
      {open && (
        <>
          {/* Dark overlay */}
          <div
            className="overlay"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar */}
          <div
            className="mobile-menu show"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Button */}
            <button
              className="close-btn"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>

            {/* Menu Links */}
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/orders?meal=lunch" onClick={() => setOpen(false)}>Orders</Link>
            <Link to="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
            <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
          </div>
        </>
      )}
    </header>
  );
}
