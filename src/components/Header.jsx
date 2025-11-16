// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/Logocp.jpg"; 
// <-- NEW LOGO IMPORT

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-header">
      <div className="header-inner">

        {/* LOGO + BRAND */}
        <div className="brand">
          <img src={Logo} alt="Logo" className="brand-logo" />
          <span className="brand-name">Thaayar Kitchen</span>
        </div>

        {/* Desktop Nav */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/orders?meal=lunch">Menu</Link>
          
          <Link to="/checkout">Checkout</Link>
          <Link to="/about">About</Link>
        </nav>

        {/* Hamburger */}
        <div className="hamburger" onClick={() => setOpen(!open)}>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <>
          <div className="overlay" onClick={() => setOpen(false)} />

          <div className={`mobile-menu ${open ? "show" : ""}`}>
            <button className="close-btn" onClick={() => setOpen(false)}>✕</button>

            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/orders?meal=lunch" onClick={() => setOpen(false)}>Menu</Link>
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
            <Link to="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
          </div>
        </>
      )}
    </header>
  );
}
