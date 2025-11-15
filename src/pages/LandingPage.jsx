// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeMeal, setActiveMeal] = useState("lunch");

  const meals = [
    { id: "breakfast", label: "Breakfast", icon: "☕" },
    { id: "lunch", label: "Lunch", icon: "🍱" },
    { id: "dinner", label: "Dinner", icon: "🍛" },
    { id: "snacks", label: "Snacks", icon: "🍪" },
  ];

 useEffect(() => {
  async function loadActiveMeal() {
    try {
      const url = import.meta.env.VITE_SHEET_MENU_CSV_URL;
      const r = await fetch(url);
      const txt = await r.text();
      const rows = parseCSV(txt);

      const found = rows.find(r => r.activeMeal && r.activeMeal.trim() !== "");
      if (found) {
        setActiveMeal(found.activeMeal.trim().toLowerCase());
      }
    } catch (e) {
      console.log("Sheet fetch error:", e);
    }
  }

  // Initial load
  loadActiveMeal();

  // Auto refresh every 5 seconds
  const interval = setInterval(loadActiveMeal, 5000);

  return () => clearInterval(interval);
}, []);


  return (
    <div className="container">
      <h1 className="page-title">Choose a Meal</h1>

      <div className="banner-grid">
        {meals.map((m) => {
          const isActive = activeMeal === m.id;
          return (
            <div
              key={m.id}
              onClick={() => navigate(`/orders?meal=${m.id}`)}
              className={`meal-banner ${isActive ? "active-meal" : ""}`}
            >
              <div className="meal-emoji">{m.icon}</div>
              <div className="meal-name">{m.label}</div>
              <div className="meal-sub">
                {isActive ? "Available Today" : "Coming Soon"}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================= ABOUT SECTION ========================= */}
      <section
        id="about"
        style={{
          marginTop: "70px",
          padding: "60px 25px",
          borderRadius: "28px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 0 25px rgba(0, 140, 255, 0.25)",
          animation: "fadeIn 0.8s ease-out",
        }}
        className="glass-card"
      >
        <h2
          style={{
            textAlign: "center",
            color: "#bcdcff",
            fontSize: "2.4rem",
            fontWeight: "600",
            marginBottom: "18px",
            textShadow: "0 0 14px rgba(0,150,255,0.8)",
          }}
        >
          About Thayaar Kitchen
        </h2>

        <p
          style={{
            color: "#d5e9ff",
            fontSize: "1.15rem",
            lineHeight: "1.9",
            textAlign: "center",
            maxWidth: "900px",
            margin: "0 auto 35px auto",
          }}
        >
          Homemade South Indian Dinners – Light, Tasty & Heartwarming.
          <br />
          Pure Taste • Hygienic • Homemade Love
        </p>

        <div
          style={{
            maxWidth: "750px",
            margin: "0 auto",
            padding: "25px 25px",
            borderRadius: "20px",
            background: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 15px rgba(0,150,255,0.2)",
          }}
        >
          <h3
            style={{
              color: "#ff9edc",
              fontSize: "1.5rem",
              textAlign: "center",
              marginBottom: "20px",
              textShadow: "0 0 10px rgba(255,70,150,0.7)",
            }}
          >
            🌸 Why Choose Thayaar Kitchen?
          </h3>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              color: "#dff9ff",
              fontSize: "1.15rem",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <li>✅ Homemade & Hygienic</li>
            <li>✅ No Preservatives</li>
            <li>✅ Temple-Taste South Indian Food</li>
            <li>✅ Cooked Fresh Every Day</li>
          </ul>
        </div>

        <p
          style={{
            color: "#d5e9ff",
            fontSize: "1.15rem",
            lineHeight: "1.9",
            textAlign: "center",
            maxWidth: "900px",
            margin: "40px auto 0 auto",
          }}
        >
          Fresh • Hygienic • Traditional South Indian Meals
          <br />
          <br />
          Thayaar Kitchen delivers “Ammavin Samayal Taste” right to your
          doorstep — bringing the warmth of Amma’s Samayal straight to your
          plate ❤️
        </p>
      </section>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
