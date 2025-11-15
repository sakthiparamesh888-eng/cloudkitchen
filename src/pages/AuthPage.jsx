// src/pages/AuthPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "Thayaar Kitchen_user";

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
    <div className="container" style={{ paddingTop: 36 }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }} className="glass-card">
        <h2 style={{ marginBottom: 6 }}>{mode === "signup" ? "Sign up" : "Login"}</h2>
        <p className="subtitle">We only need name, phone and delivery address for orders.</p>

        <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
          <label className="label">Full name</label>
          <input className="select" value={name} onChange={(e)=>setName(e.target.value)} placeholder="ENTER USERNAME" />

          <label className="label">Phone number</label>
          <input className="select" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="ENTER YOUR MOBILE NUMBER" />

          <label className="label">Delivery address</label>
          <textarea className="select" value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="ENTER YOUR ADDRESS" rows={3} style={{resize:"vertical"}} />

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={saveUser}>
              Save & Continue
            </button>
            <button className="btn-ghost" onClick={() => { localStorage.removeItem(STORAGE_KEY); setName(""); setPhone(""); setAddress(""); }}>
              Clear
            </button>
          </div>

          <div style={{ marginTop: 6 }}>
            <small className="muted">Your data stays only in your browser.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
