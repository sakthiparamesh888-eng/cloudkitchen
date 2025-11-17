// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "Thaayar Kitchen_user";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();
  const [verified, setVerified] = useState(false);
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Thaayar Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_WEBHOOK;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  function availableSlots() {
    return ["11:00 AM – 01:00 PM"];
  }

  function group(items) {
    const map = {};
    items.forEach((it) => {
      if (!map[it.dayLabel]) map[it.dayLabel] = [];
      map[it.dayLabel].push(it);
    });
    return map;
  }

  function whatsappLink(orderId) {
    const grouped = group(cart);
    let itemsText = "";

    Object.keys(grouped).forEach((day) => {
      const dateLabel = new Date(
        grouped[day][0].deliveryDate
      ).toLocaleDateString();

      itemsText += `${day} (${dateLabel}):\n`;

      grouped[day].forEach((i) => {
        itemsText += `- ${i.qty || 1}x ${i.name}\n`;
      });

      itemsText += "\n";
    });

    const userText = user
      ? `${user.name}\n${user.phone}\n${user.address}\n\n`
      : "";

    const msg = encodeURIComponent(
`${STORE_NAME}

Order ID: ${orderId}

${userText}Order Details:
${itemsText}
Total: ₹${total}
Delivery Slot: ${slot}
`
    );

    return `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${msg}`;
  }

// inside src/pages/CheckoutPage.jsx (replace your sendOrderToSheet function)
async function sendOrderToSheet() {
  if (!ORDERS_WEBHOOK) return null;

  const now = new Date();

  const payload = {
    "Name": user?.name || "",
    "Phone": user?.phone || "",
    "Address": user?.address || "",
    "Order Items": cart
      .map(i => `${i.qty || 1}x ${i.name} (${new Date(i.deliveryDate).toLocaleDateString()})`)
      .join(" | "),
    "Amount": total,
    "Slot": slot,
    "Date": now.toLocaleDateString()
  };

  try {
    const res = await fetch(ORDERS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString(),
    });

    // parse JSON response (Apps Script returns JSON)
    const data = await res.json();
    console.log("SCRIPT RESPONSE:", data);

    if (data && data.success && data.orderId) {
      return data.orderId; // e.g. "TK-4"
    } else {
      console.error("Sheet save failed:", data);
      return null;
    }
  } catch (err) {
    console.error("SHEET ERROR:", err);
    return null;
  }
}

  function handleConfirmPayment() {
    if (!user)
      return alert("Please sign up before confirming your payment.");

    setVerified(true);
    alert("Payment marked as completed. You can now send the order.");
  }

  async function handleSend() {
    if (!verified) return alert("Confirm payment first.");

    const orderId = await sendOrderToSheet();
    if (!orderId) return alert("Order could not be saved!");

    window.open(whatsappLink(orderId), "_blank");
    clearCart();
    setTimeout(() => (window.location.href = "/success"), 900);
  }

  return (
    <div className="checkout-wrapper container fade-in">
      <h1 className="page-title">🧾 Checkout</h1>

      <div
        className="support-badge"
        onClick={() =>
          window.open(
            `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=Hello%2C%20I%20need%20help`,
            "_blank"
          )
        }
      >
        💬 Need help? Contact Support
      </div>

      <div className="checkout-layout">
        <div className="checkout-items">
          {cart.length === 0 && <div className="glass-empty">Your cart is empty</div>}

          {cart.map((it) => (
            <div className="glass-card checkout-card-new" key={it.id}>
              <img
                src={it.imageUrl || "/no-image.png"}
                className="checkout-img-new"
                alt={it.name}
              />

              <div className="checkout-content">
                <div className="checkout-title-new">{it.name}</div>

                <div className="checkout-price-line">
                  ₹{it.price} × {it.qty || 1}
                </div>

                <div className="checkout-dayTag">
                  {it.dayLabel} •{" "}
                  {new Date(it.deliveryDate).toLocaleDateString()}
                </div>

                <div className="checkout-cat">Category: {it.category}</div>

                <div className="qty-controls-modern">
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>
                    −
                  </button>
                  <span>{it.qty || 1}</span>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>
                    +
                  </button>
                </div>

                <button
                  className="remove-btn-modern"
                  onClick={() => removeFromCart(it.id)}
                >
                  Remove
                </button>
              </div>

              <div className="checkout-total-new">
                ₹{it.price * (it.qty || 1)}
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="checkout-summary glass-card better-summary">
          <h2 className="summary-title">
            Order Summary{" "}
            <span className="summary-sub">(Includes delivery)</span>
          </h2>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          <label className="label">Delivery Slot</label>
          <select
            className="select modern-select"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {availableSlots().map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* 🔵 NEW PROFESSIONAL QR SECTION */}
          <h3 className="qr-heading" style={{ marginTop: 20, marginBottom: 10 }}>
            Scan & Pay Securely
          </h3>

          <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  }}
>
  <div
    style={{
      padding: 22,
      borderRadius: "22px",
      backdropFilter: "blur(14px)",
      background: "rgba(255, 255, 255, 0.08)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      boxShadow: "0 0 22px rgba(0,0,0,0.35)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <img
      src="/gpay-qr.png"
      alt="Scan to Pay"
      style={{
        width: 220,
        height: 220,
        objectFit: "contain",   // 🚀 prevents cropping
        background: "#fff",
        borderRadius: "16px",
        padding: "12px",        // ⭐ extra safe space so UPI ID text appears
      }}
    />

    <div
      style={{
        marginTop: 10,
        fontSize: "14px",
        color: "#d9eaff",
        letterSpacing: "0.3px",
      }}
    >
      
    </div>
  </div>
</div>


          <p
            style={{
              textAlign: "center",
              color: "#a8c7ff",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            Works on GPay • PhonePe • Paytm • BHIM
          </p>

          {/* CONFIRM BUTTON */}
          <button
            className="btn-confirm"
            onClick={handleConfirmPayment}
            disabled={!user}
            style={{
              opacity: user ? 1 : 0.4,
              pointerEvents: user ? "auto" : "none",
            }}
          >
            ✔ I Have Completed Payment
          </button>

          {/* SIGNUP */}
          {!user && (
            <button
              className="btn-outline"
              onClick={() => (window.location.href = "/auth")}
              style={{
                borderColor: "rgba(34,197,94,0.7)",
                color: "#a3ffbf",
                animation: "pulseGreen 1.2s infinite ease-in-out",
                marginTop: 10,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))",
              }}
            >
              ✨ Sign up to Continue
            </button>
          )}

          {/* SEND ORDER */}
          <button
            className="btn-whatsapp-final"
            disabled={!verified || !user}
            onClick={handleSend}
            style={{
              opacity: !verified || !user ? 0.4 : 1,
              marginTop: 12,
            }}
          >
            📩 Send Order via WhatsApp
          </button>

          <button
            className="btn-outline remove"
            onClick={clearCart}
            style={{ marginTop: 10 }}
          >
            Clear Order
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 3px rgba(34,197,94,0.4); transform: scale(1); opacity: 0.75; }
          50% { box-shadow: 0 0 25px rgba(34,197,94,1); transform: scale(1.07); opacity: 1; }
          100% { box-shadow: 0 0 3px rgba(34,197,94,0.4); transform: scale(1); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
