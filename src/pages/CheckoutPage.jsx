// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "Thaayar Kitchen_user";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();
  const [slot, setSlot] = useState("11:00 AM – 01:00 PM");
  const [user, setUser] = useState(null);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Thaayar Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_WEBHOOK;

  // Load user
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

  // Send to Google Sheet
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

  // Razorpay Payment Start
  async function startRazorpayPayment() {
    if (!user) return alert("Please sign up before checkout.");

    // Create razorpay order
    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total * 100 }),
    });

    const { order, key } = await orderRes.json();

    const options = {
      key,
      amount: order.amount,
      currency: "INR",
      name: "Thaayar Kitchen",
      description: "Food Order Payment",
      order_id: order.id,

      handler: async function (response) {
        // Verify payment
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderData: {
              orderId: order.id,
              customerName: user.name,
              customerPhone: user.phone,
              items: cart,
              totalAmount: total,
            },
          }),
        });

        const verifyJson = await verifyRes.json();

        if (!verifyJson.verified) {
          alert("Payment verification failed!");
          return;
        }

        // Save to sheet, get final Order ID
        const finalOrderId = await sendOrderToSheet(order.id);

        // Send to WhatsApp
        window.open(whatsappLink(finalOrderId || order.id), "_blank");

        clearCart();
        window.location.href = "/success";
      },

      theme: { color: "#0080ff" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
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
        {/* ITEMS */}
        <div className="checkout-items">
          {cart.length === 0 && (
            <div className="glass-empty">Your cart is empty</div>
          )}

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
            Order Summary <span className="summary-sub">(Includes delivery)</span>
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

          {/* ⭐ RAZORPAY BUTTON */}
          <button
            className="btn-confirm"
            onClick={startRazorpayPayment}
            style={{
              background:
                "linear-gradient(135deg, #00c6ff, #0072ff)",
              color: "#fff",
              borderRadius: "12px",
              padding: "14px",
              marginTop: "20px",
              fontSize: "17px",
              width: "100%",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            💳 Pay Securely with Razorpay
          </button>

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
