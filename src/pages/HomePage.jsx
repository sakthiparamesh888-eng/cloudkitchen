import { useEffect, useState } from "react";
import { fetchMeal } from "../api/sheet";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [lunchItems, setLunchItems] = useState([]);

  useEffect(() => {
    fetchMeal("lunch").then(setLunchItems);
  }, []);

  return (
    <div className="homepage">

      {/* HERO SECTION */}
      <div className="hero">
        <h1 className="hero-title">Sakthi Kitchen</h1>
        <p className="hero-sub">Fresh, Healthy & Home-Style Meals</p>

        <Link to="/orders?meal=lunch" className="hero-btn">
          Order Lunch 🍱
        </Link>
      </div>

      {/* MEAL SELECTION */}
      <div className="meal-grid">
        <Link to="/orders?meal=breakfast" className="meal-card">🌅 Breakfast</Link>
        <Link to="/orders?meal=lunch" className="meal-card active">🍱 Lunch</Link>
        <Link to="/orders?meal=dinner" className="meal-card">🌙 Dinner</Link>
        <Link to="/orders?meal=snacks" className="meal-card">🍟 Snacks</Link>
      </div>

      {/* POPULAR ITEMS */}
      <h2 className="section-title">Today’s Popular Lunch Items</h2>

      <div className="grid">
        {lunchItems.map((item) => (
          <div className="food-card" key={item.id}>
            <div className="card-img-box">
              <img src={item.imageUrl} className="food-img" alt={item.name} />
              <div className="img-overlay" />
            </div>

            <div className="food-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>

              <div className="card-actions">
                <span className="price">₹{item.price}</span>

                <Link to={`/orders?meal=lunch`} className="btn-primary">
                  Order Now →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
