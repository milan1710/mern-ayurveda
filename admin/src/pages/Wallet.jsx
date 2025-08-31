import { useEffect, useState } from 'react';
import api from '../api';
import './Wallet.css';

export default function Wallet(){
  const [wallet, setWallet] = useState(0);
  const [amount, setAmount] = useState('');
  const [txns, setTxns] = useState([]);

  const load = async ()=>{
    const bal = await api.get('/wallet/balance');
    setWallet(bal.data.wallet);
    const t = await api.get('/wallet/transactions');
    setTxns(t.data.items || []);
  };

  useEffect(()=>{ load(); },[]);

  const addMoney = async ()=>{
    if (!amount || amount<=0) return alert("Enter valid amount");
    const { data } = await api.post('/wallet/create-order', { amount:Number(amount) });
    const { order, txnId } = data;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Sub Admin Wallet",
      order_id: order.id,
      handler: async function (response) {
        await api.post('/wallet/verify', {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          txnId
        });
        alert("Wallet Updated!");
        load();
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="container">
      <h2>My Wallet</h2>
      <div className="card glass" style={{padding:20, marginBottom:20}}>
        <h3>Balance: ₹ {wallet.toFixed(2)}</h3>
        <input className="input" type="number" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/>
        <button className="btn solid" onClick={addMoney}>Add Money</button>
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Amount</th><th>Status</th><th>TxnId</th>
            </tr>
          </thead>
          <tbody>
            {txns.map(t=>(
              <tr key={t._id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td>₹{t.amount}</td>
                <td>{t.status}</td>
                <td>{t.txnId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
