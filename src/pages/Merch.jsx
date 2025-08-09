// src/pages/Merch.jsx
import { useMemo, useState } from 'react';
import { FaCrown, FaGem, FaMedal, FaTruck, FaCheck, FaTshirt, FaSnowflake, FaHatCowboy } from 'react-icons/fa';

const TIERS = [
  {
    id: 'oro',
    name: 'Oro',
    hours: 3,
    price: 15000,
    icon: <FaMedal />,
    perks: ['Priority Check‑in', '1 bebida de cortesía', 'Sticker edición retro'],
    theme: 'tier--oro',
  },
  {
    id: 'platino',
    name: 'Platino',
    hours: 5,
    price: 24000,
    icon: <FaCrown />,
    perks: ['Priority Check‑in', '2 bebidas', '10% OFF en merch', 'Sticker + pin'],
    theme: 'tier--plat',
    featured: true,
  },
  {
    id: 'diamante',
    name: 'Diamante',
    hours: 10,
    price: 42000,
    icon: <FaGem />,
    perks: ['Priority absoluto', '4 bebidas', '15% OFF en merch', 'Llavero Dojo'],
    theme: 'tier--dia',
  },
];

const MERCH = [
  {
    id: 'cap',
    name: 'Gorra Dojo',
    price: 12000,
    colors: ['negra', 'bordó', 'azul'],
    sizes: ['Única'],
    icon: <FaHatCowboy />,
    stock: 'disponible',
    badge: 'nuevo',
  },
  {
    id: 'tee',
    name: 'Remera Dojo',
    price: 16000,
    colors: ['negra', 'blanca', 'bordó'],
    sizes: ['S', 'M', 'L', 'XL'],
    icon: <FaTshirt />,
    stock: 'pocas unidades',
    badge: 'popular',
  },
  {
    id: 'neck',
    name: 'Cuellito Dojo',
    price: 9000,
    colors: ['negro', 'gris'],
    sizes: ['Única'],
    icon: <FaSnowflake />,
    stock: 'disponible',
    badge: 'invierno',
  },
];

export default function Merch() {
  const [buying, setBuying] = useState(null);

  const handleBuyTier = (tier) => {
    setBuying(`Membresía ${tier.name} — ${tier.hours}h`);
    setTimeout(() => {
      alert(`✅ ¡Compra simulada!\n${tier.name} (${tier.hours}h) por $${tier.price.toLocaleString('es-AR')}`);
      setBuying(null);
    }, 350);
  };

  const handleBuyMerch = (item, color, size) => {
    alert(`🛒 Agregado (simulado): ${item.name} — ${color} — ${size} — $${item.price.toLocaleString('es-AR')}`);
  };

  return (
    <div className="merch container">
      {/* Membresías */}
      <section className="gba-card">
        <header className="section-head">
          <h2 className="gba-title">🧢 Membresías</h2>
          <span className="hint"><FaTruck /> Entrega instantánea + aplica a reservas</span>
        </header>

        <div className="tier-grid">
          {TIERS.map((t) => (
            <article key={t.id} className={`tier gba-card ${t.theme} ${t.featured ? 'featured' : ''}`}>
              <div className="tier-top">
                <div className="tier-icon">{t.icon}</div>
                <div className="tier-title">
                  <h3>{t.name}</h3>
                  <p className="hours">{t.hours} horas</p>
                </div>
                {t.featured && <span className="badge">Recomendado</span>}
              </div>

              <ul className="perks">
                {t.perks.map((p) => (
                  <li key={p}><FaCheck /> {p}</li>
                ))}
              </ul>

              <div className="tier-cta">
                <div className="price">${t.price.toLocaleString('es-AR')}</div>
                <button
                  className="btn"
                  onClick={() => handleBuyTier(t)}
                  disabled={buying !== null}
                >
                  {buying ? 'Procesando…' : 'Comprar (simulado)'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Merch */}
      <section className="gba-card">
        <header className="section-head">
          <h2 className="gba-title">👕 Merch oficial</h2>
          <span className="hint">Gorras, remeras y cuellitos del Dojo</span>
        </header>

        <div className="merch-grid">
          {MERCH.map((m) => (
            <MerchCard key={m.id} item={m} onBuy={handleBuyMerch} />
          ))}
        </div>
      </section>

      <style>{`
        .merch { padding-bottom: 8px; }

        .section-head{
          display:flex; align-items:center; justify-content:space-between; gap:8px;
          margin-bottom:12px;
        }
        .hint{ color: var(--muted); font-size:.9rem; display:flex; align-items:center; gap:6px; }

        /* ===== Membresías ===== */
        .tier-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap:12px;
        }
        .tier{
          background: var(--card);
          border: 3px solid var(--line);
          border-radius: 12px;
          padding: 14px;
          position:relative;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.25), 4px 4px 0 rgba(0,0,0,0.35);
        }
        .tier.featured{
          box-shadow: 0 0 16px rgba(239,125,87,0.25), 4px 4px 0 rgba(0,0,0,0.6);
          transform: translateY(-1px);
        }
        .tier-top{
          display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px;
        }
        .tier-icon{ font-size:1.6rem; filter: drop-shadow(2px 2px 0 rgba(0,0,0,.25)); color: var(--accent-3); }
        .tier-title h3{ margin:0; }
        .hours{ color: var(--muted); margin-top:2px; font-size:.9rem; }
        .badge{
          background: linear-gradient(180deg, var(--accent-2), var(--accent));
          color:#fff; border:2px solid rgba(255,255,255,.15);
          padding:4px 8px; border-radius:8px; font-weight:900; font-size:.75rem;
          box-shadow: 0 2px 0 rgba(0,0,0,.35);
        }
        .perks{
          list-style:none; margin:10px 0 12px; padding:0; display:grid; gap:6px;
        }
        .perks li{ display:flex; align-items:center; gap:8px; color: var(--text); }
        .perks svg{ color: var(--accent-3); }

        .tier-cta{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .price{
          font-family:'Press Start 2P','Courier New',monospace; font-weight:900;
          color:#fff; border:2px solid var(--accent-2);
          background: linear-gradient(180deg, var(--accent-2), var(--accent));
          padding:8px 10px; border-radius:8px;
        }

        .tier--oro   .tier-icon{ color:#ffcd75; }
        .tier--plat  .tier-icon{ color:#9ad1ff; }
        .tier--dia   .tier-icon{ color:#a3ffe1; }

        /* ===== Merch ===== */
        .merch-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap:12px;
        }
        .merch-card{
          background: #20243a; border:2px solid var(--line); border-radius:12px;
          padding:14px; display:grid; gap:10px;
          box-shadow: 3px 3px 0 rgba(0,0,0,0.35);
        }
        .merch-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .merch-icon{ font-size:1.6rem; filter: drop-shadow(2px 2px 0 rgba(0,0,0,.25)); }
        .merch-name{ font-weight:900; margin:0; }
        .stock{ font-size:.8rem; color: var(--muted); }

        .pill{
          font-size:.7rem; text-transform:uppercase; letter-spacing:.5px; font-weight:900;
          padding:4px 8px; border-radius:999px; border:1px solid var(--line);
          background: rgba(255,255,255,.06); color: var(--text);
        }
        .pill[data-variant="popular"]{ background: rgba(239,125,87,.15); border-color: var(--accent-2); }
        .pill[data-variant="nuevo"]{ background: rgba(255,205,117,.15); border-color: var(--accent-3); }
        .pill[data-variant="invierno"]{ background: rgba(122,162,255,.15); }

        .opts{ display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
        .select{
          width:100%; padding:10px 12px; border-radius:8px;
          border:2px solid var(--line); background:#1f2336; color:var(--text); font-weight:700;
          outline:none; transition: box-shadow .15s ease, border-color .15s ease;
        }
        .select:focus{ border-color: var(--accent-2); box-shadow: 0 0 0 3px rgba(239,125,87,0.25); }

        .buy{
          display:flex; align-items:center; justify-content:space-between; gap:10px;
        }
        .buy .price{ font-weight:900; }
        .buy .btn{ white-space:nowrap; }

        /* Mobile tweaks */
        @media (max-width: 480px){
          .tier-grid, .merch-grid{ grid-template-columns: 1fr; }
          .opts{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ===== Tarjeta de producto ===== */
function MerchCard({ item, onBuy }) {
  const [color, setColor] = useState(item.colors[0]);
  const [size, setSize] = useState(item.sizes[0]);

  const badgeVariant = useMemo(() => {
    switch (item.badge) {
      case 'popular': return 'popular';
      case 'invierno': return 'invierno';
      default: return 'nuevo';
    }
  }, [item.badge]);

  return (
    <article className="merch-card">
      <div className="merch-head">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="merch-icon">{item.icon}</div>
          <div>
            <h3 className="merch-name">{item.name}</h3>
            <div className="stock">Estado: {item.stock}</div>
          </div>
        </div>
        <span className="pill" data-variant={badgeVariant}>{item.badge}</span>
      </div>

      <div className="opts">
        <label>
          <span style={{ display:'block', color:'var(--muted)', marginBottom:6 }}>Color</span>
          <select className="select" value={color} onChange={(e)=>setColor(e.target.value)}>
            {item.colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span style={{ display:'block', color:'var(--muted)', marginBottom:6 }}>Talle</span>
          <select className="select" value={size} onChange={(e)=>setSize(e.target.value)}>
            {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="buy">
        <div className="price">${item.price.toLocaleString('es-AR')}</div>
        <button className="btn" onClick={() => onBuy(item, color, size)}>Agregar (simulado)</button>
      </div>
    </article>
  );
}
