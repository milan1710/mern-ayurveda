import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext();

export function CartProvider({ children }){
  const [items, setItems] = useState(()=> {
    try { return JSON.parse(localStorage.getItem('nv_cart')||'[]'); }
    catch { return []; }
  });

  useEffect(()=> localStorage.setItem('nv_cart', JSON.stringify(items)), [items]);

  const add = (p, qty=1) => {
    setItems(prev=>{
      const i = prev.findIndex(x=>x.product===p._id);
      if(i>-1){ const copy=[...prev]; copy[i]={...copy[i], qty: copy[i].qty+qty}; return copy; }
      return [...prev, { product:p._id, name:p.name, price:p.price, image:(p.images||[])[0], qty }];
    });
  };
  const remove = (id) => setItems(prev=> prev.filter(x=>x.product!==id));
  const setQty = (id, qty) => setItems(prev=> prev.map(x=> x.product===id ? {...x, qty:Math.max(1,qty)} : x));
  const clear = () => setItems([]);

  const total = useMemo(()=> items.reduce((s,i)=> s + i.qty*i.price, 0), [items]);
  const count = useMemo(()=> items.reduce((s,i)=> s + i.qty, 0), [items]);

  return <CartCtx.Provider value={{items, add, remove, setQty, clear, total, count}}>
    {children}
  </CartCtx.Provider>
}
export const useCart = ()=> useContext(CartCtx);
