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
 * - Build from today + upcoming dates
 * - Pick first N Mon–Fri
 */
function computeVisibleWeekdays(n = 5) {
  const now = new Date();

  // ALWAYS build from today + upcoming dates (no weekend jump)
  const next14 = upcomingDates(14); // from tomorrow
  const today = {
    iso: now.toISOString().split("T")[0],
    dateObj: now,
  };

  // Combine today + next days
  const combined = [today, ...next14];

  // Filter only Mon–Fri
  const weekdays = combined.filter((d) => {
    const dayIndex = new Date(d.iso).getDay();
    return dayIndex >= 1 && dayIndex <= 5; // Mon–Fri only
  });

  // Take first n unique weekdays
  const unique = [];
  for (const d of weekdays) {
    if (!unique.find((u) => u.iso === d.iso)) {
      unique.push(d);
    }
    if (unique.length >= n) break;
  }

  // Edge-case: if less than n, extend from next Monday
  if (unique.length < n) {
    const nextMonIso = nextDateForWeekday("mon", now);
    const extra = generateSequentialDates(nextMonIso, n)
      .filter((e) => !unique.find((u) => u.iso === e.iso))
      .slice(0, n - unique.length);
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
          day: (
            (r.day ||
             r.availableDays ||
             r.availabledays ||
             "")
              .toString()
              .trim()
              .replace(/\u00A0/g, "")  // remove non-breaking spaces
              .replace(/\s+/g, "")     // remove normal spaces
              .toLowerCase()
          ),
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
  const daysWithItems = daysToShow
    .map((d) => {
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
          .map((x) =>
            x
              .toString()
              .trim()
              .replace(/\u00A0/g, "") // remove NBSP
              .replace(/\s+/g, "")    // remove hidden spaces
              .slice(0, 3)
              .toLowerCase()
          );

        return allowed.includes(wk);
      });

      return { ...d, wk, items };
    })
    .filter((d) => d.items.length > 0); // keep only days that actually have items

  return (
    <div className="container orders-page">
      <h1 className="page-title">
        <span>Kitchen Line-Up</span>
      </h1>

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
          <section key={d.iso} className="day-section">
            <div className="date-tile fade-soft">
              <span className="date-icon">📅</span>
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
                  const diffHours =
                    (delivery.getTime() - Date.now()) / 3600000;
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
                  const diffHours =
                    (delivery.getTime() - Date.now()) / 3600000;
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
                    className="food-card premium-card"
                    key={it.id}
                    style={{
                      position: "relative",
                      filter: isBlocked
                        ? "grayscale(70%) blur(0.5px)"
                        : "none",
                      opacity: isBlocked ? 0.6 : 1,
                    }}
                  >
                    {isBlocked && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: isOutOfStock
                            ? "rgba(255,0,0,0.85)"
                            : "rgba(255,165,0,0.9)",
                          padding: "6px 12px",
                          color: "white",
                          fontWeight: 700,
                          borderRadius: "8px",
                          fontSize: 12,
                          boxShadow: "0 0 10px black",
                          zIndex: 2,
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
                      <h3 className="food-title">{it.name}</h3>
                      <p className="food-desc">
                        {it.description || "No description"}
                      </p>

                      <div className="slot-text">
                        {category === "snacks"
                          ? "Delivery Slot: 04:00 PM – 06:00 PM"
                          : "Delivery Slot: 11:00 AM – 01:00 PM"}
                      </div>

                      <div
                        className="countdown-text"
                        style={{
                          color: isClosed ? "#f97373" : "#4ade80",
                        }}
                      >
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
                              dayLabel: new Date(d.iso).toLocaleDateString(
                                undefined,
                                { weekday: "long" }
                              ),
                            });
                          }}
                        >
                          {isBlocked
                            ? isOutOfStock
                              ? "Out of Stock"
                              : "Order Closed"
                            : `Add to cart (for ${new Date(
                                d.iso
                              ).toLocaleDateString()})`}
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

      {/* Inline styles: glass date tile + premium card layout */}
      <style>{`
        .orders-page {
          padding-top: 10px;
        }

        .day-section {
          margin-bottom: 40px;
        }

        .date-tile {
          width: fit-content;
          margin: 18px auto 26px;
          padding: 10px 24px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(96, 165, 250, 0.6);
          color: #dbeafe;
          font-size: 1.05rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 24px rgba(37, 99, 235, 0.55);
        }

        .date-icon {
          font-size: 1.3rem;
        }

        .fade-soft {
          animation: fadeInSoft 0.6s ease-out;
        }

        @keyframes fadeInSoft {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          align-items: stretch;
        }

        .premium-card {
          border-radius: 20px;
          overflow: hidden;
          background: radial-gradient(circle at top, rgba(15,23,42,0.9), rgba(15,23,42,0.96));
          border: 1px solid rgba(148, 163, 184, 0.35);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.9);
          display: flex;
          flex-direction: column;
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }

        @media (min-width: 768px) {
          .premium-card:hover {
            transform: translateY(-6px) scale(1.015);
            box-shadow: 0 26px 60px rgba(15, 23, 42, 0.95);
            border-color: rgba(96, 165, 250, 0.8);
          }
        }

        .card-img-box {
          width: 100%;
          height: 180px; /* 🔥 fixed height for alignment */
          padding: 10px 10px 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: radial-gradient(circle at top, #1e293b, #020617);
          overflow: hidden;
        }

        .food-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 18px;
          display: block;
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.9);
          transition: transform 0.35s ease;
        }

        .premium-card:hover .food-img {
          transform: scale(1.05);
        }

        .food-info {
          padding: 16px 18px 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .food-title {
          font-size: 1rem;
          font-weight: 700;
          color: #e5edff;
        }

        .food-desc {
          font-size: 0.85rem;
          color: #9fbbe0;
          line-height: 1.4;
          min-height: 36px;
        }

        .slot-text {
          font-size: 0.75rem;
          color: #93c5fd;
        }

        .countdown-text {
          font-size: 0.78rem;
          margin-top: 4px;
        }

        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .price {
          color: #6ee7b7;
          font-weight: 800;
          font-size: 1.05rem;
        }

        .btn-primary {
          padding: 8px 14px;
          font-size: 0.8rem;
        }

        @media (max-width: 640px) {
          .card-img-box {
            height: 170px;
          }
          .food-info {
            padding: 14px 14px 16px;
          }
        }
      `}</style>
    </div>
  );
}
