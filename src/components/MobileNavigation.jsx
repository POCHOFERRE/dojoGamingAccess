import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaGamepad, FaFilm, FaTshirt, FaClipboardList, FaUserCog } from 'react-icons/fa';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import GameSelector from './games/GameSelector';

export default function MobileNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [showGame, setShowGame] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const navItems = [
    { path: '/', icon: <FaHome />, label: ' ' },
    { path: '/consolas', icon: <FaGamepad />, label: ' ' },
    { path: '/cine', icon: <FaFilm />, label: ' ' },
    { path: '/merch', icon: <FaTshirt />, label: ' ' },
    { path: '/mis-reservas', icon: <FaClipboardList />, label: ' ' },
    ...(isAdmin ? [
      { path: '/admin', icon: <FaUserCog />, label: ' ' }
    ] : [])
  ];

  return (
    <>
      <nav className="retro-fab-nav" role="navigation" aria-label="Navegación móvil">
        <div className="retro-fab-track">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`retro-btn ${active ? 'active' : ''}`}
                aria-label={item.label}
              >
                <span className="retro-icon">{item.icon}</span>
                <span className="retro-label">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className="retro-btn"
            onClick={() => setShowGame(true)}
            aria-label="Juegos"
          >
            <span className="retro-icon">
              <FaGamepad />
            </span>
          </button>
        </div>

        {/* decor: brillo arriba */}
        <div className="retro-glow" aria-hidden="true" />
      </nav>

      {showGame && <GameSelector onClose={() => setShowGame(false)} />}

      {/* ---- Estilos scoped ---- */}
      <style>{`
        .retro-fab-nav{
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
          width: min(94vw, 640px);
          z-index: 1000;

          /* carcasa retro */
          background: linear-gradient(180deg, #1e2236, #161a2b);
          border-radius: 18px;
          border: 2px solid rgba(255,255,255,0.08);
          box-shadow:
            0 10px 24px rgba(0,0,0,.45),
            inset 0 0 0 2px rgba(0,0,0,.35);

          /* “pixel frame” sutil con doble borde */
          outline: 3px solid rgba(0,0,0,.25);
          outline-offset: -6px;

          /* scanlines suaves */
          overflow: hidden;
        }

        .retro-fab-nav::before{
          content:"";
          position:absolute; inset:0;
          background:
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,.05), rgba(255,255,255,.05) 1px,
              transparent 1px, transparent 3px
            );
          opacity:.18;
          pointer-events:none;
        }

        .retro-fab-track{
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          align-items: stretch;
          gap: 6px;
          padding: 8px;
        }

        .retro-btn{
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          gap: 2px;
          min-width: 0;
          padding: 10px 8px;
          border-radius: 12px;
          border: 2px solid rgba(255,255,255,0.06);
          background: #20243a;
          color: var(--gba-text, #e1e1e1);
          text-decoration:none;
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease;
          box-shadow: 0 2px 0 rgba(0,0,0,.35);
        }
        .retro-btn:active{ transform: translateY(1px); }
        .retro-btn:hover{ background:#242848; border-color: rgba(255,255,255,0.12); }

        .retro-btn.active{
          background: linear-gradient(180deg, var(--gba-light, #5d275d), var(--gba-dark, #1a1c2c));
          border-color: rgba(255,255,255,0.18);
          box-shadow:
            0 0 12px rgba(239,125,87,0.35),
            inset 0 0 0 2px rgba(255,255,255,0.06);
        }

        .retro-icon{
          font-size: 1.2rem;
          line-height: 1;
          display:grid; place-items:center;
          filter: drop-shadow(0 1px 0 rgba(0,0,0,.4));
        }

        .retro-label{
          font-size: .62rem;
          letter-spacing: .5px;
          text-transform: uppercase;
          font-weight: 800;
          opacity: .9;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* glow superior */
        .retro-glow{
          position:absolute;
          top:-10px; left:10%; right:10%; height:14px;
          background: radial-gradient(ellipse at center, rgba(255,205,117,.45), transparent 70%);
          filter: blur(8px);
          pointer-events:none;
        }

        /* tamaños y densidad para móvil */
        @media (max-width: 380px){
          .retro-icon{ font-size: 1.05rem; }
          .retro-label{ font-size: .56rem; }
          .retro-btn{ padding: 8px 6px; }
        }
      `}</style>
    </>
  );
}
