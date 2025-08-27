import './Shop.css';
import api from '../api';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function Shop(){
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [err, setErr] = useState('');

  useEffect(()=>{
    api.get('/public/categories')
      .then(r=> setCats(Array.isArray(r.data?.items) ? r.data.items : []))
      .catch(e=> { console.error(e); setCats([]); });
  },[]);

  useEffect(()=>{
    const qs = new URLSearchParams();
    if(q) qs.set('q', q);
    if(cat) qs.set('category', cat);
    // ✅ no trailing "?"
    const url = qs.toString() ? `/public/products?${qs}` : '/public/products?limit=60';
    api.get(url)
      .then(r=> setItems(Array.isArray(r.data?.items) ? r.data.items : []))
      .catch(e=> { console.error(e); setErr('Could not load products'); setItems([]); });
  },[q,cat]);

  return (
    <div className="container">
      <div className="shop-filters">
        <input className="input" placeholder="Search products…" value={q} onChange={e=>setQ(e.target.value)}/>
        <select className="select" value={cat} onChange={e=>setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {err && <div style={{marginBottom:8}}>{err}</div>}
      {items.length === 0 ? (
        <div style={{opacity:.8}}>No products found.</div>
      ) : (
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))'}}>
          {items.map(p => <ProductCard key={p._id} p={p} />)}
        </div>
      )}
    </div>
  );
}
