// src/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "sakthi_user";
const ORDER_COUNTER_KEY = "sakthi_order_counter";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();

  const [verified, setVerified] = useState(false);
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Sakthi Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_API_URL;

  // Load user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // --- Only 1 delivery slot ---
  function availableSlots() {
    return ["11:00 AM – 01:00 PM"];
  }

  // --- Lunch cutoff logic ---
  function itemPassesCutoff(item) {
    const itemDateISO = item.deliveryDate
      ? new Date(item.deliveryDate).toISOString().split("T")[0]
      : null;

    if (!itemDateISO) {
      return { ok: false, reason: "Delivery date missing for an item." };
    }

    if ((item.category || "").toLowerCase() !== "lunch") {
      return { ok: true };
    }

    const d = new Date(itemDateISO);
    d.setHours(11, 0, 0, 0); // slot start = 11 AM

    const now = Date.now();
    const cutoffMillis = 12 * 60 * 60 * 1000;

    if (d.getTime() - now < cutoffMillis) {
      return {
        ok: false,
        reason: `Order closed for ${new Date(item.deliveryDate).toLocaleDateString()} (12-hour cutoff).`,
      };
    }

    return { ok: true };
  }

  function validateAllItems() {
    if (!cart.length) return { ok: false, reason: "Cart empty" };

    for (const it of cart) {
      const res = itemPassesCutoff(it);
      if (!res.ok) return res;
    }
    return { ok: true };
  }

  // Group items by day
  function groupItemsByDay(items) {
    const map = {};
    items.forEach((it) => {
      const dateFormatted = new Date(it.deliveryDate).toLocaleDateString();
      const title = `${it.dayLabel} (${dateFormatted})`;

      if (!map[title]) map[title] = [];
      map[title].push(it);
    });
    return map;
  }

  // ----------------------------
  // ⭐ ORDER ID (Auto-increment: T001, T002, T003…)
  // ----------------------------
  function generateOrderId() {
    let current = Number(localStorage.getItem(ORDER_COUNTER_KEY) || "0");
    current += 1;
    localStorage.setItem(ORDER_COUNTER_KEY, current.toString());

    return "T" + String(current).padStart(3, "0");
  }

  // ----------------------------
  // ⭐ WhatsApp Message (NO "Order from")
  // ----------------------------
  function whatsappLink(orderId) {
    const grouped = groupItemsByDay(cart);

    let itemsText = "";
    Object.keys(grouped).forEach((day) => {
      itemsText += `${day}:\n`;
      grouped[day].forEach((i) => {
        const date = new Date(i.deliveryDate).toLocaleDateString();
        itemsText += `- ${i.qty || 1}x ${i.name} (${date})\n`;
      });
      itemsText += `\n`;
    });

    const userText = user ? `${user.name}\n${user.phone}\n${user.address}\n\n` : "";

    const msg = encodeURIComponent(
`${STORE_NAME}

Order ID: ${orderId}

${userText}Order Details:
${itemsText}
Total: ₹${total}
Delivery Slot: ${slot}
Payment: Paid via GPay`
    );

    return `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${msg}`;
  }

  // Save order to Google sheet
  async function sendOrderToSheet(orderId, paymentId = "", method = "GPay") {
    if (!ORDERS_WEBHOOK) return;

    const now = new Date();

    const payload = {
      orderId,
      date: now.toLocaleDateString(),
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
      items: cart
        .map(
          (i) =>
            `${i.qty || 1}x ${i.name} (${new Date(i.deliveryDate).toLocaleDateString()})`
        )
        .join(" | "),
      total,
      slot,
      deliveryDate: cart[0]?.deliveryDate || "",
      customerName: user?.name || "",
      customerPhone: user?.phone || "",
      deliveryAddress: user?.address || "",
      paymentMethod: method,
      paymentStatus: "Paid",
      paymentRef: paymentId,
    };

    try {
      await fetch(ORDERS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}
  }

  async function handleConfirmPayment() {
    const valid = validateAllItems();
    if (!valid.ok) return alert(valid.reason);

    if (!user) return alert("Please sign up before confirming payment.");

    setVerified(true);
    alert("Payment confirmed — WhatsApp order unlocked.");
  }

  async function handleSendOrder() {
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

      <div className="checkout-layout">
        {/* LEFT */}
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

                {/* ⭐ Day + Date */}
                <div className="checkout-day muted">
                  {it.dayLabel} ({new Date(it.deliveryDate).toLocaleDateString()})
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#9fbbe0",
                    marginTop: 6,
                  }}
                >
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

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(it.id)}
                >
                  Remove
                </button>
              </div>

              <div className="checkout-total">
                ₹{it.price * (it.qty || 1)}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="checkout-summary glass-card">
          <h3>Order Summary</h3>

          <small
            className="muted"
            style={{ display: "block", marginBottom: 10 }}
          >
            *Costs include delivery fee and package fee.
          </small>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          {/* Slot selection */}
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
            <small className="muted">
              Lunch orders close 12 hours before 11 AM.
            </small>
          </div>

          {/* QR */}
          <div className="qr-box glass-card">
            <h3 className="qr-title">Scan & Pay using GPay</h3>
            <img src="/gpay-qr.png" className="qr-image" />
            <p className="qr-note">After payment, click Confirm Payment.</p>
          </div>

          <button
            className="btn-pay"
            onClick={handleConfirmPayment}
            disabled={processing}
          >
            I Have Completed Payment
          </button>

          {!user && (
            <button
              className="btn-ghost"
              onClick={() => (window.location.href = "/auth")}
            >
              Sign up
            </button>
          )}

          <button
            className="btn-whatsapp"
            disabled={!verified || !user}
            style={{
              opacity: !verified || !user ? 0.5 : 1,
              pointerEvents: !verified || !user ? "none" : "auto",
            }}
            onClick={handleSendOrder}
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
