import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './styles/global.css';
import './ui/Button.css';
import './ui/Card.css';
import './ui/Table.css';
import './ui/Form.css';
import './ui/Badge.css';

import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';

import Login from './pages/Login';
import './pages/Login.css';
import Dashboard from './pages/Dashboard';
import './pages/Dashboard.css';
import Orders from './pages/Orders';
import './pages/Orders.css';
import Staff from './pages/Staff';
import './pages/Staff.css';
import Products from './pages/Products';
import './pages/Products.css';
import Categories from './pages/Categories'; import './pages/Categories.css';
import Collections from './pages/Collections'; import './pages/Collections.css';
import Wallet from './pages/Wallet';   // ✅ NEW

import api from './api';
import { useEffect, useState } from 'react';

export default function App(){
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();

  // Boot: check session
  useEffect(()=>{
    const boot = async () => {
      try {
        const r = await api.get('/auth/me');
        setUser(r.data.user);
        // staff ko direct orders par bhejo
        if (r.data.user?.role === 'staff') navigate('/orders', { replace: true });
      } catch {
        setUser(null);
        navigate('/login', { replace: true });
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, [navigate]);

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    navigate('/login');
  };

  if (booting) return <div className="container">Loading…</div>;

  return (
    <>
      <NavBar user={user} onLogout={logout} />

      <Routes>
        {/* Login always open */}
        <Route path="/login" element={<Login onLogin={(u)=>{ setUser(u); if(u?.role==='staff'){navigate('/orders',{replace:true});} else {navigate('/',{replace:true});}}} />} />

        {/* Home: staff => redirect to /orders; admin => dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user?.role === 'staff' ? <Navigate to="/orders" replace /> : <Dashboard />}
            </ProtectedRoute>
          }
        />

        {/* Orders: admin + staff both */}
        <Route path="/orders" element={<ProtectedRoute><Orders user={user} /></ProtectedRoute>} />

        {/* Products: only admin (staff cannot access even via URL) */}
        <Route path="/products" element={
          <ProtectedRoute>
            <RequireRole user={user} allow={['admin']}>
              <Products user={user} />
            </RequireRole>
          </ProtectedRoute>
        } />

        {/* Categories: only admin */}
        <Route path="/categories" element={
          <ProtectedRoute>
            <RequireRole user={user} allow={['admin']}><Categories/></RequireRole>
          </ProtectedRoute>
        } />

        {/* Collections: only admin */}
        <Route path="/collections" element={
          <ProtectedRoute>
            <RequireRole user={user} allow={['admin']}><Collections/></RequireRole>
          </ProtectedRoute>
        } />

        {/* Staff management: admin & sub_admin */}
        <Route path="/staff" element={
          <ProtectedRoute>
            <RequireRole user={user} allow={['admin','sub_admin']}>
              <Staff user={user} />
            </RequireRole>
            {!user?.role || (user?.role !== 'admin' && user?.role !== 'sub_admin')
              ? <div className="container">Forbidden</div>
              : null}
          </ProtectedRoute>
        } />

        {/* ✅ Wallet: admin & sub_admin */}
        <Route path="/wallet" element={
          <ProtectedRoute>
            <RequireRole user={user} allow={['admin','sub_admin']}>
              <Wallet user={user} />
            </RequireRole>
            {!user?.role || (user?.role !== 'admin' && user?.role !== 'sub_admin')
              ? <div className="container">Forbidden</div>
              : null}
          </ProtectedRoute>
        } />

        {/* Wildcard: staff => /orders, admin => / */}
        <Route path="*" element={<Navigate to={user?.role==='staff' ? '/orders' : '/'} replace />} />
      </Routes>
    </>
  );
}
