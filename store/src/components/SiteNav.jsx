import { NavLink, useNavigate } from 'react-router-dom';
import './SiteNav.css';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function SiteNav(){
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sn-nav">
      <div className="sn-left" onClick={()=>navigate('/')}>
        <div className="sn-logo">🌿</div>
        <div className="sn-brand">
          <strong>Nature Vardan</strong>
          <span>Ayurvedic Wellness</span>
        </div>
      </div>

      <button className={`sn-burger ${open?'active':''}`} onClick={()=>setOpen(v=>!v)} aria-label="Menu">
        <span/><span/><span/>
      </button>

      <nav className="sn-links desktop">
        <NavLink to="/" end className="sn-link">Home</NavLink>
        <NavLink to="/shop" className="sn-link">Shop</NavLink>
        <NavLink to="/cart" className="sn-link">Cart ({count})</NavLink>
      </nav>

      {open && (
        <div className="sn-mobile">
          <NavLink to="/" end className="sn-link" onClick={()=>setOpen(false)}>Home</NavLink>
          <NavLink to="/shop" className="sn-link" onClick={()=>setOpen(false)}>Shop</NavLink>
          <NavLink to="/cart" className="sn-link" onClick={()=>setOpen(false)}>Cart ({count})</NavLink>
        </div>
      )}
    </header>
  );
}
