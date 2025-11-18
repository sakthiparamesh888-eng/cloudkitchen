// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { parseCSV } from "../utils/csvParser";
import { upcomingDates, nextDateForWeekday } from "../utils/date";

function formatCountdown(hoursLeft) {
  if (hoursLeft <= 0) return null;
  const totalMinutes = Math.floor(hoursLeft * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Helper: return an array of N sequential ISO dates starting at given ISO date (yyyy-mm-dd)
 */
function generateSequentialDates(startIso, n = 5) {
  const arr = [];
  const start = new Date(startIso + "T00:00:00");
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({
      iso: d.toISOString().split("T")[0],
      dateObj: d,
    });
  }
  return arr;
}

/**
 * Returns first N weekday dates according to rule:
 * - If today is Saturday (6) or Sunday (0): return next week's Mon-Fri
 * - Otherwise (Mon-Fri): return upcoming weekdays starting from today (max N)
 */
function computeVisibleWeekdays(n = 5) {
  const now = new Date();
  const dow = now.getDay(); // 0 Sun .. 6 Sat

  // If Saturday or Sunday -> show next week's Monday..Friday
  if (dow === 6 || dow === 0) {
    const nextMonIso = nextDateForWeekday("mon", now); // utility returns next occurrence (not today)
    return generateSequentialDates(nextMonIso, n);
  }

  // Otherwise (Mon-Fri) -> build upcomingDates(14) and pick first n weekdays (Mon-Fri) starting from today
  const next14 = upcomingDates(14); // returns {iso, weekday, dateObj} starting from tomorrow
  // include today manually
  const today = {
    iso: new Date().toISOString().split("T")[0],
    weekday: (new Date()).toLocaleDateString(undefined, { weekday: "short" }).slice(0,3).toLowerCase(),
    dateObj: new Date(),
  };

  // combine today + next14, then filter weekdays Mon-Fri
  const combined = [today, ...next14];
  const weekdays = combined.filter((d) => {
    const dayIndex = new Date(d.iso).getDay();
    return dayIndex >= 1 && dayIndex <= 5; // Mon-Fri
  });

  // take first n unique ISO dates
  const unique = [];
  for (const d of weekdays) {
    if (!unique.find(u => u.iso === d.iso)) unique.push(d);
    if (unique.length >= n) break;
  }

  // If we somehow have less than n (edge case), extend using nextDateForWeekday starting next Monday
  if (unique.length < n) {
    const nextMonIso = nextDateForWeekday("mon", new Date());
    const extra = generateSequentialDates(nextMonIso, n).filter(e => !unique.find(u => u.iso === e.iso)).slice(0, n - unique.length);
    return [...unique, ...extra];
  }

  return unique.slice(0, n);
}

export default function OrdersPage() {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const meal = (searchParams.get("meal") || "lunch").toLowerCase();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH MENU CSV
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const url = import.meta.env.VITE_SHEET_MENU_CSV_URL;
        const r = await fetch(url);
        const txt = await r.text();

        const parsed = parseCSV(txt).map((r) => ({
          id: r.id || Math.random().toString(36).slice(2, 9),
          name: r.name,
          description: r.description,
          price: Number(r.price || 0),
          category: (r.category || "").toLowerCase(),
          isActive: (r.isActive || "true").toLowerCase() === "true",
          day: (r.day || r.availableDays || "").toLowerCase(),
          imageUrl: r.imageUrl,
          stockAvailability: (r.stockAvailability || "in").toLowerCase(),
        }));

        setMenuItems(parsed.filter((p) => p.category === meal && p.isActive));
      } catch (e) {
        console.error("Menu load failed", e);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [meal]);

  if (loading)
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );

  // Compute which weekdays to show (5 weekdays)
  const daysToShow = computeVisibleWeekdays(5);

  // Build daysWithItems by matching menuItems day short names
  const daysWithItems = daysToShow.map((d) => {
    // compute weekday short like 'mon','tue' from the date
    const wk = new Date(d.iso)
      .toLocaleDateString(undefined, { weekday: "short" })
      .slice(0, 3)
      .toLowerCase();

    // find items that include this weekday in their day field
    const items = menuItems.filter((mi) => {
      if (!mi.day) return false;
      const allowed = mi.day
        .split(/[\s,;|]+/)
        .map((x) => x.trim().slice(0, 3).toLowerCase());
      return allowed.includes(wk);
    });

    return { ...d, wk, items };
  }).filter(d => d.items.length > 0); // keep only days that actually have items

  return (
    <div className="container">
      <h1 className="page-title">Kitchen-Line Ups</h1>

      {daysWithItems.length === 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          No menus available for the upcoming days.
        </div>
      )}

      {daysWithItems.map((d) => {
        const items = d.items;
        const labelFull = new Date(d.iso).toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        return (
          <section key={d.iso} style={{ marginBottom: 38 }}>
            <div className="date-tile fade-soft">
              <span className="date-icon"></span>
              <span>{labelFull}</span>
            </div>

            <div className="grid">
              {items.map((it) => {
                let isClosed = false;
                let countdownText = "";
                const category = it.category;

                // LUNCH CUT-OFF (unchanged from your logic)
                if (category === "lunch") {
                  const delivery = new Date(d.iso);
                  delivery.setHours(11, 0, 0, 0);
                  const diffHours = (delivery.getTime() - Date.now()) / 3600000;
                  const hoursLeftToClose = diffHours - 14;
                  isClosed = hoursLeftToClose <= 0;
                  countdownText = isClosed
                    ? "Order Closed"
                    : `Order Ends in ${formatCountdown(hoursLeftToClose)}`;
                }

                // SNACKS CUT-OFF
                if (category === "snacks") {
                  const delivery = new Date(d.iso);
                  delivery.setHours(16, 0, 0, 0);
                  const diffHours = (delivery.getTime() - Date.now()) / 3600000;
                  const hoursLeftToClose = diffHours - 14;
                  isClosed = hoursLeftToClose <= 0;
                  countdownText = isClosed
                    ? "Order Closed"
                    : `Order Ends in ${formatCountdown(hoursLeftToClose)}`;
                }

                const isOutOfStock = it.stockAvailability === "out";
                const isBlocked = isClosed || isOutOfStock;

                return (
                  <div
                    className="food-card"
                    key={it.id}
                    style={{
                      position: "relative",
                      filter: isBlocked ? "grayscale(70%) blur(0.5px)" : "none",
                      opacity: isBlocked ? 0.6 : 1,
                    }}
                  >
                    {isBlocked && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: isOutOfStock ? "rgba(255,0,0,0.85)" : "rgba(255,165,0,0.9)",
                          padding: "6px 12px",
                          color: "white",
                          fontWeight: 700,
                          borderRadius: "8px",
                          fontSize: 12,
                          boxShadow: "0 0 10px black",
                        }}
                      >
                        {isOutOfStock ? "OUT OF STOCK" : "ORDER CLOSED"}
                      </div>
                    )}

                    <div className="card-img-box">
                      <img
                        src={it.imageUrl || "/no-image.png"}
                        className="food-img"
                        alt={it.name}
                        onError={(e) => (e.target.src = "/no-image.png")}
                      />
                    </div>

                    <div className="food-info">
                      <h3>{it.name}</h3>
                      <p>{it.description || "No description"}</p>

                      <div style={{ fontSize: 12, color: "#9fbbe0" }}>
                        {category === "snacks"
                          ? "Delivery Slot: 04:00 PM – 06:00 PM"
                          : "Delivery Slot: 11:00 AM – 01:00 PM"}
                      </div>

                      <div style={{ fontSize: 12, marginTop: 6, marginBottom: 6, color: isClosed ? "red" : "#4ade80" }}>
                        {countdownText}
                      </div>

                      <div className="card-actions">
                        <div className="price">₹{it.price}</div>
                        <button
                          className="btn-primary"
                          disabled={isBlocked}
                          style={{
                            opacity: isBlocked ? 0.4 : 1,
                            cursor: isBlocked ? "not-allowed" : "pointer",
                          }}
                          onClick={() => {
                            if (isBlocked) return;
                            addToCart({
                              id: it.id,
                              name: it.name,
                              price: it.price,
                              imageUrl: it.imageUrl,
                              category: it.category,
                              deliveryDate: d.iso,
                              deliveryAvailable: !isClosed,
                              dayLabel: new Date(d.iso).toLocaleDateString(undefined, { weekday: "long" }),
                            });
                          }}
                        >
                          {isBlocked ? (isOutOfStock ? "Out of Stock" : "Order Closed") : `Add to cart (for ${new Date(d.iso).toLocaleDateString()})`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* inline CSS kept from your original for date-tile & image overrides */}
      <style>{`
        .date-tile { width: fit-content; margin: 14px auto 26px; padding: 10px 22px; border-radius: 20px; background: rgba(255,255,255,0.08); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.20); color: #bde0ff; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 18px rgba(0,160,255,0.28); animation: glowPulse 2.2s infinite ease-in-out; }
        .date-icon { font-size: 1.2rem; }
        .fade-soft { animation: fadeInSoft 0.7s ease-out; }
        @keyframes fadeInSoft { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0% { box-shadow: 0 0 12px rgba(0,160,255,0.25); } 50% { box-shadow: 0 0 22px rgba(0,160,255,0.45); } 100% { box-shadow: 0 0 12px rgba(0,160,255,0.25); } }

        .card-img-box { width: 100%; height: auto !important; max-height: none !important; padding: 10px 10px 4px; display:flex; justify-content:center; align-items:center; background: radial-gradient(circle at top, #1e293b, #020617); }
        .food-img { width: 100%; height: auto !important; object-fit: contain !important; border-radius: 18px; display: block; box-shadow: 0 18px 32px rgba(15,23,42,0.7); }
        @media (max-width:640px) { .food-img { border-radius:16px; box-shadow:0 12px 24px rgba(15,23,42,0.7);} }

        .food-card { display:flex; flex-direction: column; }
        .food-card .card-img-box { width:100%; aspect-ratio:4/3; padding:12px; border-radius:24px 24px 0 0; background: radial-gradient(circle at top, #1e293b, #020617); display:flex; justify-content:center; align-items:center; overflow:hidden; }
        .food-card .card-img-box img.food-img { max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; border-radius:18px; display:block; box-shadow:0 18px 30px rgba(15,23,42,0.85); }
        @media (max-width:640px) { .food-card .card-img-box { aspect-ratio:1/1; padding:10px; } .food-card .card-img-box img.food-img { border-radius:16px; box-shadow:0 12px 24px rgba(15,23,42,0.8); } }
      `}</style>
    </div>
  );
}
