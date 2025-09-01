import './Checkout.css';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { trackPurchase } from '../lib/pixel'; // ✅ Pixel

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh",
  "Lakshadweep","Puducherry"
];

export default function Checkout(){
  const { id } = useParams();            // product id
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    firstName:'', lastName:'', phone:'',
    address:'', city:'', state:'', pin:'',
    paymentMethod:'COD'
  });

  useEffect(()=>{
    window.scrollTo(0,0);
    api.get(`/public/products/${id}`)
      .then(r=> setProduct(r.data?.product || null))
      .catch(()=> setProduct(null));
  },[id]);

  const total = useMemo(()=>{
    const p = Number(product?.price ?? 0);
    return isNaN(p) ? 0 : p * qty;
  },[product, qty]);

  const onChange = (k) => (e) => setForm(f=>({ ...f, [k]: e.target.value }));

  const validate = () => {
    if(!form.firstName.trim()) return 'Please enter first name';
    if(!form.lastName.trim())  return 'Please enter last name';
    if(!/^\d{10}$/.test(form.phone.trim())) return 'Enter a valid 10-digit phone';
    if(!form.address.trim())   return 'Please enter address';
    if(!form.city.trim())      return 'Please enter city';
    if(!form.state.trim())     return 'Please select state';
    if(!/^\d{6}$/.test(form.pin.trim())) return 'Enter a valid 6-digit PIN code';
    return '';
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const v = validate();
    if(v){ setErr(v); return; }
    if(!product) return;

    setPlacing(true); setErr('');
    try{
      const payload = {
        items: [{ product: product._id, qty }],
        info: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          address: `${form.address}, ${form.city}, ${form.state} - ${form.pin}`,
          paymentMethod: form.paymentMethod
        }
      };
      await api.post('/public/orders', payload);

      // ✅ Pixel: Purchase event (दोनों pixels पर fire करो)
      if (import.meta.env.VITE_PIXEL_ID) {
        trackPurchase({
          items: [{ product: product._id, qty, price: Number(product.price || 0) }],
          value: Number(total || 0),
          currency: 'INR'
        }, import.meta.env.VITE_PIXEL_ID);
      }

      if (product.pixelId) {
        trackPurchase({
          items: [{ product: product._id, qty, price: Number(product.price || 0) }],
          value: Number(total || 0),
          currency: 'INR'
        }, product.pixelId);
      }

      setDone(true);
    }catch(e){
      setErr(e?.response?.data?.message || 'Could not place order');
    }finally{
      setPlacing(false);
    }
  };

  if(!product) return <div className="container co-wrap"><div className="co-card">Loading…</div></div>;

  if(done){
    return (
      <div className="container co-wrap">
        <div className="co-thanks">
          <div className="co-ico">✅</div>
          <h2>Order Confirmed</h2>
          <p>Thank you! We will contact you shortly for delivery.</p>
          <button className="btn" onClick={()=>navigate('/shop')}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container co-wrap">
      <h1 className="co-title">Checkout</h1>

      <div className="co-grid">
        {/* Form Card */}
        <form className="co-card" onSubmit={placeOrder}>
          <div className="co-section">
            <div className="co-sec-title">Contact</div>
            <div className="co-row">
              <label className="co-label">Phone</label>
              <input className="co-input" inputMode="numeric" maxLength={10}
                     placeholder="10-digit phone"
                     value={form.phone} onChange={onChange('phone')} />
            </div>
          </div>

          <div className="co-section">
            <div className="co-sec-title">Shipping address</div>
            <div className="co-col-2">
              <div className="co-field">
                <label className="co-label">First name</label>
                <input className="co-input" value={form.firstName} onChange={onChange('firstName')} />
              </div>
              <div className="co-field">
                <label className="co-label">Last name</label>
                <input className="co-input" value={form.lastName} onChange={onChange('lastName')} />
              </div>
            </div>

            <div className="co-field">
              <label className="co-label">Address</label>
              <input className="co-input" placeholder="House no, street"
                     value={form.address} onChange={onChange('address')} />
            </div>

            <div className="co-col-3">
              <div className="co-field">
                <label className="co-label">City</label>
                <input className="co-input" value={form.city} onChange={onChange('city')} />
              </div>

              <div className="co-field">
                <label className="co-label">State</label>
                <select className="co-input" value={form.state} onChange={onChange('state')}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="co-field">
                <label className="co-label">PIN code</label>
                <input className="co-input" inputMode="numeric" maxLength={6}
                       value={form.pin} onChange={onChange('pin')} />
              </div>
            </div>
          </div>

          <div className="co-section">
            <div className="co-sec-title">Payment</div>
            <div className="co-radio">
              <label className="co-radio-item">
                <input type="radio" name="pm" value="COD"
                       checked={form.paymentMethod==='COD'}
                       onChange={()=>setForm(f=>({...f, paymentMethod:'COD'}))}/>
                <span>Cash on Delivery (COD)</span>
              </label>
              <label className="co-radio-item disabled">
                <input type="radio" disabled/>
                <span>Online (coming soon)</span>
              </label>
            </div>
          </div>

          {err && <div className="co-error">{err}</div>}

          <button className="btn co-submit" disabled={placing}>
            {placing ? 'Placing order…' : 'Complete Order'}
          </button>
        </form>

        {/* Summary Card */}
        <aside className="co-summary">
          <div className="co-sum-item">
            <div className="co-sum-img">
              {product.images?.[0]
                ? <img src={product.images[0]} alt="" />
                : <div className="noimg">No image</div>}
            </div>
            <div className="co-sum-info">
              <div className="co-sum-name">{product.name}</div>
              <div className="co-sum-price">₹{Number(product.price||0).toFixed(2)}</div>
              <div className="co-qty">
                <button type="button" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <input value={qty} onChange={e=>setQty(Math.max(1, Number(e.target.value)||1))}/>
                <button type="button" onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
            </div>
          </div>

          <div className="co-line"><span>Subtotal</span><span>₹{(Number(product.price||0)*qty).toFixed(2)}</span></div>
          <div className="co-line"><span>Shipping</span><span>Free</span></div>
          <div className="co-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </aside>
      </div>
    </div>
  );
}