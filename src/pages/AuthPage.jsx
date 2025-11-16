// src/pages/AuthPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "Thaayar Kitchen_user";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup"); // 'signup' or 'login'
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // auto-redirect if already signed in
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function saveUser() {
    if (!name || !phone || !address) return alert("Please fill all fields");
    const user = { name, phone, address };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    alert("Saved! You can now return to Checkout to complete order.");
    navigate("/", { replace: true });
  }

  return (
  <div className="auth-wrapper">
    <div className="auth-card">
      <h2 className="auth-title">{mode === "signup" ? "Sign Up" : "Login"}</h2>
      <p className="auth-subtitle">
        We need your name, phone & address to complete your order.
      </p>

      <div className="auth-group">
        <label className="auth-label">Full Name</label>
        <input
          className="auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
        />

        <label className="auth-label">Phone Number</label>
        <input
          className="auth-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone"
        />

        <label className="auth-label">Delivery Address</label>
        <textarea
          className="auth-input"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
        />

        <button className="auth-btn" onClick={saveUser}>
          Save & Continue
        </button>

        <button
          className="auth-clear"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setName("");
            setPhone("");
            setAddress("");
          }}
        >
          Clear
        </button>

        <p className="auth-note">Your details stay only on your device.</p>
      </div>
    </div>
  </div>
);

}
