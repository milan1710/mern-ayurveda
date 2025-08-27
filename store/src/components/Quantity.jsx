import './Quantity.css';
export default function Quantity({ value, onChange, min=1 }){
  return (
    <div className="qty">
      <button onClick={()=>onChange(Math.max(min, value-1))}>−</button>
      <input value={value} onChange={e=>onChange(Math.max(min, Number(e.target.value)||min))}/>
      <button onClick={()=>onChange(value+1)}>+</button>
    </div>
  );
}
