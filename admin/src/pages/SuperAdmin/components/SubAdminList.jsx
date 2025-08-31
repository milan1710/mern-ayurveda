import React from "react";
import "../styles/SubAdminList.css";

export default function SubAdminList({ subs, onSelect }) {
  return (
    <div className="subadmin-card">
      <h3>Sub Admins</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Balance</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>₹{s.wallet}</td>
              <td>
                <button onClick={() => onSelect(s._id)}>Transactions</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
