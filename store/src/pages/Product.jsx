import './Product.css';
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { initPixel, trackViewContent } from '../lib/pixel'; // ✅ Pixel

export default function Product(){
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    window.scrollTo(0,0);
    setLoading(true);

    api.get(`/public/products/${id}`)
      .then(r => {
        const prod = r.data?.product || null;
        setP(prod);
        setActive(0);

        if (prod) {
          // ✅ Default pixel init (.env से)
          if (import.meta.env.VITE_PIXEL_ID) {
            initPixel(import.meta.env.VITE_PIXEL_ID);
            trackViewContent({
              id: prod._id,
              name: prod.name,
              price: prod.price,
              currency: 'INR'
            }, import.meta.env.VITE_PIXEL_ID);
          }

          // ✅ Product-specific pixel init (backend से)
          if (prod.pixelId) {
            initPixel(prod.pixelId);
            trackViewContent({
              id: prod._id,
              name: prod.name,
              price: prod.price,
              currency: 'INR'
            }, prod.pixelId);
          }
        }
      })
      .catch(()=> setP(null))
      .finally(()=> setLoading(false));
  },[id]);

  const hasDiscount = useMemo(()=> p?.oldPrice && p.oldPrice > p.price, [p]);

  if (loading) return <div className="container pd-loading">Loading…</div>;
  if (!p) return <div className="container pd-loading">Product not found</div>;

  const images = Array.isArray(p.images) && p.images.length ? p.images : [];

  return (
    <div className="pd-wrap">
      <div className="pd-grid">
        {/* Left: square image */}
        <div>
          <div className="pd-imgbox">
            {images[active]
              ? <img className="pd-img" src={images[active]} alt={p.name} />
              : <div className="noimg">No image</div>}
            {hasDiscount && <span className="pd-badge">Sale</span>}
          </div>

          {/* Thumbs */}
          {images.length > 1 && (
            <div className="pd-gallery">
              {images.map((src, i)=>(
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb ${i===active?'active':''}`}
                  onClick={()=>setActive(i)}
                  aria-label={`image ${i+1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: info */}
        <div className="pd-info">
          <h1 className="pd-title">{p.name}</h1>

          <div className="pd-price">
            {hasDiscount && <span className="old">Rs. {Number(p.oldPrice).toFixed(2)}</span>}
            <span className="new">Rs. {Number(p.price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="off">
                -{Math.round(((p.oldPrice - p.price)/p.oldPrice)*100)}%
              </span>
            )}
          </div>

          {p.description && <div className="pd-desc">{p.description}</div>}

          <div className="pd-meta">
            <div className="pd-meta-item">
              <div className="pd-meta-icon">🌿</div>
              <div className="pd-meta-text">Natural Herbs</div>
            </div>
            <div className="pd-meta-item">
              <div className="pd-meta-icon">🚚</div>
              <div className="pd-meta-text">Free Shipping</div>
            </div>
            <div className="pd-meta-item">
              <div className="pd-meta-icon">↩️</div>
              <div className="pd-meta-text">Easy Returns</div>
            </div>
          </div>

          {/* ✅ Buy Now to checkout */}
          <div className="pd-cta">
            <Link to={`/checkout/${p._id}`} className="btn solid">Buy Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
