import './Cart.css';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import Quantity from '../components/Quantity';

export default function Cart(){
  const { items, setQty, remove, total } = useCart();

  if(items.length===0){
    return <div className="container"><h2>Your cart is empty</h2><Link to="/shop" className="btn">Shop now</Link></div>
  }

  return (
    <div className="container">
      <h2>Your Cart</h2>
      <div className="cart-list">
        {items.map(it=>(
          <div key={it.product} className="cart-item">
            {it.image ? <img src={it.image} alt="" /> : <div className="ph"/>}
            <div className="grow">
              <div className="name">{it.name}</div>
              <div className="dim">₹{it.price.toFixed(2)}</div>
            </div>
            <Quantity value={it.qty} onChange={q=>setQty(it.product, q)} />
            <div className="line">₹{(it.qty*it.price).toFixed(2)}</div>
            <button className="btn ghost" onClick={()=>remove(it.product)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div className="total">Total: <strong>₹{total.toFixed(2)}</strong></div>
        <Link to="/checkout" className="btn">Checkout</Link>
      </div>
    </div>
  );
}
