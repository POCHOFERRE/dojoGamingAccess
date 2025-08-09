import { Routes, Route, Link, useLocation, useNavigate, Navigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Styles
import '@/styles/gba-theme.css';

// Páginas
import Home from '@/pages/Home.jsx';
import Consolas from '@/pages/Consolas.jsx';
import Cine from '@/pages/Cine.jsx';
import Merch from '@/pages/Merch.jsx';
import MisReservas from '@/pages/MisReservas.jsx';
import AdminCheckin from '@/pages/AdminCheckin.jsx';
import AdminPanel from '@/pages/AdminPanel.jsx';
import NotFound from '@/pages/NotFound.jsx';
import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';

// Contextos
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';
import { BookingsProvider } from '@/context/BookingsContext.jsx';

// UI
import MobileNavigation from '@/components/MobileNavigation.jsx';
import Header from '@/components/Header.jsx';

// Wrapper redirect Firebase
import { checkRedirectResult } from '@/firebase/config';

/* -------- Navegación de escritorio -------- */
function DesktopNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: '👾', exact: true },
    { path: '/consolas', label: 'Consolas', icon: '🎮' },
    { path: '/cine', label: 'Cine', icon: '🎬' },
    { path: '/merch', label: 'Merch', icon: '👕' },
    { path: '/mis-reservas', label: 'Mis reservas', icon: '📋' },
    { 
      path: '/admin', 
      label: 'Admin', 
      icon: '⚙️', 
      admin: true,
      show: isAdmin
    },
    { 
      path: '/admin/checkin', 
      label: 'Check-in', 
      icon: '🔒', 
      admin: true 
    }
  ].filter(item => !item.admin || (item.admin && isAdmin));

  return (
    <nav className="gba-card" aria-label="Navegación principal">
      <div className="gba-tabs" role="tablist">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path) && item.path !== '/';
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`gba-tab ${isActive ? 'active' : ''} ${item.admin ? 'admin' : ''}`}
              role="tab"
              aria-selected={isActive}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span style={{ fontSize: 12 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* -------- Auth + redirect -------- */
function AuthHandler({ children }) {
  const { loading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const resultUser = await checkRedirectResult();
        if (resultUser) {
          const redirectTo = location.state?.from || '/';
          navigate(redirectTo, { replace: true });
        }
      } catch (e) {
        console.error('Error handling auth redirect:', e);
      } finally {
        setAuthChecked(true);
      }
    };
    if (!loading) handleAuthRedirect();
  }, [loading, navigate, location]);

  if (loading || !authChecked) {
    return (
      <div className="gba-screen" style={{ display: 'grid', placeItems: 'center', minHeight: '60svh' }}>
        <div className="gba-card" style={{ textAlign: 'center' }}>
          <h2 className="gba-title">Cargando...</h2>
          <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>
    );
  }
  return children;
}

/* -------- Rutas protegidas -------- */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useRouterLocation();
  
  // Redirect to login if not authenticated
  if (!user) {
    // Only include the from path in the state, not the whole location object
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check if user has admin role
  const isAdmin = user.role === 'admin' || user.role === 'staff';
  
  if (!isAdmin) {
    // Redirect to home if not admin
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : true
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIfMobile = () => window.innerWidth < 768;
    const onResize = () => setIsMobile(checkIfMobile());

    document.body.style.overflowX = 'hidden';
    const timer = setTimeout(() => setIsLoading(false), 250);

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // altura de la bottom nav (si es fija)
    document.documentElement.style.setProperty('--mobile-nav-height', checkIfMobile() ? '70px' : '0px');

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="gba-screen" style={{ display: 'grid', placeItems: 'center', minHeight: '60svh' }}>
        <div className="gba-card" style={{ textAlign: 'center' }}>
          <h2 className="gba-title">Cargando DOJO GAMING</h2>
          <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container gba-theme">
      <AuthProvider>
        <BookingsProvider>
          <AuthHandler>
            <div className="app-layout">
              {/* STICKY HEADER */}
              <header className="app-header">
                <div className="container">
                  <Header />
                  {!isMobile && <DesktopNavigation />}
                </div>
              </header>

              {/* Contenido: SIN padding-top grande (sticky no tapa) */}
              <main className="app-main">
                <div className="container">
                  <Routes>
                    <Route index element={<Home />} />
                    <Route path="/consolas" element={<Consolas />} />
                    <Route path="/cine" element={<Cine />} />
                    <Route path="/merch" element={<Merch />} />
                    <Route path="/mis-reservas" element={<PrivateRoute><MisReservas /></PrivateRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/checkin" element={<AdminRoute><AdminCheckin /></AdminRoute>} />
                    <Route path="/admin/*" element={
                      <AdminRoute>
                        <AdminPanel />
                      </AdminRoute>
                    } />
                    
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>

              <footer className="app-footer">
                <div className="container">
                  <p className="footer-text">© {new Date().getFullYear()} DOJO GAMING</p>
                  <p className="footer-subtext">PRESIONA START PARA CONTINUAR</p>
                </div>
              </footer>

              {isMobile && <MobileNavigation />}
            </div>
          </AuthHandler>
        </BookingsProvider>
      </AuthProvider>

      <style>{`
        :root{
          --mobile-nav-height: 70px;
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 12px;
          --spacing-lg: 16px;
          --border-color: rgba(255,255,255,0.1);
        }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .loading-dots span { animation: blink 1.4s infinite both; font-size: 30px; }
        .loading-dots span:nth-child(2){ animation-delay:.2s }
        .loading-dots span:nth-child(3){ animation-delay:.4s }

        .app-container{ display:flex; flex-direction:column; min-height:100vh; width:100%; overflow-x:hidden; background: var(--bg); }
        .app-layout{ display:flex; flex-direction:column; min-height:100vh; width:100%; }

        /* Sticky header bien pegado arriba con safe-area */
        .app-header{
          position: sticky;
          top: env(safe-area-inset-top, 0);
          z-index: 1000;
          background: var(--bg);
          box-shadow: 0 2px 10px rgba(0,0,0,.1);
          padding: var(--spacing-sm) 0;
        }

        /* Main sin padding-top (solo un margen pequeño) */
        .app-main{
          flex:1 0 auto;
          width:100%;
          padding-top: var(--spacing-sm);
          padding-bottom: calc(var(--mobile-nav-height) + var(--spacing-sm));
          overflow-x:hidden;
        }

        /* Evita que el primer hijo meta un margen colapsado extraño */
        .app-main .container > :first-child { margin-top: 0; }

        .app-footer{
          background: var(--bg);
          padding: var(--spacing-sm) 0;
          border-top: 1px solid var(--border-color);
        }
        .footer-text{ margin:0; font-size:.8rem; text-align:center; color: var(--text); }
        .footer-subtext{ font-size:.7rem; margin:4px 0 0; opacity:.85; text-align:center; color: var(--text-muted); }

        .container{
          width:100%;
          padding-left: 1rem;
          padding-right: 1rem;
          margin-left:auto;
          margin-right:auto;
          max-width: 1280px;
        }

        @media (max-width: 767px){
          .app-main{
            padding-top: var(--spacing-sm);
            padding-bottom: calc(var(--mobile-nav-height) + var(--spacing-sm));
          }
        }
      `}</style>
    </div>
  );
}
