// src/pages/OrdersPage.jsx
import React, {useEffect, useState} from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { parseCSV } from "../utils/csvParser";

import { upcomingDates } from "../utils/date";

/**
 CSV expected columns:
 id,name,description,price,category,isActive,day,imageUrl,closeHours
*/

// ⭐ NEW: Format countdown (h m)
function formatCountdown(hoursLeft) {
  if (hoursLeft <= 0) return null;

  const totalMinutes = Math.floor(hoursLeft * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}h ${m}m`;
}

export default function OrdersPage(){
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const meal = (searchParams.get("meal") || "lunch").toLowerCase();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        const url = import.meta.env.VITE_SHEET_MENU_CSV_URL;
        const r = await fetch(url);
        const txt = await r.text();
        const parsed = parseCSV(txt).map(r=>({
          id: r.id || Math.random().toString(36).slice(2,9),
          name: r.name,
          description: r.description,
          price: Number(r.price || 0),
          category: (r.category||"").toLowerCase(),
          isActive: ((r.isActive||"TRUE").toLowerCase() === "true"),
          day: (r.day || r.availableDays || "").toLowerCase(),
          imageUrl: r.imageUrl,

          // ⭐ NEW
          closeHours: Number(r.closeHours || 24)
        }));
        setMenuItems(parsed.filter(p => p.category === meal && p.isActive));
      }catch(e){
        console.error("Failed to load menu CSV", e);
        setMenuItems([]);
      }finally{
        setLoading(false);
      }
    }
    load();
  },[meal]);

  if (loading) return <div className="center"><div className="spinner"/></div>;

  const upcoming = upcomingDates(7);

  const daysWithItems = upcoming.filter(d => {
    return menuItems.some(mi => {
      if(!mi.day) return false;
      const allowed = mi.day.split(/[\s,;|]+/).map(x=>x.trim().slice(0,3));
      return allowed.includes(d.weekday);
    });
  }).slice(0,5);

  return (
    <div className="container">
      <h1 className="page-title">📅 Upcoming Menus</h1>

      {daysWithItems.length === 0 && (
        <div className="glass-card" style={{padding:20}}>
          No menus available for the upcoming days.
        </div>
      )}

      {daysWithItems.map(d => {
        
        const items = menuItems.filter(mi => {
          const allowed = (mi.day||"").split(/[\s,;|]+/).map(x=>x.trim().slice(0,3));
          return allowed.includes(d.weekday);
        });

        const label = new Date(d.iso).toLocaleDateString(undefined, {
          weekday:"long", 
          month:"short", 
          day:"numeric"
        });

        return (
          <section key={d.iso} style={{marginBottom:28}}>
            <h3 style={{marginBottom:12}}>{label}</h3>

            <div className="grid">
              {items.map(it => {

                // ⭐ NEW: Time left before close
                const eventTime = new Date(d.iso).getTime();
                const now = Date.now();
                const diffHours = (eventTime - now) / (1000 * 60 * 60);

                // Time left until closing point
                const hoursLeftToClose = diffHours - it.closeHours;

                const isClosed = hoursLeftToClose <= 0;

                return (
                  <div className="food-card" key={it.id}>
                    <div className="card-img-box">
                      <img 
                        src={it.imageUrl || "/no-image.png"} 
                        className="food-img" 
                        alt={it.name} 
                        onError={e=>e.target.src="/no-image.png"} 
                      />
                    </div>

                    <div className="food-info">
                      <h3>{it.name}</h3>
                      <p>{it.description || "No description"}</p>

                      {/* ⭐ NEW COUNTDOWN TEXT */}
                      <div 
                        style={{
                          fontSize: "12px",
                          marginBottom: "6px",
                          color: isClosed ? "red" : "#4ade80"
                        }}
                      >
                        {isClosed 
                          ? "Ordering Closed" 
                          : `Closes in ${formatCountdown(hoursLeftToClose)}`
                        }
                      </div>

                      <div className="card-actions">
                        <div className="price">₹{it.price}</div>

                        {/* ⭐ BUTTON UPDATED FOR COUNTDOWN / CLOSED */}
                        <button
                          className="btn-primary"
                          disabled={isClosed}
                          style={{
                            opacity: isClosed ? 0.5 : 1,
                            pointerEvents: isClosed ? "none" : "auto",
                            cursor: isClosed ? "not-allowed" : "pointer"
                          }}
                          onClick={()=>{

                            if (isClosed) return;

                            const deliveryDate = d.iso;

                            addToCart({
                              id: it.id,
                              name: it.name,
                              price: it.price,
                              imageUrl: it.imageUrl,

                              deliveryDate,
                              day: d.weekday,
                              dayLabel: new Date(d.iso).toLocaleDateString(undefined, {
                                weekday: "long"
                              })
                            });
                          }}
                        >
                          {isClosed 
                            ? "Order Closed" 
                            : `Add to cart (for ${new Date(d.iso).toLocaleDateString()})`
                          }
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
