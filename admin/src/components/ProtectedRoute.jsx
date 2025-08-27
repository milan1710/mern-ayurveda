import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(()=>{
    let mounted = true;
    api.get('/auth/me')
      .then(res => mounted && setUser(res.data.user))
      .catch(()=> mounted && setUser(null))
      .finally(()=> mounted && setLoading(false));
    return ()=> (mounted=false);
  },[]);

  if(loading) return <div className="container">Loading...</div>;
  if(!user) return <Navigate to="/login" replace />;
  return children;
}
