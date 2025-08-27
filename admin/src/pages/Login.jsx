import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Login.css';

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try{
      const r = await api.post('/auth/login', { email, password });
      onLogin?.(r.data.user);
      navigate('/');
    }catch(e){
      setErr(e?.response?.data?.message || 'Login failed');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Admin Login</h2>
        <input className="input" type="email" placeholder="Email"
               autoComplete="username" value={email}
               onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password"
               autoComplete="current-password" value={password}
               onChange={e=>setPassword(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <button className="btn solid" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="dim" style={{marginTop:8}}>
          Tip: {process.env.NODE_ENV==='development' ? 'Use your .env admin credentials' : ''}
        </div>
      </form>
    </div>
  );
}
