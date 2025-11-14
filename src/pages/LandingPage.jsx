// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function LandingPage(){
  const navigate = useNavigate();
  const [activeMeal, setActiveMeal] = useState("lunch");

  const meals = [
    {id:"breakfast", label:"Breakfast", icon:"☕"},
    {id:"lunch", label:"Lunch", icon:"🍱"},
    {id:"dinner", label:"Dinner", icon:"🍛"},
    {id:"snacks", label:"Snacks", icon:"🍪"},
  ];

  useEffect(()=>{
    // Try to read activeMeal from CSV sheet (a dedicated row "activeMeal" optional)
    (async ()=>{
      try {
        const url = import.meta.env.VITE_SHEET_MENU_CSV_URL;
        const r = await fetch(url);
        const txt = await r.text();
        const rows = parseCSV(txt);
        // look for a header field activeMeal OR a row with "activeMeal" key
        const found = rows.find(r => r.activeMeal && r.activeMeal.trim()!=="");
        if(found) setActiveMeal(found.activeMeal.trim().toLowerCase());
      } catch(e){
        // ignore
      }
    })();
  },[]);

  return (
    <div className="container">
      <h1 className="page-title">Choose a Meal</h1>
      <div className="banner-grid">
        {meals.map(m=>{
          const isActive = activeMeal === m.id;
          return (
            <div key={m.id} onClick={() => navigate(`/orders?meal=${m.id}`)}
                 className={`meal-banner ${isActive ? "active-meal" : ""}`}>
              <div className="meal-emoji">{m.icon}</div>
              <div className="meal-name">{m.label}</div>
              <div className="meal-sub">{isActive ? "Available Today" : "Coming Soon"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
