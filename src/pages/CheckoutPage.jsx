// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "Thaayar Kitchen_user";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();
  const [verified, setVerified] = useState(false); // user confirmed payment
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Thaayar Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_WEBHOOK;

  // load user from localStorage (keep your existing behavior)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  function availableSlots() {
    return ["11:00 AM – 01:00 PM"];
  }

  // group items by day label (unchanged)
  function group(items) {
    const map = {};
    items.forEach((it) => {
      if (!map[it.dayLabel]) map[it.dayLabel] = [];
      map[it.dayLabel].push(it);
    });
    return map;
  }

  // whatsapp message generator (unchanged)
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

  // send order to sheet (unchanged)
  async function sendOrderToSheet() {
    if (!ORDERS_WEBHOOK) return null;

    const now = new Date();
    const payload = {
      Name: user?.name || "",
      Phone: user?.phone || "",
      Address: user?.address || "",
      "Order Items": cart
        .map((i) => `${i.qty || 1}x ${i.name} (${new Date(i.deliveryDate).toLocaleDateString()})`)
        .join(" | "),
      Amount: total,
      Slot: slot,
      Date: now.toLocaleDateString(),
    };

    try {
      const res = await fetch(ORDERS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload).toString(),
      });

      return await res.text(); // returned order id expected
    } catch (err) {
      console.error("SHEET ERROR:", err);
      return null;
    }
  }

  // user clicks confirm payment (manual)
  function handleConfirmPayment() {
    if (!user) {
      return alert("Please sign up before confirming your payment.");
    }

    // Keep behavior: user must manually confirm after paying via UPI/QR
    setVerified(true);
    alert("Payment confirmed — You can now send the order via WhatsApp.");
  }

  // send order via whatsapp after saving to sheet
  async function handleSend() {
    if (!verified) return alert("Please confirm payment first.");

    const orderId = await sendOrderToSheet();
    if (!orderId) return alert("Unable to save order. Try again.");

    window.open(whatsappLink(orderId), "_blank");
    clearCart();
    setTimeout(() => (window.location.href = "/success"), 900);
  }

  // Universal UPI payment URL (Google Pay universal link)
  // uses your confirmed UPI id: 9841857762@ybl
  function universalUpiLink(amount) {
    // amount should be number/string with decimal if needed
    const amt = encodeURIComponent(amount);
    const pa = encodeURIComponent("9841857762@ybl");
    const pn = encodeURIComponent("Thaayar Kitchen");
    // Google Pay universal link
    return `https://pay.google.com/gp/p/ui/pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR`;
  }

  return (
    <div className="checkout-wrapper container fade-in">
      <h1 className="page-title">🧾 Checkout</h1>

      {/* support badge (unchanged) */}
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
        {/* LEFT: cart items */}
        <div className="checkout-items">
          {cart.length === 0 && <div className="glass-empty">Your cart is empty</div>}

          {cart.map((it) => (
            <div className="glass-card checkout-card-new" key={it.id}>
              <img src={it.imageUrl || "/no-image.png"} className="checkout-img-new" alt={it.name} />

              <div className="checkout-content">
                <div className="checkout-title-new">{it.name}</div>

                <div className="checkout-price-line">₹{it.price} × {it.qty || 1}</div>

                <div className="checkout-dayTag">
                  {it.dayLabel} • {new Date(it.deliveryDate).toLocaleDateString()}
                </div>

                <div className="checkout-cat">Category: {it.category}</div>

                <div className="qty-controls-modern">
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>−</button>
                  <span>{it.qty || 1}</span>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>+</button>
                </div>

                <button className="remove-btn-modern" onClick={() => removeFromCart(it.id)}>Remove</button>
              </div>

              <div className="checkout-total-new">₹{it.price * (it.qty || 1)}</div>
            </div>
          ))}
        </div>

        {/* RIGHT: summary + payment */}
        <div className="checkout-summary glass-card better-summary">
          <h2 className="summary-title">
            Order Summary <span className="summary-sub">(Includes delivery)</span>
          </h2>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          <label className="label">Delivery Slot</label>
          <select className="select modern-select" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {availableSlots().map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <h3 className="qr-heading">Scan to Pay OR Tap to Pay</h3>

          {/* QR image (for scanning) */}
          <div className="qr-card">
            <img src="/gpay-qr.png" className="qr-img" alt="Scan to pay" />
            <p className="qr-note"></p>
          </div>

          {/* Universal UPI Link button (works across apps / fallback) */}
          <a
            href={universalUpiLink(total)}
            className="btn-modern-pay"
            onClick={(e) => {
              if (!user) {
                // block direct navigation if user not signed up
                e.preventDefault();
                alert("Please sign up before making payment.");
                // optional: redirect to signup
                // window.location.href = "/auth";
              }
            }}
            style={{
              opacity: user ? 1 : 0.4,
              pointerEvents: user ? "auto" : "none",
              textDecoration: "none",
              display: "inline-block",
              textAlign: "center"
            }}
            title={user ? "Opens payment options (GPay/PhonePe/Paytm)" : "Sign up required"}
          >
            💳 Pay Securely
          </a>

          {/* manual confirm payment */}
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

          {/* signup helper - glowing prompt */}
          {!user && (
            <button
              className="btn-outline"
              onClick={() => (window.location.href = "/auth")}
              title="Sign up is required so we can deliver to your address"
              style={{
                boxShadow: "0 0 15px rgba(34,197,94,0.75)",
                borderColor: "rgba(34,197,94,0.6)",
                color: "#7bff9f",
                animation: "pulseGreen 1.5s infinite",
                marginTop: 10,
              }}
            >
              ✨ Sign up to Continue
            </button>
          )}

          {/* send order via WhatsApp (only after confirm + signup) */}
          <button
            className="btn-whatsapp-final"
            disabled={!verified || !user}
            onClick={handleSend}
            style={{
              opacity: !verified || !user ? 0.4 : 1,
              pointerEvents: !verified || !user ? "none" : "auto",
              marginTop: 12
            }}
          >
            📩 Send Order via WhatsApp
          </button>

          <button className="btn-outline remove" onClick={clearCart} style={{ marginTop: 10 }}>
            Clear Order
          </button>
        </div>
      </div>

      {/* small inline styles for animation */}
      <style>{`
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 6px rgba(34,197,94,0.4); transform: translateY(0); }
          50% { box-shadow: 0 0 20px rgba(34,197,94,0.9); transform: translateY(-2px); }
          100% { box-shadow: 0 0 6px rgba(34,197,94,0.4); transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
