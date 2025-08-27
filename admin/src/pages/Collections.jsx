import { useEffect, useState } from 'react';
import api from '../api';
import './Collections.css';

export default function Collections(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:'', slug:'' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/collections');
    setItems(data.items || []);
  };
  useEffect(()=>{ load(); },[]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try{
      await api.post('/collections', form);
      setForm({ name:'', slug:'' });
      load();
    }catch(err){
      setMsg(err.response?.data?.message || 'Error');
    }
  };
  const del = async (id) => {
    if(!window.confirm('Delete collection?')) return;
    await api.delete(`/collections/${id}`);
    load();
  };

  return (
    <div className="container col-grid">
      <div className="glass">
        <h2 style={{margin:'16px'}}>Add Collection</h2>
        {msg && <div style={{margin:'0 16px 8px', color:'salmon'}}>{msg}</div>}
        <form className="form" onSubmit={submit}>
          <input className="input" placeholder="Name (e.g., Bestseller)" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
          <input className="input" placeholder="Slug (bestseller)" value={form.slug} onChange={e=>setForm(f=>({...f, slug:e.target.value}))}/>
          <button className="btn solid">Add</button>
        </form>
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead><tr><th>#</th><th>Name</th><th>Slug</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {items.map((c,i)=>(
              <tr key={c._id}>
                <td>{i+1}</td>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td><button className="btn ghost" onClick={()=>del(c._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
