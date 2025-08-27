// store/src/components/ProductCard.jsx
import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ p }) {
  const hasDiscount = p.oldPrice && p.oldPrice > p.price;

  return (
    <article className="pc-card2 product-card">
      {/* Square image */}
      <Link to={`/product/${p._id}`} className="pc-imgbox" aria-label={p.name}>
        {p.images?.[0]
          ? <img className="pc-img" src={p.images[0]} alt={p.name} loading="lazy" />
          : <div className="pc-noimg">No image</div>}
        {hasDiscount && <span className="pc-badge">Sale</span>}
      </Link>

      {/* Content */}
      <div className="pc-content">
        <Link to={`/product/${p._id}`} className="pc-title">{p.name}</Link>

        <div className="pc-price">
          {hasDiscount && <span className="old">Rs. {Number(p.oldPrice).toFixed(2)}</span>}
          <span className="new">Rs. {Number(p.price).toFixed(2)}</span>
        </div>

        {/* ✅ Direct to checkout */}
        <Link to={`/checkout/${p._id}`} className="pc-buy">Buy Now</Link>
      </div>
    </article>
  );
}
