// src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/Logocp.jpg";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-header">
      <div className="header-inner">

        {/* LOGO + BRAND */}
        <div className="brand">
          <img src={Logo} alt="Logo" className="brand-logo" />
          <span className="brand-name lugrasimo">Thaayar Kitchen</span>
        </div>

        {/* Desktop Nav */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/orders?meal=lunch">Menu</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/reviews">Reviews</Link>  {/* <-- NEW LINK */}
          <Link to="/about">About</Link>
        </nav>

        {/* Hamburger */}
        <div className="hamburger" onClick={() => setOpen(!open)}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
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
            <Link to="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
            <Link to="/reviews" onClick={() => setOpen(false)}>Reviews</Link> {/* NEW */}
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
          </div>
        </>
      )}
    </header>
  );
}
