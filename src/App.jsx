import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/AdminDashboard";
import SuccessPage from "./pages/SuccessPage";
import FloatingTools from "./components/FloatingTools";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ReviewsPage from "./pages/ReviewsPage";
import Refund from "./pages/Refund";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Shipping from "./pages/Shipping";
// ⭐ IMPORT SCROLL FIX
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <>
      <Header />

      {/* ⭐ AUTO SCROLL FIX */}
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/refund" element={<Refund />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/contact" element={<Contact />} />
<Route path="/terms" element={<Terms />} />
<Route path="/shipping" element={<Shipping />} />
      </Routes>

      <FloatingTools />
    </>
  );
}
