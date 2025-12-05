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

  // ✅ SAFE UPI ID
  const UPI_ID = "8524845927@okbizaxis";

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

  // ✅ SAFE HTTPS UPI PAYMENT LINK (NO RISK WARNING)
  function getUpiLink() {
    const name = encodeURIComponent(STORE_NAME);
    const amount = total;
    const note = encodeURIComponent("Thaayar Kitchen Order Payment");

    return `https://upi.link/pay?pa=${UPI_ID}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
  }

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

  async function sendOrderToSheet(orderId) {
    if (!ORDERS_WEBHOOK) return null;

    const now = new Date();
    const orderPlacedAt = now.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: true,
    });

    const payload = {
      Name: user?.name || "",
      Phone: user?.phone || "",
      Address: user?.address || "",
      "Order Items": cart
        .map(
          (i) =>
            `${i.qty || 1}x ${i.name} (${new Date(
              i.deliveryDate
            ).toLocaleDateString()})`
        )
        .join(" | "),
      Amount: total,
      Slot: slot,
      Date: now.toLocaleDateString(),
      orderPlacedAt,
      orderId,
    };

    try {
      const res = await fetch(ORDERS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await res.json();
      if (data?.success && data?.orderId) return data.orderId;
      return null;
    } catch (err) {
      console.error("Sheet ERROR:", err);
      return null;
    }
  }

  // ✅ MODIFIED CONFIRM BUTTON — NOW OPENS SAFE UPI PAYMENT
  function handleConfirmPayment() {
    if (!user) return alert("Please sign up before confirming your payment.");

    window.open(getUpiLink(), "_blank");

    setTimeout(() => {
      setVerified(true);
      alert("Payment completed. You can now send the order.");
    }, 6000);
  }

  async function handleSend() {
    if (!verified) return alert("Confirm payment first.");

    const finalOrderId = await sendOrderToSheet(Date.now());
    window.open(whatsappLink(finalOrderId), "_blank");

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
              <img src={it.imageUrl || "/no-image.png"} className="checkout-img-new" alt={it.name} />

              <div className="checkout-content">
                <div className="checkout-title-new">{it.name}</div>
                <div className="checkout-price-line">₹{it.price} × {it.qty || 1}</div>

                <div className="qty-controls-modern">
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>−</button>
                  <span>{it.qty || 1}</span>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>+</button>
                </div>

                <button className="remove-btn-modern" onClick={() => removeFromCart(it.id)}>
                  Remove
                </button>
              </div>

              <div className="checkout-total-new">₹{it.price * (it.qty || 1)}</div>
            </div>
          ))}
        </div>

        <div className="checkout-summary glass-card better-summary">
          <h2 className="summary-title">
            Order Summary <span className="summary-sub">(Includes delivery)</span>
          </h2>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          <button
            className="btn-confirm"
            onClick={handleConfirmPayment}
            disabled={!user}
            style={{ opacity: user ? 1 : 0.4, marginTop: 15 }}
          >
            💳 Pay ₹{total} via UPI
          </button>

          <button
            className="btn-whatsapp-final"
            disabled={!verified || !user}
            onClick={handleSend}
            style={{ opacity: !verified || !user ? 0.4 : 1, marginTop: 12 }}
          >
            📩 Send Order via WhatsApp
          </button>

          <button className="btn-outline remove" onClick={clearCart} style={{ marginTop: 10 }}>
            Clear Order
          </button>
        </div>
      </div>
    </div>
  );
}
