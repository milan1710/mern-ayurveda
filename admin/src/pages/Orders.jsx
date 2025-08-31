import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import './Orders.css';

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'call_not_pickup', label: 'Call not pickup' },
  { value: 'call_later', label: 'Call later' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'delivered', label: 'Delivered' },
];

const labelOf = (val) => STATUSES.find(s => s.value === val)?.label || val;

const emptyView = {
  _id: '',
  info: { name: '', phone: '', address: '', city: '', state: '', pin: '', paymentMethod: 'COD' },
  status: 'new',
  items: [],
  assignedTo: null,
  comments: []
};

export default function Orders({ user }) {
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState(emptyView);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // staff list (for assign)
  const [staff, setStaff] = useState([]);
  // comment
  const [note, setNote] = useState('');

  // form state inside modal (split first/last + status + assigned)
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    address: '', city: '', state: '', pin: '',
    paymentMethod: 'COD', status: 'new',
    assigned: '' // staff id
  });

  const fetchData = async () => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (q) params.set('q', q);
    if (status && status !== 'all') params.set('status', status);
    const { data } = await api.get(`/orders?${params.toString()}`);
    setItems(data.items || []);
    setPages(data.pages || 1);
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [q, status, page]);

  const fetchStaff = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users/staff');
      setStaff(data.items || []);
    } catch {
      setStaff([]);
    }
  };
  useEffect(() => { fetchStaff(); /* eslint-disable-next-line */ }, [isAdmin]);

  // Helpers
  const splitName = (full = '') => {
    const parts = String(full).trim().split(/\s+/);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    const firstName = parts.shift();
    const lastName = parts.join(' ');
    return { firstName, lastName };
  };

  const openView = async (id) => {
    setErr('');
    const { data } = await api.get(`/orders/${id}`);
    const o = data.order || emptyView;
    setView(o);

    const { firstName, lastName } = splitName(o.info?.name || '');
    setForm({
      firstName,
      lastName,
      phone: o.info?.phone || '',
      address: o.info?.address || '',
      city: o.info?.city || '',
      state: o.info?.state || '',
      pin: o.info?.pin || '',
      paymentMethod: o.info?.paymentMethod || 'COD',
      status: o.status || 'new',
      // ✅ assigned auto select if already assigned
      assigned: (o.assignedTo?._id || o.assignedTo || '') || '',
    });

    setNote('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setView(emptyView); setErr(''); setNote(''); };

  const priceOf = (it) => {
    const override = it.price;
    const base = it.product?.price;
    const p = (override === null || override === undefined) ? base : override;
    return Number(p || 0);
  };

  const subTotal = useMemo(() => {
    return (view.items || []).reduce((sum, it) => {
      const price = priceOf(it);
      const qty = Number(it.qty ?? 0);
      return sum + (price * qty);
    }, 0);
  }, [view.items]);

  const updateItemQty = (idx, qty) => {
    const qn = Math.max(1, Number(qty) || 1);
    setView(v => {
      const next = [...(v.items || [])];
      next[idx] = { ...next[idx], qty: qn };
      return { ...v, items: next };
    });
  };

  const updateItemPrice = (idx, price) => {
    const pn = price === '' ? '' : Number(price);
    setView(v => {
      const next = [...(v.items || [])];
      next[idx] = { ...next[idx], price: pn === '' ? null : (isNaN(pn) ? 0 : pn) };
      return { ...v, items: next };
    });
  };

  const saveInfo = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      // 1) update info
      await api.put(`/orders/${view._id}/info`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pin: form.pin,
        paymentMethod: form.paymentMethod
      });

      // 2) update status if changed
      if ((view.status || '') !== (form.status || '')) {
        await api.put(`/orders/${view._id}/status`, { status: form.status });
      }

      // 3) update assignment (admin only)
      if (isAdmin) {
        const currentAssigned = (view.assignedTo?._id || view.assignedTo || '') || '';
        if (String(currentAssigned) !== String(form.assigned || '')) {
          await api.put(`/orders/${view._id}/assign`, { staffId: form.assigned || null });
        }
      }

      // 4) update items (qty + price)
      if (Array.isArray(view.items)) {
        const payload = view.items.map(it => ({
          product: it.product?._id || it.product,
          qty: Number(it.qty || 1),
          price: (it.price === null || it.price === '' || it.price === undefined)
            ? null
            : Number(it.price)
        }));
        await api.put(`/orders/${view._id}/items`, { items: payload });
      }

      // 5) add note if any
      if (note.trim()) {
        await api.post(`/orders/${view._id}/comment`, { text: note.trim() });
      }

      // reload list + modal view
      await fetchData();
      await openView(view._id);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  // inline assign (outside modal)
  const inlineAssign = async (orderId, staffId) => {
    try {
      await api.put(`/orders/${orderId}/assign`, { staffId: staffId || null });
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not assign');
    }
  };

  const pager = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= pages; i++) arr.push(i);
    return arr;
  }, [pages]);

  return (
    <div className="container">
      <div className="orders-head">
        <input
          className="input"
          placeholder="Search name or phone…"
          value={q}
          onChange={e => { setPage(1); setQ(e.target.value); }}
        />
        <select
          className="select"
          value={status}
          onChange={e => { setPage(1); setStatus(e.target.value); }}
        >
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Phone</th><th>Status</th><th>Total Items</th><th>Assigned</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o, i) => (
              <tr key={o._id}>
                <td>{(page - 1) * limit + i + 1}</td>
                <td>{o.info?.name || '-'}</td>
                <td>{o.info?.phone || '-'}</td>
                <td>
                  <span className="badge" datastatus={o.status}>
                    {labelOf(o.status)}
                  </span>
                </td>
                <td>{(o.items || []).reduce((a, it) => a + (Number(it.qty) || 0), 0)}</td>
                <td>
                  {isAdmin ? (
                    <select
                      className="select od-assign-inline"
                      value={(o.assignedTo?._id || o.assignedTo || '') || ''}
                      onChange={(e) => inlineAssign(o._id, e.target.value)}
                    >
                      <option value="">— Unassigned —</option>
                      {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  ) : (o.assignedTo?.name || '-')}
                </td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>
                  <div className="row">
                    <button className="btn" onClick={() => openView(o._id)}>View</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .7, padding: '18px' }}>No orders</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pager">
          {pager.map(n => (
            <button key={n} className={`pager-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
          ))}
        </div>
      )}

      {/* VIEW / EDIT MODAL */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal glass nv-animate-up od-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Order Details</h3>
              <button className="close-x" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body od-body">
              <form className="form modal-form od-form" onSubmit={saveInfo}>
                <div className="od-grid">
                  {/* Assign (admin only) */}
                  {isAdmin && (
                    <div className="od-section">
                      <div className="od-sec-title">Assign to Staff</div>
                      <div className="od-field">
                        <label className="od-label">Assigned staff</label>
                        <select
                          className="select"
                          value={form.assigned}
                          onChange={(e) => setForm(f => ({ ...f, assigned: e.target.value }))}
                        >
                          <option value="">— Unassigned —</option>
                          {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="od-section">
                    <div className="od-sec-title">Contact</div>
                    <div className="row">
                      <div className="od-field">
                        <label className="od-label">Phone</label>
                        <input className="input" placeholder="10-digit phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Payment</label>
                        <select className="select" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                          <option value="COD">COD</option>
                          <option value="ONLINE" disabled>Online (coming soon)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="od-section">
                    <div className="od-sec-title">Customer</div>
                    <div className="row">
                      <div className="od-field">
                        <label className="od-label">First name</label>
                        <input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Last name</label>
                        <input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="od-section">
                    <div className="od-sec-title">Shipping</div>
                    <div className="od-field">
                      <label className="od-label">Address</label>
                      <input className="input" placeholder="House no, street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div className="row">
                      <div className="od-field">
                        <label className="od-label">City</label>
                        <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">State</label>
                        <input className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">PIN code</label>
                        <input className="input" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="od-section">
                    <div className="od-sec-title">Status</div>
                    <div className="od-field">
                      <label className="od-label">Order status</label>
                      <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="od-section">
                    <div className="od-sec-title">Items</div>
                    <div className="od-items od-items-edit">
                      {(view.items || []).map((it, idx) => (
                        <div key={idx} className="od-item">
                          <div className="od-item-name">{it.product?.name || 'Product'}</div>

                          {/* Qty */}
                          <div className="od-qtyctrl">
                            <button type="button" onClick={() => updateItemQty(idx, (Number(it.qty || 1) - 1))}>−</button>
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={e => updateItemQty(idx, e.target.value)}
                            />
                            <button type="button" onClick={() => updateItemQty(idx, (Number(it.qty || 1) + 1))}>+</button>
                          </div>

                          {/* Editable price */}
                          <div className="od-price-edit">
                            ₹
                            <input
                              className="od-price-input"
                              type="number"
                              step="0.01"
                              min="0"
                              value={(it.price === null || it.price === undefined) ? '' : it.price}
                              placeholder={String(it.product?.price ?? 0)}
                              onChange={e => updateItemPrice(idx, e.target.value)}
                              title="Leave blank to use product price"
                            />
                          </div>
                        </div>
                      ))}
                      {(!view.items || view.items.length === 0) && (
                        <div className="od-empty">No items</div>
                      )}
                    </div>

                    <div className="od-totals">
                      <div><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
                      <div><span>Shipping</span><span>Free</span></div>
                      <div className="od-grand"><span>Total</span><span>₹{subTotal.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div className="od-section">
                    <div className="od-sec-title">Add Note</div>
                    <textarea
                      className="input"
                      rows="3"
                      placeholder="Enter note (e.g. customer said call later, address landmark, etc.)"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                    <div className="od-comments">
                      {(view.comments || []).map((c, idx) => (
                        <div key={idx} className="od-comment">
                          <div className="od-comment-text">{c.text}</div>
                          <div className="od-comment-meta">
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                            {c.by?.name ? <span> • {c.by.name}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {err && <div className="od-error">{err}</div>}

                <div className="row modal-actions">
                  <button type="button" className="btn ghost" onClick={closeModal}>Close</button>
                  <button className="btn solid" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
