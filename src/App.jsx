import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/AdminDashboard";
import FloatingCart from "./components/FloatingCart";
import SuccessPage from "./pages/SuccessPage";
import FloatingTools from "./components/FloatingTools";

export default function App(){
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/success" element={<SuccessPage />} />

      </Routes>
      <FloatingCart />
     
    </>
  );
}
