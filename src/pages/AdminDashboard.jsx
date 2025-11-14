import React, { useEffect, useState } from "react";

export default function AdminDashboard(){
  const [orders, setOrders] = useState([]);
  useEffect(()=> {
    async function load(){
      try {
        // Publicly published CSV of orders sheet (or create server endpoint for secure read)
        const url = import.meta.env.VITE_ORDERS_CSV_URL;
        if (!url) return;
        const resp = await fetch(url);
        const text = await resp.text();
        const lines = text.trim().split("\n");
        const headers = lines.shift().split(",");
        const rows = lines.map(l => {
          const cols = l.split(",");
          const o = {};
          headers.forEach((h,i)=> o[h]=cols[i]||"");
          return o;
        });
        setOrders(rows);
      } catch (err) { console.error(err); }
    }
    load();
  },[]);

  const totalRevenue = orders.reduce((s,o) => s + Number(o.totalAmount||0), 0);

  return (
    <div className="container">
      <h1 className="page-title">Admin Dashboard</h1>
      <div className="admin-grid">
        <div className="card"><h3>Total Orders</h3><p>{orders.length}</p></div>
        <div className="card"><h3>Total Revenue</h3><p>₹{totalRevenue}</p></div>
      </div>

      <div style={{marginTop:20}}>
        {orders.map((o, idx) => (
          <div key={idx} className="order-row">
            <div>#{o.orderId}</div>
            <div>Amount: ₹{o.totalAmount}</div>
            <div>Phone: {o.customerPhone}</div>
            <div>Date: {o.createdAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
