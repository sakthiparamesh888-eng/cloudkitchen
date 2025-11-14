import React, { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();

  const [verified, setVerified] = useState(false); // locked by default
  const [slot, setSlot] = useState("");

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Sakthi Kitchen";

  // ⭐ NEW: Group items by day
  function groupItemsByDay(cart) {
    const map = {};
    cart.forEach((item) => {
      const day = item.day || "No Day Assigned";
      if (!map[day]) map[day] = [];
      map[day].push(item);
    });
    return map;
  }

  // ⭐ UPDATED WHATSAPP MESSAGE → grouped by day
  function whatsappLink() {
  const grouped = groupItemsByDay(cart);

  let itemsText = "";

  Object.keys(grouped).forEach(day => {
    itemsText += `${day}:\n`;
    grouped[day].forEach(i => {
      itemsText += `- ${i.qty || 1}x ${i.name}\n`;
    });
    itemsText += `\n`;
  });

  const msg = encodeURIComponent(
    `New Order from ${STORE_NAME}

Order Details:
${itemsText}
Total: ₹${total}
Delivery Slot: ${slot}
Payment: Paid via GPay`
  );

  return `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${msg}`;
}


  return (
    <div className="checkout-wrapper">
      <h1 className="page-title">🧾 Checkout</h1>

      <div className="checkout-layout">

        {/* LEFT SIDE — CART ITEMS */}
        <div className="checkout-items">
          {cart.map((it) => (
            <div className="checkout-card" key={it.id}>
              <img
                src={it.imageUrl || "/no-image.png"}
                className="checkout-img"
                alt={it.name}
              />

              <div className="checkout-info">
                <div className="checkout-title">{it.name}</div>
                <div className="checkout-sub">₹{it.price}</div>

                {/* ⭐ NEW: Show Day */}
                <div className="checkout-day">
                  Day: {it.day || "Not Assigned"}
                </div>

                <div className="qty-controls">
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>
                    –
                  </button>
                  <span>{it.qty}</span>
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

        {/* RIGHT SIDE — SUMMARY */}
        <div className="checkout-summary glass-card">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          {/* Delivery Slot */}
          <div className="checkout-block">
            <label className="label">Select Delivery Slot</label>

            <select
              className="select"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              <option value="">-- Select Delivery Slot --</option>
              <option value="6:00 AM - 7:00 AM">6:00 AM - 7:00 AM</option>
              <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</option>
              <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
              <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
              <option value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM</option>
            </select>
          </div>

          {/* GPay QR PAYMENT */}
          <div className="qr-box glass-card">
            <h3 className="qr-title">Scan & Pay using UPI</h3>

            <img
              src="/gpay-qr.png"
              alt="GPay QR"
              className="qr-image"
            />

            <p className="qr-note">
              After payment, WhatsApp Order button will unlock.
            </p>
          </div>

          {/* CONFIRM PAYMENT */}
          <button
            className="btn-pay"
            onClick={() => {
              if (!slot) return alert("Please select a delivery slot first.");
              setVerified(true);
              alert("Payment confirmed! WhatsApp order enabled.");
            }}
          >
            I Have Completed Payment
          </button>

          {/* WHATSAPP BUTTON — BLOCKED UNTIL PAYMENT */}
          <button
            className="btn-whatsapp"
            disabled={!verified}
            style={{
              opacity: !verified ? 0.5 : 1,
              pointerEvents: !verified ? "none" : "auto",
              cursor: !verified ? "not-allowed" : "pointer"
            }}
            onClick={() => {
              if (!verified) return;

              const apiURL = import.meta.env.VITE_ORDERS_API_URL;

              const now = new Date();
              const orderData = {
                orderId: "ORD_" + Date.now(),
                date: now.toLocaleDateString(),
                month: now.toLocaleString("default", { month: "long" }),
                year: now.getFullYear(),

                // ⭐ UPDATED: include day for each item
                items: cart
                  .map(i => `${i.qty}x ${i.name} (Day: ${i.day || "NA"})`)
                  .join(", "),

                total: total,
                slot: slot,
                customerPhone: "",
                paymentMethod: "GPay",
                paymentStatus: "Paid"
              };

              // SAVE TO GOOGLE SHEET
              fetch(apiURL, {
                method: "POST",
                body: JSON.stringify(orderData)
              });

              // SEND TO WHATSAPP
              window.open(whatsappLink(), "_blank");

              // CLEAR CART
              clearCart();

              // SUCCESS PAGE
              setTimeout(() => {
                window.location.href = "/success";
              }, 1500);
            }}
          >
            {(!verified || !slot)
              ? "Complete Payment + Select Slot"
              : "Send Order via WhatsApp"}
          </button>

          {/* CLEAR CART */}
          <button
            className="btn-ghost btn-block"
            style={{ marginTop: "10px", color: "red", borderColor: "red" }}
            onClick={clearCart}
          >
            Clear Order
          </button>

        </div>
      </div>
    </div>
  );
}
