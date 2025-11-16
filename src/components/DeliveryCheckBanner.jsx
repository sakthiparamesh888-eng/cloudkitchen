import React, { useEffect, useState } from "react";

export default function DeliveryCheckBanner() {
  const [showBanner, setShowBanner] = useState(true);

  const WHATSAPP = "+918524845927";

  async function getIPLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return {
        lat: data.latitude,
        lng: data.longitude,
      };
    } catch {
      return null;
    }
  }

  function openWhatsApp(lat, lng) {
    const link = `https://maps.google.com/?q=${lat},${lng}`;
    const msg = `This is my live location: ${link}. Is delivery possible?`;

    window.open(
      `https://wa.me/${WHATSAPP.replace("+", "")}?text=${encodeURIComponent(
        msg
      )}`,
      "_blank"
    );

    // Keep banner, don't hide permanently
    // setShowBanner(false);
  }

  function handleCheckLocation() {
    if (!navigator.geolocation) {
      alert("Location services not supported — using network location.");
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        openWhatsApp(pos.coords.latitude, pos.coords.longitude);
      },
      async (err) => {
        console.warn("High accuracy failed:", err);

        // Try AGAIN with low accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            openWhatsApp(pos.coords.latitude, pos.coords.longitude);
          },
          async () => {
            // Final fallback → IP based location
            const ipLoc = await getIPLocation();
            if (ipLoc) {
              openWhatsApp(ipLoc.lat, ipLoc.lng);
            } else {
              alert("Unable to get your location. Please turn on GPS.");
            }
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function fallbackToIP() {
    const ipLoc = await getIPLocation();
    if (ipLoc) {
      openWhatsApp(ipLoc.lat, ipLoc.lng);
    } else {
      alert("Unable to determine location.");
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.banner}>
        <div style={styles.left}>
          <span style={styles.icon}>📍</span>
          <span style={styles.text}>Check Delivery Availability for Your Location</span>
        </div>

        <button style={styles.btn} onClick={handleCheckLocation}>
          Check Now
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "10px",
    animation: "fadeSlide 0.7s ease",
  },

  banner: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    background: "rgba(0, 122, 255, 0.12)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(0, 150, 255, 0.35)",
    boxShadow: "0 0 28px rgba(0,140,255,0.25)",

    color: "#dff2ff",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  icon: {
    fontSize: "23px",
    filter: "drop-shadow(0 0 6px rgba(0,150,255,0.8))",
  },

  text: {
    fontSize: "1rem",
    fontWeight: "600",
    letterSpacing: "0.3px",
    textShadow: "0 0 8px rgba(0,150,255,0.6)",
  },

  btn: {
    background: "linear-gradient(90deg,#3b82f6,#1e40af)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "12px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0,140,255,0.4)",
    transition: "0.25s",
  },
};
