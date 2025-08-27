import './Footer.css';
export default function Footer(){
  return (
    <footer className="nv-footer">
      <div className="container f-grid">
        <div><strong>Nature Vardan</strong><div className="dim">Pure Ayurvedic formulations</div></div>
        <div className="dim">© {new Date().getFullYear()} Nature Vardan</div>
      </div>
    </footer>
  );
}
