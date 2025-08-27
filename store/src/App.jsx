import { Routes, Route } from 'react-router-dom';
import SiteNav from './components/SiteNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

export default function App(){
  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/shop" element={<Shop/>} />
        <Route path="/product/:id" element={<Product/>} />
        <Route path="/cart" element={<Cart/>} />
        <Route path="/checkout" element={<Checkout/>} />
        <Route path="/checkout/:id" element={<Checkout />} />

      </Routes>
      <Footer />
    </>
  );
}
