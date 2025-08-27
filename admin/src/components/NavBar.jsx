import { NavLink } from 'react-router-dom';
import './NavBar.css';
import logo from '../assets/logo.svg';
import { useState } from 'react';

export default function NavBar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen(v=>!v);
  const closeMenu = () => setOpen(false);

  const isStaff = user?.role === 'staff';

  return (
    <header className="nv-nav">
      <div className="nv-left">
        <img src={logo} className="nv-logo nv-float" alt="Nature Vardan" />
        <div className="nv-brand">
          <strong>Nature Vardan</strong>
          <span>{isStaff ? 'Staff Console' : 'Admin Console'}</span>
        </div>
      </div>

      {/* Hamburger */}
      <button className={`nv-hamburger ${open ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span><span></span><span></span>
      </button>

      {/* Desktop links */}
      <nav className="nv-links desktop">
        {isStaff ? (
          <>
            <NavLink to="/orders" className="nv-link">Orders</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" end className="nv-link">Dashboard</NavLink>
            <NavLink to="/orders" className="nv-link">Orders</NavLink>
            <NavLink to="/products" className="nv-link">Products</NavLink>
            <NavLink to="/categories" className="nv-link">Categories</NavLink>
            <NavLink to="/collections" className="nv-link">Collections</NavLink>
            <NavLink to="/staff" className="nv-link">Staff</NavLink>
          </>
        )}
      </nav>

      <div className="nv-right desktop">
        {user && <button className="btn solid" onClick={onLogout}>Logout ({user.role})</button>}
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="nv-mobile-menu">
          <nav className="nv-links mobile">
            {isStaff ? (
              <>
                <NavLink onClick={closeMenu} to="/orders" className="nv-link">Orders</NavLink>
              </>
            ) : (
              <>
                <NavLink onClick={closeMenu} to="/" end className="nv-link">Dashboard</NavLink>
                <NavLink onClick={closeMenu} to="/orders" className="nv-link">Orders</NavLink>
                <NavLink onClick={closeMenu} to="/products" className="nv-link">Products</NavLink>
                <NavLink onClick={closeMenu} to="/categories" className="nv-link">Categories</NavLink>
                <NavLink onClick={closeMenu} to="/collections" className="nv-link">Collections</NavLink>
                <NavLink onClick={closeMenu} to="/staff" className="nv-link">Staff</NavLink>
              </>
            )}
          </nav>
          {user && (
            <div className="nv-mobile-logout">
              <button className="btn solid" onClick={()=>{ onLogout(); closeMenu(); }}>Logout ({user.role})</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
