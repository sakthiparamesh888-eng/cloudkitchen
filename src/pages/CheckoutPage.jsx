// src/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";

const STORAGE_KEY = "sakthi_user";

/**
 * Checkout page
 *
 * Rules implemented:
 * - Only slot available: "12:00 PM - 01:00 PM"
 * - For any cart item with category === "lunch", ordering closes 12 hours before that
 *   day's 12:00 PM start (i.e. cutoff = deliveryDate @ 00:00 local time).
 * - All items must share the same selected deliveryDate in the UI (to avoid mismatch).
 * - User must sign up (localStorage sakthi_user) before sending order.
 */

export default function CheckoutPage() {
  const { cart, total, updateQty, removeFromCart, clearCart } = useCart();

  // local state
  const [verified, setVerified] = useState(false);
  const [slot, setSlot] = useState("12:00 PM - 01:00 PM"); // only slot
  const [deliveryDate, setDeliveryDate] = useState("");
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  const WHATSAPP_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
  const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Sakthi Kitchen";
  const ORDERS_WEBHOOK = import.meta.env.VITE_ORDERS_API_URL;

  // prefill deliveryDate from first cart item if available
  useEffect(() => {
    if (!cart || cart.length === 0) return;
    const first = cart.find((c) => c.deliveryDate);
    if (first && !deliveryDate) {
      // ensure it's ISO yyyy-mm-dd (if item.deliveryDate has time, keep date part)
      const iso = new Date(first.deliveryDate).toISOString().split("T")[0];
      setDeliveryDate(iso);
    }
  }, [cart]);

  // load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  // helper — available slots (only one)
  function availableSlots() {
    return ["12:00 PM - 01:00 PM"];
  }

  // parse slot start time (only used for 12:00 PM here)
  function parseSlotStart(dateISO, slotString) {
    if (!dateISO || !slotString) return null;
    // slotString like "12:00 PM - 01:00 PM"
    const date = new Date(dateISO);
    // set to 12:00 local time
    date.setHours(12, 0, 0, 0);
    return date;
  }

  // check whether a particular cart item is allowed (not past cutoff)
  // For lunch items we enforce 12 hour cutoff before slot start (which is 12:00 PM)
  function itemPassesCutoff(item, selectedDateISO) {
    // if item has no deliveryDate we fall back to selectedDateISO
    const itemDateISO = item.deliveryDate
      ? new Date(item.deliveryDate).toISOString().split("T")[0]
      : selectedDateISO;

    if (!itemDateISO) return { ok: false, reason: "Missing delivery date for an item." };

    if ((item.category || "").toLowerCase() !== "lunch") {
      // non-lunch items do not close
      return { ok: true };
    }

    const slotStart = parseSlotStart(itemDateISO, "12:00 PM - 01:00 PM");
    if (!slotStart) return { ok: false, reason: "Invalid slot date/time." };

    const now = Date.now();
    const cutoffMillis = 12 * 60 * 60 * 1000; // 12 hours
    if (slotStart.getTime() - now < cutoffMillis) {
      return {
        ok: false,
        reason: `Lunch for ${new Date(itemDateISO).toLocaleDateString()} closed (must be ordered ≥12 hours before).`,
        date: itemDateISO,
      };
    }
    return { ok: true };
  }

  // validate all cart items before allowing payment confirmation
  function validateAllItemsAgainstCutoff(selectedDateISO) {
    if (!cart || cart.length === 0) return { ok: false, reason: "Cart is empty" };

    // ensure selectedDateISO equals all items' deliveryDate if items provide one
    const itemsWithDates = cart.filter((c) => c.deliveryDate);
    if (itemsWithDates.length > 0) {
      // check all item dates equal selectedDateISO
      const mismatches = itemsWithDates.filter(
        (it) => (new Date(it.deliveryDate).toISOString().split("T")[0]) !== selectedDateISO
      );
      if (mismatches.length > 0) {
        return { ok: false, reason: "All items must be for the same delivery date. Adjust cart or select a matching date." };
      }
    }

    // check each item passes cutoff rules
    for (const it of cart) {
      const res = itemPassesCutoff(it, selectedDateISO);
      if (!res.ok) return { ok: false, reason: res.reason || "Item cutoff failed" };
    }

    return { ok: true };
  }

  // group items by dayLabel for WhatsApp
  function groupItemsByDay(items) {
    const map = {};
    (items || []).forEach((it) => {
      const dayLabel = it.dayLabel || (it.day ? it.day : "No Day Assigned");
      if (!map[dayLabel]) map[dayLabel] = [];
      map[dayLabel].push(it);
    });
    return map;
  }

  // build WhatsApp link (no double-encoding)
  function whatsappLink() {
    const grouped = groupItemsByDay(cart);

    let itemsText = "";
    Object.keys(grouped).forEach((day) => {
      itemsText += `${day}:\n`;
      grouped[day].forEach((i) => {
        itemsText += `- ${i.qty || 1}x ${i.name}\n`;
      });
      itemsText += `\n`;
    });

    const userText = user ? `${user.name}\n${user.phone}\n${user.address}\n\n` : "";

    const msg = encodeURIComponent(
      `New Order from ${STORE_NAME}\n\n${userText}Order Details:\n${itemsText}Total: ₹${total}\nDelivery Slot: ${slot}\nDelivery Date: ${deliveryDate || "Not specified"}\nPayment: Paid via GPay`
    );

    return `https://wa.me/${WHATSAPP_NUM.replace(/\+/g, "")}?text=${msg}`;
  }

  // save to sheet (if webhook provided)
  async function sendOrderToSheet(paymentId = "", method = "GPay") {
    if (!ORDERS_WEBHOOK) return;
    const now = new Date();
    const payload = {
      orderId: "ORD_" + Date.now(),
      date: now.toLocaleDateString(),
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
      items: cart.map(i => `${i.qty || 1}x ${i.name} (for ${i.deliveryDate ? new Date(i.deliveryDate).toLocaleDateString() : deliveryDate || "N/A"})`).join(" | "),
      total,
      slot,
      deliveryDate,
      customerName: user ? user.name : "",
      customerPhone: user ? user.phone : "",
      deliveryAddress: user ? user.address : "",
      paymentMethod: method,
      paymentStatus: "Paid",
      paymentRef: paymentId
    };

    try {
      await fetch(ORDERS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Failed to send order to sheet", e);
    }
  }

  // user clicks "I Have Completed Payment"
  async function handleConfirmPayment() {
    if (!cart || cart.length === 0) return alert("Your cart is empty.");
    if (!deliveryDate) return alert("Please select a delivery date.");
    if (!slot) return alert("Please select the delivery slot.");

    const selectedIso = new Date(deliveryDate).toISOString().split("T")[0];

    const valid = validateAllItemsAgainstCutoff(selectedIso);
    if (!valid.ok) {
      return alert(valid.reason);
    }

    if (!user) return alert("Please sign up / login before confirming payment.");

    // mark verified (manual payment flow)
    setVerified(true);
    alert("Payment confirmed — WhatsApp order enabled.");
  }

  // when user clicks send order (WhatsApp)
  async function handleSendOrder() {
    if (!verified || !user) return alert("Complete payment and ensure you are signed in.");
    // save to sheet (best-effort)
    await sendOrderToSheet("", "GPay");
    // open whatsapp
    window.open(whatsappLink(), "_blank");
    clearCart();
    setTimeout(() => (window.location.href = "/success"), 1200);
  }

  // small helpers for UI
  const firstCartDate = useMemo(() => {
    const c = cart.find((x) => x.deliveryDate);
    if (!c) return "";
    return new Date(c.deliveryDate).toISOString().split("T")[0];
  }, [cart]);

  return (
    <div className="checkout-wrapper container">
      <h1 className="page-title">🧾 Checkout</h1>

      <div className="checkout-layout">
        {/* LEFT — cart items */}
        <div className="checkout-items">
          {(!cart || cart.length === 0) && <div className="glass-card">Your cart is empty</div>}

          {cart.map((it) => (
            <div className="checkout-card" key={it.id}>
              <img src={it.imageUrl || "/no-image.png"} className="checkout-img" alt={it.name} />
              <div className="checkout-info">
                <div className="checkout-title">{it.name}</div>
                <div className="checkout-sub">₹{it.price}</div>
                <div className="checkout-day muted">Day: {it.dayLabel || it.day || "Not Assigned"}</div>
                <div style={{ fontSize: 13, color: "#9fbbe0", marginTop: 6 }}>
                  {it.category ? `Category: ${it.category}` : ""}
                </div>

                <div className="qty-controls" style={{ marginTop: 8 }}>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) - 1)}>-</button>
                  <span style={{ padding: "0 8px" }}>{it.qty || 1}</span>
                  <button onClick={() => updateQty(it.id, (it.qty || 1) + 1)}>+</button>
                </div>

                <button className="remove-btn" onClick={() => removeFromCart(it.id)}>Remove</button>
              </div>

              <div className="checkout-total">₹{it.price * (it.qty || 1)}</div>
            </div>
          ))}
        </div>

        {/* RIGHT — summary */}
        <div className="checkout-summary glass-card">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Total Amount</span>
            <span className="summary-amount">₹{total}</span>
          </div>

          <div className="checkout-block">
            <label className="label">Delivery Date</label>
            <input
              className="select"
              type="date"
              value={deliveryDate || firstCartDate || ""}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <small className="muted">If your cart items already have a delivery date, the selected date must match them.</small>
          </div>

          <div className="checkout-block">
            <label className="label">Delivery Slot</label>
            <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="">-- Select Delivery Slot --</option>
              {availableSlots().map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <small className="muted">All orders deliver in the 12:00 PM - 01:00 PM slot. Lunch orders close 12 hours before slot start.</small>
          </div>

          <div className="qr-box glass-card">
            <h3 className="qr-title">Scan & Pay using GPay</h3>
            <img src="/gpay-qr.png" alt="GPay QR" className="qr-image" />
            <p className="qr-note">After payment, click Confirm Payment to enable the WhatsApp order button.</p>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button className="btn-pay" onClick={handleConfirmPayment} disabled={processing}>
              {processing ? "Processing..." : "I Have Completed Payment"}
            </button>

            {!user && (
              <button
                className="btn-ghost"
                onClick={() => { window.location.href = "/auth"; }}
              >
                Sign up
              </button>
            )}
          </div>

          <button
            className="btn-whatsapp"
            disabled={!verified || !user}
            style={{
              opacity: (!verified || !user) ? 0.5 : 1,
              pointerEvents: (!verified || !user) ? "none" : "auto",
              cursor: (!verified || !user) ? "not-allowed" : "pointer"
            }}
            onClick={handleSendOrder}
          >
            {(!verified || !user) ? "Complete Payment + Sign-up" : "Send Order via WhatsApp"}
          </button>

          <button className="btn-ghost btn-block" style={{ marginTop: 10, color: "red" }} onClick={clearCart}>
            Clear Order
          </button>
        </div>
      </div>
    </div>
  );
}
