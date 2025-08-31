import React, { useState, useEffect } from "react";
import api from "../../api"; 
import Login from "./components/Login";
import SubAdminList from "./components/SubAdminList";
import Transactions from "./components/Transactions";
import FundModal from "./components/FundModal";
import "./styles/SuperAdminPanel.css";

export default function SuperAdminPanel() {
  const [logged, setLogged] = useState(false);
  const [subAdmins, setSubAdmins] = useState([]);
  const [txs, setTxs] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchSubs = async () => {
    const res = await api.get("/super-admin/sub-admins");
    setSubAdmins(res.data);
  };

  const fetchTxs = async (id) => {
    setSelected(id);
    const res = await api.get(`/super-admin/sub-admins/${id}/transactions`);
    setTxs(res.data);
  };

  const handleFundAdd = async (id, amount) => {
    await api.post(`/super-admin/sub-admins/${id}/add-fund`, {
      amount: parseInt(amount),
    });
    fetchSubs();
    fetchTxs(id);
  };

  useEffect(() => {
    if (logged) fetchSubs();
  }, [logged]);

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  return (
    <div className="superadmin-wrapper">
      <h1>Super Admin Panel</h1>
      <SubAdminList subs={subAdmins} onSelect={fetchTxs} />
      {selected && (
        <>
          <FundModal subId={selected} onAddFund={handleFundAdd} />
          <Transactions txs={txs} />
        </>
      )}
    </div>
  );
}
