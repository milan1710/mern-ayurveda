import React from "react";
import "../styles/Transactions.css";

export default function Transactions({ txs }) {
  return (
    <div className="tx-card">
      <h3>Transaction History</h3>
      <ul>
        {txs.map((t) => (
          <li key={t._id} className={t.type}>
            <span>{t.note}</span>
            <span>₹{t.amount}</span>
            <span>{new Date(t.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
