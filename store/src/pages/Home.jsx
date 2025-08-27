import './Home.css';
import { Link } from 'react-router-dom';
import api from '../api';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function Home(){
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    api.get('/public/products?limit=12&featured=true')
      .then(r=> {
        setProducts(Array.isArray(r.data?.items) ? r.data.items : []);
        setLoading(false);
      })
      .catch(()=> { 
        setErr('Could not load featured'); 
        setProducts([]);
        setLoading(false);
      });
  },[]);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Pure Ayurveda for Everyday Wellness</h1>
            <p>Backed by trusted herbs. Balanced by nature.</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn solid">Shop Now</Link>
              <a href="#featured" className="btn ghost">Browse Featured</a>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-blob" aria-hidden="true" />
            <div className="hero-product-preview">
              <div className="preview-bottle"></div>
              <div className="preview-leaves">
                <div className="leaf leaf-1"></div>
                <div className="leaf leaf-2"></div>
                <div className="leaf leaf-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">🌿</div>
              <h3>100% Natural</h3>
              <p>Pure herbal formulations with no artificial additives</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <h3>Fast Delivery</h3>
              <p>Free shipping on orders over $50</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🔒</div>
              <h3>Secure Payment</h3>
              <p>Your data is protected with encryption</p>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className="container featured">
        <div className="section-header">
          <h2 className="sec-title">Featured Products</h2>
          <Link to="/shop" className="view-all">View all →</Link>
        </div>
        
        {err && <div className="sec-error">{err}</div>}
        
        {loading ? (
          <div className="products-loading">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="sec-empty">No featured products yet.</div>
        ) : (
          <div className="home-grid">
            {products.map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        )}
      </section>

      <section className="newsletter-section">
        <div className="container newsletter-inner">
          <div className="newsletter-content">
            <h2>Join Our Wellness Community</h2>
            <p>Subscribe to get exclusive offers, wellness tips, and early access to new products.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}