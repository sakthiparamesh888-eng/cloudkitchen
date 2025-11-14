// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { parseCSV } from "../utils/csvParser";
import { upcomingDates } from "../utils/date";

// --- Format countdown (h m)
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
          stockAvailability: (r.stockAvailability || "in").toLowerCase(),   // ⭐ NEW STOCK COLUMN
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

  // Build upcoming dates and **exclude Saturday & Sunday**
  const upcomingAll = upcomingDates(7);
  const upcoming = upcomingAll.filter((d) => {
    const dayIndex = new Date(d.iso).getDay();
    return dayIndex !== 0 && dayIndex !== 6; // Sun=0, Sat=6
  });

  const daysWithItems = upcoming
    .filter((d) =>
      menuItems.some((mi) => {
        if (!mi.day) return false;
        const allowed = mi.day
          .split(/[\s,;|,]+/)
          .map((x) => x.trim().slice(0, 3).toLowerCase());
        const wk = new Date(d.iso)
          .toLocaleDateString(undefined, { weekday: "short" })
          .slice(0, 3)
          .toLowerCase();
        return allowed.includes(wk);
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
            .split(/[\s,;|,]+/)
            .map((x) => x.trim().slice(0, 3).toLowerCase());
          const wk = new Date(d.iso)
            .toLocaleDateString(undefined, { weekday: "short" })
            .slice(0, 3)
            .toLowerCase();
          return allowed.includes(wk);
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
                const deliveryStart = new Date(d.iso);
                deliveryStart.setHours(11, 0, 0, 0);

                let isDeliveryClosed = false;
                let countdownText = "";

                if ((it.category || "").toLowerCase() === "lunch") {
                  const now = Date.now();
                  const diffHours = (deliveryStart.getTime() - now) / 3600000;
                  const hoursLeftToClose = diffHours - 14;
                  isDeliveryClosed = hoursLeftToClose <= 0;
                  countdownText = isDeliveryClosed
                    ? "Delivery Closed"
                    : `Closes in ${formatCountdown(hoursLeftToClose)}`;
                }

                // ⭐ NEW — STOCK CHECK
                const isOutOfStock = it.stockAvailability === "out";

                return (
                  <div
                    className="food-card"
                    key={it.id}
                    style={{
                      position: "relative",
                      filter: isOutOfStock ? "grayscale(80%) blur(1px)" : "none",
                      opacity: isOutOfStock ? 0.6 : 1,
                    }}
                  >
                    {/* ⭐ NEW OUT OF STOCK BADGE */}
                    {isOutOfStock && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "rgba(255,0,0,0.85)",
                          padding: "6px 12px",
                          color: "white",
                          fontWeight: "700",
                          borderRadius: "8px",
                          fontSize: 12,
                          boxShadow: "0 0 10px red",
                          animation: "pulse 1.5s infinite",
                        }}
                      >
                        OUT OF STOCK
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

                    <style>
                      {`
                      @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.08); }
                        100% { transform: scale(1); }
                      }
                      `}
                    </style>

                    <div className="food-info">
                      <h3>{it.name}</h3>
                      <p>{it.description || "No description"}</p>

                      <div style={{ fontSize: 12, color: "#9fbbe0" }}>
                        Delivery Slot: 11:00 AM – 01:00 PM
                      </div>

                      {(it.category || "").toLowerCase() === "lunch" && (
                        <div
                          style={{
                            fontSize: 12,
                            marginTop: 6,
                            marginBottom: 6,
                            color: isDeliveryClosed ? "red" : "#4ade80",
                          }}
                        >
                          {countdownText}
                        </div>
                      )}

                      {isDeliveryClosed && (
                        <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 8 }}>
                          Delivery unavailable — booking accepted.
                        </div>
                      )}

                      <div className="card-actions">
                        <div className="price">₹{it.price}</div>

                        <button
                          className="btn-primary"
                          disabled={isOutOfStock}
                          style={{
                            opacity: isOutOfStock ? 0.4 : 1,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            pointerEvents: isOutOfStock ? "none" : "auto",
                          }}
                          onClick={() => {
                            if (isOutOfStock) return;

                            addToCart({
                              id: it.id,
                              name: it.name,
                              price: it.price,
                              imageUrl: it.imageUrl,
                              category: it.category,
                              deliveryDate: d.iso,
                              deliveryAvailable: !isDeliveryClosed,
                              day: d.weekday,
                              dayLabel: new Date(d.iso).toLocaleDateString(undefined, {
                                weekday: "long",
                              }),
                            });
                          }}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isDeliveryClosed
                            ? "Book (Delivery Closed)"
                            : `Add to cart (for ${new Date(d.iso).toLocaleDateString()})`}
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
