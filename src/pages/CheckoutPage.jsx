// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "Thaayar Kitchen_user";
const ORDER_COUNTER_KEY = "Thaayar Kitchen_order_counter";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();

  const [verified, setVerified] = useState(false);
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Thaayar Kitchen";
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

  // Group cart items by day
  function group(items) {
    const map = {};
    items.forEach((it) => {
      if (!map[it.dayLabel]) map[it.dayLabel] = [];
      map[it.dayLabel].push(it);
    });
    return map;
  }

  // Create WhatsApp message
  function whatsappLink(orderId) {
    const grouped = group(cart);

    let itemsText = "";
    Object.keys(grouped).forEach((day) => {
      const dateLabel = new Date(grouped[day][0].deliveryDate).toLocaleDateString();

      itemsText += `${day} (${dateLabel}):\n`;

      grouped[day].forEach((i) => {
        itemsText += `- ${i.qty || 1}x ${i.name}\n`;
      });

      itemsText += "\n";
    });

    const userText = user ? `${user.name}\n${user.phone}\n${user.address}\n\n` : "";

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

  // Send order to Google Sheet and get REAL orderId
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

    const data = await res.text();
    console.log("SCRIPT RESPONSE:", data);

    return data;   // return orderId from Apps Script output

  } catch (err) {
    console.error("SHEET ERROR:", err);
    return null;
  }
}


  async function handleConfirmPayment() {
    if (!user) return alert("Please sign up first.");
    setVerified(true);
    alert("Payment confirmed — WhatsApp enabled.");
  }

  async function handleSend() {
    if (!verified) return alert("Confirm payment first.");

    const orderId = await sendOrderToSheet();   // ⭐ Get real ID from sheet

    if (!orderId) return alert("Error saving order!");

    window.open(whatsappLink(orderId), "_blank");

    clearCart();
    setTimeout(() => (window.location.href = "/success"), 1200);
  }

 return (
  <div className="checkout-wrapper container fade-in">
    <h1 className="page-title">🧾 Checkout</h1>

    {/* Support Button */}
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
      {/* LEFT SIDE */}
      <div className="checkout-items">
        {cart.length === 0 && (
          <div className="glass-empty">Your cart is empty</div>
        )}

        {cart.map((it) => (
          <div className="glass-card checkout-card-new" key={it.id}>
            <img
              src={it.imageUrl || "/no-image.png"}
              className="checkout-img-new"
            />

            <div className="checkout-content">
              <div className="checkout-title-new">{it.name}</div>

              <div className="checkout-price-line">
                ₹{it.price}
                <span className="checkout-qty-mult">×</span>
                <span>{it.qty || 1}</span>
              </div>

              <div className="checkout-dayTag">
                {it.dayLabel} •{" "}
                <span>{new Date(it.deliveryDate).toLocaleDateString()}</span>
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

      {/* RIGHT SIDE SUMMARY */}
      <div className="checkout-summary glass-card better-summary">

  <h2 className="summary-title">
    Order Summary  
    <span className="summary-sub">(Packing & Delivery included)</span>
  </h2>

  <div className="summary-row">
    <span>Total Amount</span>
    <span className="summary-amount">₹{total}</span>
  </div>

  <div className="checkout-block">
    <label className="label">Delivery Slot</label>
    <select className="select modern-select" value={slot} onChange={(e) => setSlot(e.target.value)}>
      {availableSlots().map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>

  <h3 className="qr-heading">Scan & Pay</h3>

  <div className="qr-card">
    <img src="/gpay-qr.png" className="qr-img" />
  </div>

  <a
  href={`upi://pay?pa=ganeshmuthu2711@okicici&pn=Thaayar%20Kitchen&am=${total}&cu=INR`}

    className="btn-primary-pay"
  >
    💳 Pay with GPay / PhonePe / Paytm
  </a>

  <p className="qr-note">After completing payment click below</p>

  <button className="btn-confirm" onClick={handleConfirmPayment}>
    I Have Completed Payment
  </button>

  {!user && (
    <button className="btn-outline" onClick={() => (window.location.href = "/auth")}>
      Sign up
    </button>
  )}

  <button
    className="btn-whatsapp-final"
    disabled={!verified || !user}
    style={{
      opacity: !verified || !user ? 0.5 : 1,
      pointerEvents: !verified || !user ? "none" : "auto",
    }}
    onClick={handleSend}
  >
    Send Order via WhatsApp
  </button>

  <button className="btn-outline remove" onClick={clearCart}>
    Clear Order
  </button>

</div>

    </div>
  </div>
);

}
