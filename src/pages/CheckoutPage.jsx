// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "Thayaar Kitchen_user";
const ORDER_COUNTER_KEY = "Thayaar Kitchen_order_counter";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();

  const [verified, setVerified] = useState(false);
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Thayaar Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_WEBHOOK;

  // Load user data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  function availableSlots() {
    return ["11:00 AM – 01:00 PM"];
  }

  function generateOrderId() {
    let c = Number(localStorage.getItem(ORDER_COUNTER_KEY) || "0");
    c += 1;
    localStorage.setItem(ORDER_COUNTER_KEY, c.toString());
    return "T" + String(c).padStart(3, "0");
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
      itemsText += `${day}:\n`;
      grouped[day].forEach((i) => {
        itemsText += `- ${i.qty || 1}x ${i.name} (${new Date(
          i.deliveryDate
        ).toLocaleDateString()})\n`;
      });
      itemsText += "\n";
    });

    const userText =
      user ? `${user.name}\n${user.phone}\n${user.address}\n\n` : "";

    const msg = encodeURIComponent(
`${STORE_NAME}

Order ID: ${orderId}

${userText}Order Details:
${itemsText}
Total: ₹${total}
Delivery Slot: ${slot}`
    );

    return `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${msg}`;
  }

  // ⭐ FINAL WORKING GOOGLE SHEET API CALL ⭐
async function sendOrderToSheet(orderId) {
  if (!ORDERS_WEBHOOK) return;

  const now = new Date();

  const payload = {
    "Order ID": orderId,
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

  // convert to form-encoded string
  const body = new URLSearchParams(payload).toString();

  try {
    const res = await fetch(ORDERS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const out = await res.text();
    console.log("SCRIPT RESPONSE:", out);

  } catch (err) {
    console.error("SHEET ERROR:", err);
  }
}




  async function handleConfirmPayment() {
    if (!user) return alert("Please sign up first.");
    setVerified(true);
    alert("Payment confirmed — WhatsApp enabled.");
  }

  async function handleSend() {
    if (!verified) return alert("Confirm payment first.");

    const orderId = generateOrderId();

    await sendOrderToSheet(orderId);
    window.open(whatsappLink(orderId), "_blank");

    clearCart();
    setTimeout(() => (window.location.href = "/success"), 1200);
  }

  return (
    <div className="checkout-wrapper container">
      <h1 className="page-title">🧾 Checkout</h1>

      {/* Support Button */}
      <div
        style={{
          marginBottom: 20,
          padding: "12px 16px",
          width: "fit-content",
          borderRadius: 14,
          background: "rgba(0, 108, 255, 0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#bcdcff",
          cursor: "pointer",
        }}
        onClick={() =>
          window.open(
            `https://wa.me/${WHATSAPP_NUM.replace(
              /\+/g,
              ""
            )}?text=Hello%2C%20I%20need%20help`,
            "_blank"
          )
        }
      >
        💬 Need help? Contact Support
      </div>

      <div className="checkout-layout">
        {/* LEFT SIDE */}
        <div className="checkout-items">
          {cart.length === 0 && (
            <div className="glass-card">Your cart is empty</div>
          )}

          {cart.map((it) => (
            <div className="checkout-card" key={it.id}>
              <img
                src={it.imageUrl || "/no-image.png"}
                className="checkout-img"
              />
              <div className="checkout-info">
                <div className="checkout-title">{it.name}</div>
                <div className="checkout-sub">₹{it.price}</div>
                <div className="checkout-day muted">
  {it.dayLabel}
  <span style={{ marginLeft: 6, color: "#7fb3ff" }}>
    {new Date(it.deliveryDate).toLocaleDateString()}
  </span>
</div>


                <div style={{ fontSize: 13, color: "#9fbbe0", marginTop: 6 }}>
                  Category: {it.category}
                </div>

                <div className="qty-controls">
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>
                    -
                  </button>
                  <span>{it.qty || 1}</span>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>
                    +
                  </button>
                </div>

                <button className="remove-btn" onClick={() => removeFromCart(it.id)}>
                  Remove
                </button>
              </div>

              <div className="checkout-total">
                ₹{it.price * (it.qty || 1)}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="checkout-summary glass-card">
          <h3>
  Order Summary{" "}
  <span style={{ fontSize: "0.8rem", color: "#9bb0c6", fontWeight: 400 }}>
    (Packing and Delivery fee included)
  </span>
</h3>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          <div className="checkout-block">
            <label className="label">Delivery Slot</label>
            <select
              className="select"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {availableSlots().map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* QR CODE */}
          <div className="qr-box glass-card">
            <h3 className="qr-title">Scan & Pay using GPay</h3>
            <img src="/gpay-qr.png" className="qr-image" />
            <a
  href={`upi://pay?pa=Ganeshmuthu.2711-1@okicici&pn=Thayaar%20Kitchen&am=${total}&cu=INR`}
  style={{
    display: "block",
    marginTop: "15px",
    padding: "12px 18px",
    background: "#00aaff",
    color: "white",
    textAlign: "center",
    borderRadius: "10px",
    fontSize: "1.1rem",
    textDecoration: "none",
    fontWeight: "600",
    boxShadow: "0 0 12px rgba(0,150,255,0.5)"
  }}
>
  💳 Pay Instantly with GPay / PhonePe / Paytm
</a>

            <p className="qr-note">After payment, click I Have Completed The Payment.</p>
          </div>

          <button className="btn-pay" onClick={handleConfirmPayment}>
            I Have Completed Payment
          </button>

          {!user && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button
                className="btn-ghost"
                style={{ width: "60%" }}
                onClick={() => (window.location.href = "/auth")}
              >
                Sign up
              </button>
            </div>
          )}

          <button
            className="btn-whatsapp"
            disabled={!verified || !user}
            style={{
              opacity: !verified || !user ? 0.5 : 1,
              pointerEvents: !verified || !user ? "none" : "auto",
            }}
            onClick={handleSend}
          >
            Send Order via WhatsApp
          </button>

          <button
            className="btn-ghost btn-block"
            style={{ marginTop: 10, color: "red" }}
            onClick={clearCart}
          >
            Clear Order
          </button>
        </div>
      </div>
    </div>
  );
}
