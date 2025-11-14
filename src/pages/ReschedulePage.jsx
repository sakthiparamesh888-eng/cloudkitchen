// src/pages/ReschedulePage.jsx
import React, {useState} from "react";
import { isAtLeast24HoursFromNow } from "../utils/date";

export default function ReschedulePage(){
  const [orderId,setOrderId] = useState("");
  const [newDate,setNewDate] = useState("");
  const [newSlot,setNewSlot] = useState("");
  const [msg,setMsg] = useState("");

  async function submit(){
    if(!orderId) return setMsg("Enter order id");
    if(!newDate || !newSlot) return setMsg("Pick date and slot");
    if(!isAtLeast24HoursFromNow(newDate,newSlot)) return setMsg("Reschedule must be done 24+ hours before delivery");

    const payload = { action:"reschedule", orderId, newDate, newSlot };
    const url = import.meta.env.VITE_ORDERS_UPDATE_URL;
    if(!url) return setMsg("No update webhook configured");
    try {
      const r = await fetch(url,{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload)});
      const j = await r.json();
      setMsg(j.success ? "Reschedule requested" : "Failed to reschedule");
    } catch(e){
      setMsg("Network error");
    }
  }

  return (
    <div className="container">
      <h2>Reschedule Order</h2>
      <div style={{maxWidth:560}}>
        <label>Order ID</label>
        <input className="select" value={orderId} onChange={e=>setOrderId(e.target.value)} />
        <label>New Delivery Date</label>
        <input type="date" className="select" value={newDate} onChange={e=>setNewDate(e.target.value)} />
        <label>New Slot</label>
        <select className="select" value={newSlot} onChange={e=>setNewSlot(e.target.value)}>
          <option value="">-- slot --</option>
          <option>06:00 AM - 07:00 AM</option>
          <option>12:00 PM - 01:00 PM</option>
          <option>06:00 PM - 07:00 PM</option>
        </select>
        <div style={{marginTop:12}}>
          <button className="btn-primary" onClick={submit}>Submit Reschedule</button>
        </div>
        {msg && <div style={{marginTop:12,color:"var(--muted)"}}>{msg}</div>}
      </div>
    </div>
  );
}
