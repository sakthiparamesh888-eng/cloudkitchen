import React from "react";
import { Link } from "react-router-dom";

export default function SuccessPage() {
  return (
    <div className="success-wrapper fade-in">
      <div className="success-card">

        {/* Checkmark */}
        <div className="checkmark-circle">
          <div className="checkmark"></div>
        </div>

        <h1 className="success-title">Order Placed 🎉</h1>
        <p className="success-sub">Your order has been received!</p>

        {/* Section 1 */}
        <div className="success-box">
          <h3>Homemade South Indian Meals</h3>
          <p>Light • Hygienic • Tasty</p>
        </div>

        {/* Section 2 */}
        <div className="success-box">
          <ul className="success-list">
            <li>Homemade & Fresh</li>
            <li>No Preservatives</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="success-box">
          <p>
            Thaayar Kitchen brings <strong>Ammavin Samayal Suvai</strong> straight to your plate ❤️
          </p>
        </div>

        <Link to="/">
          <button className="success-btn">Back to Home</button>
        </Link>

      </div>
    </div>
  );
}
