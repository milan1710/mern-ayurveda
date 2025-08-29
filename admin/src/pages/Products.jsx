// admin/src/pages/Products.jsx
import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import './Products.css';

const emptyForm = {
  name:'', sku:'', price:'', oldPrice:'', stock:'',
  description:'', category:'none', collection:'none', featured:false
};

// Base URLs
const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL || '';
const toAbs = (u) => {
  if (!u) return u;
  if (u.startsWith('/uploads/')) {
    const base = API_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}${u}`;
  }
  return u;
};

// --- URL validation helpers ---
const isBlobOrData = (u='') => /^blob:|^data:/i.test(u);
const isHttpHttps = (u='') => /^https?:\/\//i.test(u);
const isUploadsRel = (u='') => u.startsWith('/uploads/');
const isPublicImageUrl = (u='') => isHttpHttps(u) || isUploadsRel(u);

// Remove dupes & illegal (blob/data) urls
const sanitizeUrls = (arr=[]) => {
  const out = [];
  const seen = new Set();
  for (const u of arr) {
    if (!u || isBlobOrData(u)) continue;          // drop blob/data
    const abs = toAbs(u);
    if (!isPublicImageUrl(u) && !isPublicImageUrl(abs)) continue;
    const key = abs.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(abs);
  }
  return out;
};

const warnIfInvalidUrl = (u) => {
  if (isBlobOrData(u)) return 'Local preview URL (blob:/data:) save nahi hota.';
  if (!isPublicImageUrl(u) && !isPublicImageUrl(toAbs(u))) return 'URL galat hai. http(s) ya /uploads/ se start hona chahiye.';
  return '';
};

export default function Products({ user }){
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  // images state
  const [imgUrls, setImgUrls] = useState([]);       // server/public/manual urls (NOT blob)
  const [newFiles, setNewFiles] = useState([]);     // File[] (previews banenge blob se, but yahan store nahi)
  const [manualUrl, setManualUrl] = useState('');   // single field to add to imgUrls
  const [manualError, setManualError] = useState('');

  const [cats, setCats] = useState([]);
  const [cols, setCols] = useState([]);

  const fetchData = async () => {
    const { data } = await api.get(`/products?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
    setItems(data.items || []);
    setPages(data.pages || 1);
  };
  const loadMeta = async () => {
    const [c, k] = await Promise.all([ api.get('/categories'), api.get('/collections') ]);
    setCats(c.data.items||[]); setCols(k.data.items||[]);
  };
  useEffect(()=>{ fetchData(); /* eslint-disable-next-line */ }, [q, page]);
  useEffect(()=>{ loadMeta(); },[]);

  const openAdd = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setImgUrls([]); 
    setManualUrl(''); 
    setManualError('');
    setNewFiles([]); 
    setModalOpen(true); 
  };

  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      name:p.name, sku:p.sku,
      price:String(p.price), oldPrice: p.oldPrice ?? '',
      stock:String(p.stock),
      description:p.description || '',
      category: p.category?._id || 'none',
      collection: p.collection?._id || 'none',
      featured: Boolean(p.featured)
    });
    // Purane products me agar blob/data galti se save hua, to yahin clean:
    setImgUrls(sanitizeUrls(Array.isArray(p.images)? p.images : []));
    setManualUrl('');
    setManualError('');
    setNewFiles([]);
    setModalOpen(true);
  };

  const uploadImages = async (files) => {
    if(!files || files.length===0) return [];
    const fd = new FormData();
    files.forEach(f=>fd.append('files', f));
    const { data } = await api.post('/upload/images', fd, { headers:{'Content-Type':'multipart/form-data'} });
    return data.urls || [];
  };

  const submit = async (e) => {
    e.preventDefault();
    // 1) upload new files -> absolute URLs from server
    const uploaded = await uploadImages(newFiles);
    // 2) sanitize manual/existing urls (remove blob/data & dupes)
    const cleaned = sanitizeUrls(imgUrls);
    // 3) final images
    const images = sanitizeUrls([...cleaned, ...uploaded]);

    const payload = {
      name: form.name, sku: form.sku,
      price: Number(form.price),
      oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
      stock: Number(form.stock),
      description: form.description,
      images,
      category: form.category || 'none',
      collection: form.collection || 'none',
      featured: Boolean(form.featured)
    };

    if(editing) await api.put(`/products/${editing}`, payload);
    else        await api.post('/products', payload);

    setModalOpen(false); 
    setForm(emptyForm); 
    setImgUrls([]); 
    setNewFiles([]); 
    setManualUrl('');
    setManualError('');
    fetchData();
  };

  const del = async (id) => {
    if(!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchData();
  };

  // image helpers
  const addManualUrl = () => {
    const u = manualUrl.trim();
    if(!u) return;
    const msg = warnIfInvalidUrl(u);
    if (msg) { setManualError(msg); return; }
    setManualError('');
    const abs = toAbs(u);
    setImgUrls(arr => {
      const next = sanitizeUrls([...arr, abs]);
      return next;
    });
    setManualUrl('');
  };
  const removeUrl = (u) => setImgUrls(arr => arr.filter(x => x !== u));
  const onNewFiles = (list) => {
    const arr = Array.from(list || []);
    setNewFiles(prev => [...prev, ...arr]);
  };
  const removeNewFile = (idx) => {
    setNewFiles(prev => prev.filter((_,i)=>i!==idx));
  };

  const pager = useMemo(()=>{
    const a=[]; for(let i=1;i<=pages;i++) a.push(i); return a;
  },[pages]);

  const discount = (p) => (p.oldPrice && p.oldPrice>p.price)
    ? Math.round(((p.oldPrice - p.price)/p.oldPrice)*100) : 0;

  return (
    <div className="container">
      <div className="products-head">
        <input
          className="input"
          placeholder="Search name or SKU…"
          value={q}
          onChange={e=>{ setPage(1); setQ(e.target.value); }}
        />
        {isAdmin && <button className="btn solid" onClick={openAdd}>+ Add Product</button>}
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Collection</th>
              <th>Featured</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, i)=>(
              <tr key={p._id}>
                <td>{(page-1)*limit + i + 1}</td>
                <td>{p.name}</td>
                <td className="mono">{p.sku}</td>
                <td>
                  <div className="price-cell">
                    {p.oldPrice && p.oldPrice>p.price && <span className="old">₹{p.oldPrice.toFixed(2)}</span>}
                    <span className="new">₹{p.price.toFixed(2)}</span>
                    {discount(p) ? <span className="disc-badge">-{discount(p)}%</span> : null}
                  </div>
                </td>
                <td>{p.stock}</td>
                <td>{p.category?.name || '-'}</td>
                <td>{p.collection?.name || '-'}</td>
                <td>{p.featured ? 'Yes' : 'No'}</td>
                <td className="mono img-links">
                  {(p.images||[]).slice(0,2).map((u,idx)=>
                    <a key={idx} href={toAbs(u)} target="_blank" rel="noreferrer">img{idx+1}</a>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <div className="row">
                      <button className="btn" onClick={()=>openEdit(p)}>Edit</button>
                      <button className="btn ghost danger" onClick={()=>del(p._id)}>Delete</button>
                    </div>
                  ) : (<span className="badge" datastatus="Confirmed">Read only</span>)}
                </td>
              </tr>
            ))}
            {items.length===0 && (
              <tr><td colSpan={10} style={{textAlign:'center', opacity:.7, padding:'18px'}}>No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages>1 && (
        <div className="pager">
          {pager.map(n=>(
            <button key={n} className={`pager-btn ${n===page?'active':''}`} onClick={()=>setPage(n)}>{n}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={()=>setModalOpen(false)}>
          <div className="modal glass nv-animate-up" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="close-x" onClick={()=>setModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <form className="form modal-form" onSubmit={submit}>
                <div className="row">
                  <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
                  <input className="input" placeholder="SKU" value={form.sku} onChange={e=>setForm(f=>({...f, sku:e.target.value}))}/>
                </div>

                <div className="row">
                  <input className="input" type="number" min="0" step="0.01" placeholder="New Price ₹" value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))}/>
                  <input className="input" type="number" min="0" step="0.01" placeholder="Old Price ₹ (optional)" value={form.oldPrice} onChange={e=>setForm(f=>({...f, oldPrice:e.target.value}))}/>
                </div>

                <div className="row">
                  <input className="input" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e=>setForm(f=>({...f, stock:e.target.value}))}/>
                  <label className="row chk" style={{gap:8, alignItems:'center'}}>
                    <input type="checkbox" checked={form.featured} onChange={e=>setForm(f=>({...f, featured:e.target.checked}))}/>
                    <span>Featured</span>
                  </label>
                </div>

                <div className="row">
                  <select className="select" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))}>
                    <option value="none">Category: None</option>
                    {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <select className="select" value={form.collection} onChange={e=>setForm(f=>({...f, collection:e.target.value}))}>
                    <option value="none">Collection: None</option>
                    {cols.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <textarea className="input" rows={3} placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>

                {/* Image URLs list + add */}
                <div className="block">
                  <label className="lbl">Image URLs</label>
                  <div className="img-list">
                    {imgUrls.map((u, i)=>(
                      <div key={i} className="img-chip">
                        <img src={toAbs(u)} alt="" />
                        <span className="u">
                          {isBlobOrData(u) ? '(local preview)' : toAbs(u)}
                        </span>
                        <button type="button" className="chip-x" onClick={()=>removeUrl(u)}>×</button>
                      </div>
                    ))}
                    {imgUrls.length===0 && <div className="muted">No URLs added</div>}
                  </div>
                  <div className="row" style={{alignItems:'flex-start', gap:8}}>
                    <div style={{flex:1}}>
                      <input
                        className="input"
                        placeholder="https://example.com/image.jpg or /uploads/xyz.jpg"
                        value={manualUrl}
                        onChange={e=>{ setManualUrl(e.target.value); setManualError(''); }}
                      />
                      {manualError && <div className="muted" style={{color:'#c00', marginTop:6}}>{manualError}</div>}
                    </div>
                    <button type="button" className="btn" onClick={addManualUrl}>Add</button>
                  </div>
                </div>

                {/* Upload new files */}
                <div className="block">
                  <label className="lbl">Upload images (multiple)</label>
                  <input type="file" multiple accept="image/*" onChange={e=>onNewFiles(e.target.files)} />
                  {newFiles.length>0 && (
                    <div className="preview-wrap">
                      {newFiles.map((f,i)=>(
                        <div key={i} className="preview-card">
                          {/* yeh sirf preview hai; yeh URL kabhi DB me nahi jayegi */}
                          <img alt="" src={URL.createObjectURL(f)} className="preview-thumb" />
                          <button type="button" className="mini-x" onClick={()=>removeNewFile(i)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="row modal-actions">
                  <button type="button" className="btn ghost" onClick={()=>setModalOpen(false)}>Cancel</button>
                  <button className="btn solid">{editing ? 'Save Changes' : 'Create'}</button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
