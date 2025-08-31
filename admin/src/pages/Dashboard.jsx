// admin/src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import './Dashboard.css';

/* ---------- date helpers ---------- */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }

function thisMonthRange(){
  const n = new Date();
  const s = new Date(n.getFullYear(), n.getMonth(), 1);
  const e = endOfDay(new Date(n.getFullYear(), n.getMonth()+1, 0));
  return { from: s, to: e };
}
function lastMonthRange(){
  const n = new Date();
  const s = new Date(n.getFullYear(), n.getMonth()-1, 1);
  const e = endOfDay(new Date(n.getFullYear(), n.getMonth(), 0));
  return { from: s, to: e };
}

/* ---------- UI labels for status ---------- */
const STATUS_LABEL = {
  new: 'New',
  placed: 'Placed',
  confirmed: 'Confirmed',
  call_not_pickup: 'Call not pickup',
  call_later: 'Call later',
  cancelled: 'Cancelled',
  delivered: 'Delivered'
};
const STATUS_ORDER = ['new','placed','confirmed','call_not_pickup','call_later','cancelled','delivered'];

export default function Dashboard(){
  const [preset, setPreset] = useState('this'); // this | last | custom
  const init = thisMonthRange();
  const [from, setFrom] = useState(init.from.toISOString().slice(0,10));
  const [to,   setTo]   = useState(init.to.toISOString().slice(0,10));

  const [staff, setStaff] = useState('all'); // all | unassigned | staffId
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // 👉 Wallet state
  const [wallet, setWallet] = useState(0);
  const [me, setMe] = useState(null);

  const applyPreset = (val) => {
    setPreset(val);
    if (val === 'this') {
      const r = thisMonthRange();
      setFrom(r.from.toISOString().slice(0,10));
      setTo(r.to.toISOString().slice(0,10));
    } else if (val === 'last') {
      const r = lastMonthRange();
      setFrom(r.from.toISOString().slice(0,10));
      setTo(r.to.toISOString().slice(0,10));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setErr('');
    try{
      const params = new URLSearchParams({
        from: startOfDay(new Date(from)).toISOString(),
        to:   endOfDay(new Date(to)).toISOString(),
        staff
      });
      const r = await api.get(`/stats/summary?${params.toString()}`);
      setData(r.data || {});
    }catch(e){
      setErr(e?.response?.data?.message || 'Could not load stats');
      setData(null);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchData(); /* eslint-disable-next-line */ }, []);
  useEffect(()=>{ fetchData(); /* eslint-disable-next-line */ }, [from, to, staff, preset]);

  // 👉 Fetch current user (for wallet & role)
  useEffect(()=>{
    api.get("/auth/me").then(res=>{
      setMe(res.data);
      setWallet(res.data.walletBalance || 0);
    }).catch(()=>{});
  },[]);

  /* ---------- staff dropdown options from API ---------- */
  const staffOptions = useMemo(()=>{
    const list = Array.isArray(data?.staffUsers) ? data.staffUsers : [];
    return [{_id:'all', name:'All staff'}, {_id:'unassigned', name:'Unassigned'}, ...list];
  }, [data]);

  /* ---------- normalize counts & sales ---------- */
  const byStatus = useMemo(()=>{
    const raw = data?.byStatus || {};
    const out = {};
    STATUS_ORDER.forEach(k => { out[k] = Number(raw[k] || 0); });
    return out;
  }, [data]);

  const totals = useMemo(()=>{
    const t = data?.totals || {};
    const totalOrders =
      t.totalOrders != null ? Number(t.totalOrders) :
      Object.values(byStatus).reduce((a,b)=>a+Number(b||0),0);

    const placedOrders =
      t.placedOrders != null ? Number(t.placedOrders) :
      Number(byStatus.placed || 0);

    const confirmedOrders =
      t.confirmedOrders != null ? Number(t.confirmedOrders) :
      Number(byStatus.confirmed || 0);

    const salesBlock = data?.sales || {};
    const totalSalesPlaced =
      t.totalSalesPlaced != null ? Number(t.totalSalesPlaced) :
      (salesBlock.placed != null ? Number(salesBlock.placed) : 0);

    return { totalOrders, placedOrders, confirmedOrders, totalSalesPlaced };
  }, [data, byStatus]);

  if (loading && !data) return <div className="container">Loading…</div>;

  // 👉 Razorpay add funds
  const handleAddFund = async () => {
    const amount = prompt("Enter amount to add:");
    if (!amount) return;

    // Create order
    const { data } = await api.post("/wallet/create-order", { amount });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: "INR",
      name: "Wallet Topup",
      description: "Add funds to wallet",
      order_id: data.order.id,
      handler: async function (response) {
        await api.post("/wallet/verify", {
          subAdminId: me._id,
          amount: parseInt(amount),
          txnId: response.razorpay_payment_id
        });
        alert("Funds added successfully!");
        setWallet(wallet + parseInt(amount));
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="container">
      {/* Filters */}
      <div className="dash-filters glass">
        <div className="row wrap">
          {/* Presets */}
          <div className="btn-group">
            <button className={`btn ${preset==='this'?'solid':''}`} onClick={()=>applyPreset('this')}>This month</button>
            <button className={`btn ${preset==='last'?'solid':''}`} onClick={()=>applyPreset('last')}>Last month</button>
            <button className={`btn ${preset==='custom'?'solid':''}`} onClick={()=>setPreset('custom')}>Custom</button>
          </div>

          {/* Date range */}
          <div className="row" style={{gap:8}}>
            <input
              type="date"
              className="input"
              value={from}
              onChange={e=>{ setFrom(e.target.value); setPreset('custom'); }}
            />
            <span className="dim" style={{alignSelf:'center'}}>to</span>
            <input
              type="date"
              className="input"
              value={to}
              onChange={e=>{ setTo(e.target.value); setPreset('custom'); }}
            />
          </div>

          {/* Staff filter */}
          <div className="row" style={{gap:8}}>
            <select className="select" value={staff} onChange={e=>setStaff(e.target.value)}>
              {staffOptions.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
            </select>
          </div>
        </div>
      </div>

      {err && <div className="glass" style={{padding:10, border:'1px solid var(--danger)'}}>{err}</div>}

      {/* KPI Cards */}
      <div className="dash-cards">
        <div className="card glass kpi">
          <div className="kpi-title">Total Orders</div>
          <div className="kpi-value black">{totals.totalOrders}</div>
          <div className="kpi-sub dim">in selected range</div>
        </div>

        <div className="card glass kpi">
          <div className="kpi-title">Placed Orders</div>
          <div className="kpi-value black">{totals.placedOrders}</div>
          <div className="kpi-sub dim">status = Placed</div>
        </div>

        <div className="card glass kpi">
          <div className="kpi-title">Confirmed Orders</div>
          <div className="kpi-value black">{totals.confirmedOrders}</div>
          <div className="kpi-sub dim">status = Confirmed</div>
        </div>

        <div className="card glass kpi">
          <div className="kpi-title">Total Sales (₹)</div>
          <div className="kpi-value black">₹ {totals.totalSalesPlaced.toFixed(2)}</div>
          <div className="kpi-sub dim">*Placed* orders only</div>
        </div>

        {/* 💰 Wallet (only for sub_admin) */}
        {me?.role === 'sub_admin' && (
          <div className="card glass kpi">
            <div className="kpi-title">Wallet Balance</div>
            <div className="kpi-value black">₹ {wallet}</div>
            <button className="btn solid" onClick={handleAddFund}>Add Funds</button>
          </div>
        )}
      </div>

      {/* Status grid */}
      <div className="card glass status-grid">
        {STATUS_ORDER.map(key=>(
          <div key={key} className="status-chip">
            <div className="st-label">{STATUS_LABEL[key] || key}</div>
            <div className="st-val black">{byStatus[key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
