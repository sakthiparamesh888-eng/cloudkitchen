import React from "react";
import { Link } from "react-router-dom";

export default function SuccessPage() {
  return (
    <div className="success-wrapper">
      <div className="success-card">
        
        <div className="checkmark-circle">
          <div className="checkmark"></div>
        </div>

        <h1>Order Placed Successfully! 🎉</h1>
        <p>Your order has been received.  
        We will prepare it fresh and deliver it tomorrow.</p>

        <Link to="/">
          <button className="success-btn">Back to Home</button>
        </Link>
      </div>
    </div>
  );
}
