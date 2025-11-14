// src/components/Header.jsx
import React, {useState} from "react";
import { Link } from "react-router-dom";

export default function Header(){
  const [open,setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-brand">
        <div className="logo">🍲</div>
        <div className="brand-name">Sakthi Kitchen</div>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/orders?meal=lunch">Orders</Link>
        <Link to="/checkout">Checkout</Link>
       
      </nav>

      <div className="hamburger" onClick={()=> setOpen(v=>!v)}>
        <div style={{width:30,height:4,background:"rgba(255,255,255,0.6)",borderRadius:6,marginBottom:6}} />
        <div style={{width:20,height:4,background:"rgba(255,255,255,0.6)",borderRadius:6}} />
      </div>

      {/* mobile menu overlay */}
      {open && (
        <div style={{
          position:"fixed",left:0,top:0,bottom:0,right:0,background:"rgba(0,0,0,0.6)",zIndex:2000
        }} onClick={()=> setOpen(false)}>
          <div style={{width:260, background:"#071322", height:"100%", padding:20}} onClick={e=>e.stopPropagation()}>
            <button style={{marginBottom:12}} onClick={()=> setOpen(false)}>Close ✕</button>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Link to="/" onClick={()=> setOpen(false)}>Home</Link>
              <Link to="/orders?meal=lunch" onClick={()=> setOpen(false)}>Orders</Link>
              <Link to="/checkout" onClick={()=> setOpen(false)}>Checkout</Link>
              <Link to="/admin" onClick={()=> setOpen(false)}>Admin</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
