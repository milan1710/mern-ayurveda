import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import './Staff.css';

export default function Staff({ user }) {
  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub_admin';

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Add Staff modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  // fetch staff/sub_admin list
  const fetchStaff = async (signal) => {
    try {
      setErr('');
      setLoading(true);
      const r = await api.get('/users/staff', { signal });
      setItems(Array.isArray(r?.data?.items) ? r.data.items : []);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setErr(e?.response?.data?.message || 'Failed to load users');
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchStaff(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter(s =>
      (s.name || '').toLowerCase().includes(qq) ||
      (s.email || '').toLowerCase().includes(qq) ||
      (s.phone || '').toLowerCase().includes(qq)
    );
  }, [items, q]);

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', password: '', role: 'staff' });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('Name, Email, Password required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/staff', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role
      });
      setOpen(false);
      await fetchStaff();
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Could not create user');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/staff/${id}`);
      setItems(prev => prev.filter(x => x._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="container">
      <div className="staff-head">
        <input
          className="input"
          placeholder="Search user by name, email, phone…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="btn solid" onClick={openAdd}>
          + Add {isAdmin ? 'User' : 'Staff'}
        </button>
      </div>

      {err && <div className="alert-red">{err}</div>}

      <div className="table-wrap glass">
        {loading ? (
          <div className="table-loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">No users found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td>{s.name || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.role || '-'}</td>
                  <td>
                    <div className="row">
                      <button className="btn ghost danger" onClick={() => del(s._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal glass nv-animate-up" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add {isAdmin ? 'User (Staff/Sub Admin)' : 'Staff'}</h3>
              <button className="close-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="form modal-form" onSubmit={save}>
                <div className="row">
                  <input className="input" placeholder="Name"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="input" placeholder="Email"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="row">
                  <input className="input" placeholder="Phone"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <input className="input" placeholder="Password" type="password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>

                {/* Role dropdown */}
                <div className="row">
                  <select
                    className="select"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    disabled={isSubAdmin} // sub_admin can only create staff
                  >
                    <option value="staff">Staff</option>
                    {isAdmin && <option value="sub_admin">Sub Admin</option>}
                  </select>
                </div>

                <div className="row modal-actions">
                  <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn solid" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
