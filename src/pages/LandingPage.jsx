file3 :LandingPage.jsx
// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseCSV } from "../utils/csvParser";
import BfImg from "../assets/breakfast.jpg";
import LunchImg from "../assets/lunch.jpg";
import DinnerImg from "../assets/dinner.jpg";
import SnacksImg from "../assets/snacks.jpg";

import DeliveryCheckBanner from "../components/DeliveryCheckBanner";

/**
 * Robust LandingPage:
 * - Cache-bustes Google CSV properly (handles ? or &)
 * - Uses fetch with { cache: "no-store" }
 * - Logs URL, response length & parsed rows
 * - Fallback small CSV parser if parseCSV isn't available
 */

function fallbackParseCSV(csvText) {
  // very small parser: assumes first row headers, comma-separated (handles quoted fields minimally)
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    // naive split, but ok for simple CSVs without many commas in fields
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] !== undefined ? cols[i] : "";
    });
    return obj;
  });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeMeal, setActiveMeal] = useState([]); // array of active meals

  const meals = [
  { id: "breakfast", label: "Breakfast", img: BfImg },
  { id: "lunch", label: "Lunch", img: LunchImg },
  { id: "dinner", label: "Dinner", img: DinnerImg },
  { id: "snacks", label: "Snacks", img: SnacksImg },
];


  useEffect(() => {
    let mounted = true;
    async function loadActiveMeal() {
      try {
        const base = import.meta.env.VITE_SHEET_MENU_CSV_URL;
        if (!base) {
          console.error("VITE_SHEET_MENU_CSV_URL is not set in .env");
          return;
        }

        // Build cache-busted URL safely (handle existing querystring)
        const sep = base.includes("?") ? "&" : "?";
        const url = `${base}${sep}cb=${Date.now()}`;

        console.log("[LandingPage] fetching sheet →", url);

        const r = await fetch(url, {
          method: "GET",
          mode: "cors",
          cache: "no-store", // important
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        // Force reading response text to inspect it
        const txt = await r.text();
        console.log("[LandingPage] fetch status:", r.status, r.statusText);
        console.log("[LandingPage] response length:", txt.length);

        if (!r.ok) {
          console.warn("[LandingPage] non-ok response when fetching sheet:", r.status);
        }

        // Try to parse with global parseCSV (your project) or fallback
        let rows = [];
        if (typeof parseCSV === "function") {
          try {
            rows = parseCSV(txt);
          } catch (err) {
            console.warn("[LandingPage] parseCSV failed, using fallback parser", err);
            rows = fallbackParseCSV(txt);
          }
        } else {
          rows = fallbackParseCSV(txt);
        }

        console.log("[LandingPage] parsed rows:", rows.length, rows.slice(0,2));

        // Determine active meals by checking any row with category + isActive true-ish
        const active = [];

        ["breakfast", "lunch", "dinner", "snacks"].forEach(meal => {
          const exists = rows.some(row => {
            if (!row) return false;
            const cat = (row.category || row.category?.toString() || "").trim().toLowerCase();
            const activeFlag = (row.isActive || row.isActive?.toString() || "").trim().toLowerCase();
            return cat === meal && ["true","yes","1"].includes(activeFlag);
          });
          if (exists) active.push(meal);
        });

        if (mounted) {
          console.log("[LandingPage] active meals detected:", active);
          setActiveMeal(active);
        }
      } catch (e) {
        console.error("[LandingPage] Sheet fetch/error:", e);
      }
    }

    // initial load
    loadActiveMeal();

    // interval refresh - keep it but increase to 10s to avoid aggressive hits
    const interval = setInterval(loadActiveMeal, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="container">
      <DeliveryCheckBanner />

      <h1 className="page-title">Choose a Meal</h1>

      <div className="banner-grid">
        {meals.map((m) => {
          const isActive = activeMeal.includes(m.id);

          return (
            <div
              key={m.id}
              onClick={() => {
                if (isActive) navigate(`/orders?meal=${m.id}`);
              }}
              className={`meal-banner ${isActive ? "active-meal" : "inactive-meal"}`}
            >
              <div className="meal-emoji">
  <img 
    src={m.img}
    alt={m.label}
    style={{
      width: "100%",
      height: "150px",
      borderRadius: "12px",
      objectFit: "cover",
      marginBottom: "10px"
    }}
  />
</div>

              <div className="meal-name">{m.label}</div>
              <div className="meal-sub">
                {isActive ? "Available" : "Coming Soon"}
              </div>
            </div>
          );
        })}
      </div>

      {/* About section unchanged */}
      <section id="about" style={{
        marginTop: "70px",
        padding: "60px 25px",
        borderRadius: "28px",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 0 25px rgba(0, 140, 255, 0.25)",
        animation: "fadeIn 0.8s ease-out",
      }} className="glass-card">
        <h2 style={{ textAlign: "center", color: "#bcdcff", fontSize: "2.4rem", fontWeight: "600", marginBottom: "18px", textShadow: "0 0 14px rgba(0,150,255,0.8)" }}>
          About Thaayar Kitchen
        </h2>
        <p style={{ color: "#d5e9ff", fontSize: "1.15rem", lineHeight: "1.9", textAlign: "center", maxWidth: "900px", margin: "0 auto 35px auto" }}>
          Homemade South Indian Food – Light, Tasty & Heartwarming.
          <br />Freshly prepared, every bite filled with purity, and tradition.
        </p>
        <div style={{ maxWidth: "750px", margin: "0 auto", padding: "25px 25px", borderRadius: "20px", background: "rgba(0, 0, 0, 0.25)", backdropFilter: "blur(10px)", boxShadow: "0 0 15px rgba(0,150,255,0.2)" }}>
          <h3 style={{ color: "#ff9edc", fontSize: "1.5rem", textAlign: "center", marginBottom: "20px", textShadow: "0 0 10px rgba(255,70,150,0.7)" }}>
            🌸 Why Choose Thaayar Kitchen?
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#dff9ff", fontSize: "1.15rem", display: "flex", flexDirection: "column", gap: "14px" }}>
            <li>✅ Homemade & Hygienic</li>
            <li>✅ No Preservatives</li>
            <li>✅ Cooked Fresh Every Day</li>
          </ul>
        </div>
        <p style={{ color: "#d5e9ff", fontSize: "1.15rem", lineHeight: "1.9", textAlign: "center", maxWidth: "900px", margin: "40px auto 0 auto" }}>
          Fresh • Hygienic • Traditional South Indian Meals
          <br /><br />
          Thaayar Kitchen delivers “Ammavin Samayal Taste” right to your doorstep — bringing the warmth of Amma’s Samayal straight to your plate ❤️
        </p>
      </section>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
