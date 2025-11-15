// src/pages/AboutPage.jsx
import React from "react";

export default function AboutPage() {
  return (
    <div
      className="container"
      style={{
        padding: "40px 20px",
        animation: "fadeIn 0.8s ease",
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: "50px 35px",
          borderRadius: "30px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 0 25px rgba(0, 140, 255, 0.25)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#bcdcff",
            fontSize: "2.7rem",
            fontWeight: "600",
            marginBottom: "20px",
            textShadow: "0 0 12px rgba(0,150,255,0.8)",
          }}
        >
          About Thayaar Kitchen
        </h1>

        <p
          style={{
            color: "#d5e9ff",
            fontSize: "1.2rem",
            lineHeight: "1.9",
            maxWidth: "900px",
            margin: "0 auto 35px auto",
            textAlign: "center",
          }}
        >
          Homemade South Indian Food – Light, Tasty & Heartwarming.
          <br />
          Freshly prepared , every bite filled with  purity, and tradition.
        </p>

        {/* Why Choose Box */}
        <div
          style={{
            maxWidth: "750px",
            margin: "0 auto",
            padding: "25px",
            borderRadius: "20px",
            background: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 15px rgba(0,150,255,0.2)",
          }}
        >
          <h3
            style={{
              color: "#ff9edc",
              fontSize: "1.6rem",
              textAlign: "center",
              marginBottom: "22px",
              textShadow: "0 0 10px rgba(255,70,150,0.7)",
            }}
          >
            🌸 Why Choose Thayaar Kitchen?
          </h3>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              color: "#dff9ff",
              fontSize: "1.2rem",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <li>✅ Homemade & Hygienic</li>
            <li>✅ No Preservatives</li>
            <li>✅ Cooked Fresh Every Day</li>
          </ul>
        </div>

        {/* Final Message */}
        <p
          style={{
            color: "#d5e9ff",
            fontSize: "1.2rem",
            lineHeight: "1.9",
            textAlign: "center",
            maxWidth: "900px",
            margin: "40px auto 0 auto",
          }}
        >
          Fresh • Hygienic • Traditional South Indian Meals
          <br />
          <br />
          Thayaar Kitchen delivers “Ammavin Samayal Taste” right to your
          doorstep — bringing the warmth of Amma’s Samayal straight to your
          plate ❤️
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
