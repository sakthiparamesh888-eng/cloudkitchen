// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { parseCSV } from "../utils/csvParser";
import { upcomingDates } from "../utils/date";

// --- Format countdown ---
function formatCountdown(hoursLeft) {
  if (hoursLeft <= 0) return null;
  const totalMinutes = Math.floor(hoursLeft * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export default function OrdersPage() {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const meal = (searchParams.get("meal") || "lunch").toLowerCase();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOAD CSV MENU
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
          isActive: ((r.isActive || "true").toLowerCase() === "true"),
          day: (r.day || r.availableDays || "").toLowerCase(),
          imageUrl: r.imageUrl,
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

  const upcoming = upcomingDates(7);

  const daysWithItems = upcoming
    .filter((d) =>
      menuItems.some((mi) => {
        if (!mi.day) return false;
        const allowed = mi.day
          .split(/[\s,;|]+/)
          .map((x) => x.trim().slice(0, 3));
        return allowed.includes(d.weekday);
      })
    )
    .slice(0, 5);

  return (
    <div className="container">
      <h1 className="page-title">📅 Upcoming Menus</h1>

      {daysWithItems.length === 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          No menus available for the upcoming days.
        </div>
      )}

      {daysWithItems.map((d) => {
        const items = menuItems.filter((mi) => {
          const allowed = (mi.day || "")
            .split(/[\s,;|]+/)
            .map((x) => x.trim().slice(0, 3));
          return allowed.includes(d.weekday);
        });

        const label = new Date(d.iso).toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        return (
          <section key={d.iso} style={{ marginBottom: 28 }}>
            <h3 style={{ marginBottom: 12 }}>{label}</h3>

            <div className="grid">
              {items.map((it) => {
                const deliveryTime = new Date(d.iso);
                deliveryTime.setHours(12, 0, 0, 0); // Lunch slot = 12 PM

                let isClosed = false;
                let countdownText = "";

                if (it.category === "lunch") {
                  const now = Date.now();
                  const diffHours = (deliveryTime.getTime() - now) / 3600000;
                  const hoursLeftToClose = diffHours - 12; // lunch cutoff = 12 hrs before

                  isClosed = hoursLeftToClose <= 0;
                  countdownText = isClosed
                    ? "Ordering Closed"
                    : `Closes in ${formatCountdown(hoursLeftToClose)}`;
                }

                return (
                  <div className="food-card" key={it.id}>
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
                        Delivery Slot: 12:00 PM – 01:00 PM
                      </div>

                      {it.category === "lunch" && (
                        <div
                          style={{
                            fontSize: 12,
                            marginTop: 6,
                            marginBottom: 6,
                            color: isClosed ? "red" : "#4ade80",
                          }}
                        >
                          {countdownText}
                        </div>
                      )}

                      <div className="card-actions">
                        <div className="price">₹{it.price}</div>

                        <button
                          className="btn-primary"
                          disabled={it.category === "lunch" && isClosed}
                          style={{
                            opacity:
                              it.category === "lunch" && isClosed ? 0.5 : 1,
                            pointerEvents:
                              it.category === "lunch" && isClosed
                                ? "none"
                                : "auto",
                          }}
                          onClick={() => {
                            if (it.category === "lunch" && isClosed) return;

                            addToCart({
                              id: it.id,
                              name: it.name,
                              price: it.price,
                              imageUrl: it.imageUrl,
                              category: it.category, // ⭐ REQUIRED FOR CHECKOUT
                              deliveryDate: d.iso,
                              day: d.weekday,
                              dayLabel: new Date(d.iso).toLocaleDateString(
                                undefined,
                                { weekday: "long" }
                              ),
                            });
                          }}
                        >
                          {it.category === "lunch" && isClosed
                            ? "Order Closed"
                            : `Add to cart (for ${
                                new Date(d.iso).toLocaleDateString()
                              })`}
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
    </div>
  );
}
