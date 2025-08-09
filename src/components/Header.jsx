import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignInAlt, FaGamepad, FaUserShield, FaChevronRight } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import AvatarPicker from '@/components/AvatarPicker.jsx';

const useIsMobile = (bp = 768) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < bp : true
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < bp);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [bp]);
  return isMobile;
};

// Extrae el seed de una URL dicebear ?seed=<name>
const getSeedFromDicebear = (url = '') => {
  try {
    const u = new URL(url);
    const seed = u.searchParams.get('seed');
    return seed || 'dojo';
  } catch {
    return 'dojo';
  }
};

export default function Header() {
  const [user, setUser] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [pressTimer, setPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    
    const handleAuthStateChanged = async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Update the auth user profile with the stored photoURL if it exists
          if (userData.photoURL && userData.photoURL !== user.photoURL) {
            await updateProfile(user, { photoURL: userData.photoURL });
            // Force refresh the user object
            setUser({ ...user, ...userData });
            return;
          }
          // Merge Firestore data with auth user
          setUser({ ...user, ...userData });
          return;
        }
      }
      setUser(user);
    };
    
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate('/');
  };

  const startPressTimer = () => {
    // Only allow admin access for admin users
    if (!isAdmin) return;
    
    // Reset progress
    setPressProgress(0);
    
    // Start a timer to track press duration
    const startTime = Date.now();
    const duration = 3000; // 3 seconds
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setPressProgress(progress);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        // Use a timeout to ensure state updates are complete before navigation
        setTimeout(() => {
          navigate('/admin', { replace: true });
          setPressProgress(0);
        }, 0);
      }
    }, 50);
    
    setPressTimer(interval);
  };
  
  const cancelPressTimer = () => {
    if (pressTimer) {
      clearInterval(pressTimer);
      setPressTimer(null);
      setPressProgress(0);
    }
  };

  const handleAvatarSelected = async ({ url }) => {
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
        // refleja de inmediato en UI
        setUser({ ...auth.currentUser, photoURL: url });
      }
    } catch (e) {
      console.error('Error actualizando avatar:', e);
    } finally {
      setShowAvatarPicker(false);
    }
  };

  const avatar = user?.photoURL;
  const displayName = user?.displayName?.split(' ')[0] || 'Jugador';

  const currentSeed = avatar ? getSeedFromDicebear(avatar) : 'dojo';
  const currentValue = { seed: currentSeed, url: avatar };

  return (
    <>
      {/* HEADER fijo estilo retro */}
      <header className="retro-header">
        <div className="retro-header__inner">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Link 
              to="/" 
              className="retro-logo" 
              aria-label="Inicio"
              onMouseDown={startPressTimer}
              onMouseUp={cancelPressTimer}
              onMouseLeave={cancelPressTimer}
              onTouchStart={startPressTimer}
              onTouchEnd={cancelPressTimer}
              onTouchCancel={cancelPressTimer}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <FaGamepad className="retro-logo__icon" />
              {!isMobile && <span className="retro-logo__text">DOJO GAMING</span>}
            </Link>
            {pressProgress > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                height: '3px',
                backgroundColor: 'var(--accent-color)',
                width: `${pressProgress}%`,
                maxWidth: '100%',
                transition: 'width 0.1s linear',
                borderRadius: '2px',
                zIndex: 2
              }} />
            )}
          </div>

          {/* Menú central solo desktop */}
          {!isMobile && (
            <nav className="retro-nav" aria-label="Secciones">
              <Link to="/consolas" className="retro-nav__link">🎮 Consolas</Link>
              <Link to="/cine" className="retro-nav__link">🎬 Cine</Link>
              <Link to="/merch" className="retro-nav__link">👕 Merch</Link>
            </nav>
          )}

          {/* Auth: en móvil solo avatar + nombre + salir */}
          <div className="retro-auth" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>

                <button
                  className="retro-avatar"
                  onClick={() => setShowAvatarPicker(true)}
                  title="Cambiar avatar"
                  aria-label="Cambiar avatar"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <FaUser />
                  )}
                </button>

                <Link to="/perfil" className="btn btn-sm retro-btn" aria-label="Perfil">
                  {displayName}
                </Link>

                <button
                  className="btn btn-sm retro-btn"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <FaSignInAlt style={{ transform: 'rotate(180deg)' }} />
                  
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm retro-btn" aria-label="Iniciar sesión">
                  <FaSignInAlt />
                  {!isMobile && <span>Entrar</span>}
                </Link>
                <Link to="/register" className="btn btn-sm retro-btn" aria-label="Registrarse">
                  <FaUser />
                  {!isMobile && <span>Registro</span>}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* separador para que el contenido no quede oculto bajo el header fijo */}
      <div className="retro-header__spacer" aria-hidden="true" />

      {/* Modal AvatarPicker con mapping de variables a tu tema */}
      {showAvatarPicker && (
        <div className="retro-modal" role="dialog" aria-modal="true" aria-label="Seleccionar avatar">
          <div className="retro-modal__card">
            <div className="avatar-theme">
              <AvatarPicker
                value={currentValue}
                onSelect={handleAvatarSelected}
                onClose={() => setShowAvatarPicker(false)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root{ --hdr-h: 64px; }

        .retro-header{
          position: fixed; top: 0; left: 0; right: 0; z-index: 1200;
          background: linear-gradient(180deg, #1e2236, #15192c);
          border-bottom: 3px solid rgba(255,255,255,.08);
          box-shadow: 0 10px 24px rgba(0,0,0,.35);
        }
        .retro-header::before{
          content:""; position:absolute; inset:0;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,.05), rgba(255,255,255,.05) 1px,
            transparent 1px, transparent 3px
          );
          opacity:.12; pointer-events:none;
        }
        .retro-header__inner{
          max-width: 1200px; margin: 0 auto; padding: 10px 16px;
          display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px;
        }
        .retro-header__spacer{ height: var(--hdr-h); }

        .retro-logo{
          display:flex; align-items:center; gap:8px;
          color: var(--text, #e1e1e1); text-decoration:none; font-weight: 900;
          text-shadow: 2px 2px 0 rgba(0,0,0,.35); white-space: nowrap;
        }
        .retro-logo__icon{ font-size: 1.25rem; }
        .retro-logo__text{ font-size: 1.05rem; letter-spacing: .5px; }

        .retro-nav{ display:flex; justify-content:center; gap: 1rem; flex-wrap: wrap; }
        .retro-nav__link{
          color: var(--text, #e1e1e1); text-decoration:none; font-size:.9rem;
          position:relative; padding:.35rem 0; text-transform: uppercase; letter-spacing:.6px;
        }
        .retro-nav__link::after{
          content:""; position:absolute; left:0; bottom:0; width:0; height:2px;
          background: var(--gba-hi, #ffcd75); transition: width .2s ease;
        }
        .retro-nav__link:hover::after{ width:100%; }

        .retro-auth{ display:flex; align-items:center; gap:8px; justify-content:flex-end; }
        .retro-btn{
          display:inline-flex; align-items:center; gap:6px;
          background: var(--accent, #b13e53);
          border: 2px solid rgba(255,255,255,.08); color:#fff; border-radius: 10px;
          padding: 8px 10px; line-height:1; box-shadow: 0 2px 0 rgba(0,0,0,.35);
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
          white-space: nowrap;
        }
        .retro-btn:hover{ filter: brightness(1.05); }
        .retro-btn:active{ transform: translateY(1px); box-shadow: 0 1px 0 rgba(0,0,0,.35); }

        .retro-avatar{
          width: 36px; height: 36px; border-radius: 8px;
          border: 2px solid rgba(255,255,255,.12);
          background: #20243a; color: #e1e1e1;
          display:grid; place-items:center; overflow:hidden; cursor:pointer;
          box-shadow: 0 2px 0 rgba(0,0,0,.35); flex: 0 0 auto;
        }
        .retro-avatar img{ width:100%; height:100%; object-fit:cover; image-rendering: pixelated; }

        /* Modal */
        .retro-modal{ position: fixed; inset:0; z-index: 1400; background: rgba(0,0,0,.55);
          display:grid; place-items:center; padding: 16px; }
        .retro-modal__card{
          width: min(560px, 100%); background: #1b1f31;
          border: 3px solid rgba(255,255,255,.1); border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,.45); padding: 16px;
        }

        /* Mapea variables del AvatarPicker a tu tema */
        .avatar-theme{
          --text-color: var(--text);
          --border-color: var(--line);
          --accent-color: var(--accent-2);
          --text-secondary: var(--muted);
        }

        @media (max-width: 768px){
          :root{ --hdr-h: 60px; }
          .retro-header__inner{
            grid-template-columns: auto auto;
            grid-auto-flow: column;
            justify-content: space-between;
          }
          .retro-nav{ display: none; }
          .retro-logo__text{ display: none; }
          .retro-btn{ padding: 8px 10px; font-size: .9rem; }
        }
      `}</style>
    </>
  );
}
