import React, { useState } from "react";
import "../styles/FundModal.css";

export default function FundModal({ subId, onAddFund }) {
  const [amount, setAmount] = useState("");

  return (
    <div className="fund-modal">
      <input
        type="number"
        placeholder="Enter Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={() => onAddFund(subId, amount)}>Add Fund</button>
    </div>
  );
}
