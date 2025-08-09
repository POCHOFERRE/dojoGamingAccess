// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaLock, FaGoogle, FaGamepad, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* decor CRT */}
      <div className="crt-overlay" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      <motion.section
        className="login-card gba-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <header className="login-head">
          <FaGamepad className="logo" aria-hidden="true" />
          <h1 className="title">Iniciar sesión</h1>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <AnimatePresence>
            {error && (
              <motion.div
                className="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <label className="field">
            <span className="visually-hidden">Correo electrónico</span>
            <FaUser className="field-icon" aria-hidden="true" />
            <input
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Correo electrónico"
            />
          </label>

          <label className="field">
            <span className="visually-hidden">Contraseña</span>
            <FaLock className="field-icon" aria-hidden="true" />
            <input
              className="input"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Contraseña"
            />
            <button
              type="button"
              className="toggle-pass"
              onClick={() => setShowPass((p) => !p)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>

          <motion.button
            type="submit"
            className="btn gba-btn"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
                </svg>
                Ingresando…
              </>
            ) : (
              <>
                <FaSignInAlt /> Ingresar
              </>
            )}
          </motion.button>

          <div className="divider"><span>o continúa con</span></div>

          <motion.button
            type="button"
            className="btn gba-btn alt"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            whileHover={!isLoading ? { y: -2 } : {}}
            whileTap={!isLoading ? { y: 0 } : {}}
          >
            <FaGoogle /> Google
          </motion.button>

          <p className="hint">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="link">Registrate</Link>
          </p>
        </form>
      </motion.section>

      {/* estilos */}
      <style>{`
        :root{
          --bg-login: linear-gradient(180deg, #0a1822, #0f2830);
          --panel: #14232b;
          --card: #1a2c2c;
          --line: #355047;
          --text: #e0f8d0;
          --muted: #86c06c;
          --accent: #306850;
          --accent-2: #4facfe;
          --accent-3: #86c06c;
        }

        .login-wrap{
          position:relative;
          min-height: calc(100svh - var(--header-h, 64px));
          padding: 16px;
          padding-top: max(16px, calc(var(--header-h, 64px) + 8px));
          display:grid; place-items:center;
          background: var(--bg-login);
          overflow:hidden;
          font-family: 'Press Start 2P','Courier New',monospace;
        }

        /* CRT vibes */
        .crt-overlay{
          position:fixed; inset:0;
          background:
            linear-gradient(to bottom, rgba(134,192,108,0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(134,192,108,0.04) 1px, transparent 1px);
          background-size:100% 8px, 8px 100%;
          opacity:.35; pointer-events:none; z-index:0;
        }
        .scanlines{
          position:fixed; inset:0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size:100% 3px;
          mix-blend-mode: overlay;
          opacity:.25; pointer-events:none; z-index:0;
        }

        .login-card{
          width:100%; max-width:420px;
          background: rgba(26,44,44,.9);
          border:3px solid var(--line);
          box-shadow: 0 6px 0 #0f2830, 0 0 0 3px rgba(0,0,0,.25);
          position:relative; z-index:1;
          overflow:hidden; padding:20px 18px 18px;
        }
        .login-card::before{
          content:''; position:absolute; top:0; left:0; right:0; height:6px;
          background: linear-gradient(90deg, #306850, #86c06c);
        }

        .login-head{ text-align:center; margin-bottom:16px; }
        .logo{ font-size:38px; color: var(--accent-2); filter: drop-shadow(2px 2px 0 #0f2830); }
        .title{
          margin:10px 0 0; color:#f8f8d8; font-size:1.2rem; letter-spacing:2px; text-transform:uppercase;
          text-shadow:2px 2px 0 #0f2830;
        }

        .form{ display:grid; gap:12px; }

        .alert{
          background: rgba(255, 82, 82, .12);
          color: #ff9c9c;
          padding: 10px 12px;
          border-left: 3px solid #ff6b6b;
          border-radius: 8px;
          font-size: .8rem;
        }

        .field{ position:relative; display:block; }
        .field-icon{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color: rgba(255,255,255,.6); font-size:1rem;
        }
        .input{
          width:100%; padding:12px 44px 12px 40px;
          border-radius:8px; border:3px solid var(--line);
          background: rgba(26,44,44,.85);
          color: var(--text); font-size:.85rem;
          box-shadow: inset 0 2px 0 rgba(0,0,0,.1);
          outline:none; transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .input::placeholder{ color:#5a6c4e; opacity:.8; }
        .input:focus{
          border-color: var(--accent-3);
          box-shadow: 0 0 0 3px rgba(134,192,108,.25);
          background: rgba(26,44,44,.95);
        }

        .toggle-pass{
          position:absolute; right:8px; top:50%; transform:translateY(-50%);
          display:grid; place-items:center;
          width:36px; height:36px;
          border:2px solid var(--line); border-radius:8px;
          background:#1f2f2f; color:#cfead3;
          transition: transform .1s ease, box-shadow .1s ease, border-color .15s ease;
        }
        .toggle-pass:active{ transform: translateY(1px); }
        .toggle-pass:hover{ border-color: var(--accent-3); }

        .btn.gba-btn{
          display:flex; align-items:center; justify-content:center; gap:10px;
          font-weight:900; text-transform:uppercase; letter-spacing:1px;
          padding:12px 16px; border-radius:12px;
          border:3px solid var(--line); background: var(--accent);
          color:#f8f8d8; box-shadow: 0 4px 0 #0f2830;
          transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
        }
        .btn.gba-btn:hover{ transform: translateY(-2px); box-shadow: 0 6px 0 #0f2830; filter:brightness(1.05); }
        .btn.gba-btn:active{ transform: translateY(2px); box-shadow: 0 2px 0 #0f2830; }
        .btn.gba-btn:disabled{ opacity:.75; transform:none; box-shadow:none; }

        .btn.gba-btn.alt{
          background:#21464a;
        }

        .divider{
          display:flex; align-items:center; gap:10px; color:#5a6c4e; font-size:.7rem;
          margin:10px 0 6px;
        }
        .divider::before, .divider::after{
          content:''; height:2px; background:#5a6c4e; flex:1; box-shadow:0 1px 0 rgba(0,0,0,.2);
        }

        .hint{
          margin-top:8px; text-align:center; color:#bfe7c1; font-size:.75rem;
        }
        .link{
          color: var(--accent-3); text-decoration:none;
        }
        .link:hover{ color:#f8f8d8; text-decoration:none; }

        /* spinner */
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        @keyframes dash {
          0%   { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 90,150; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90,150; stroke-dashoffset: -124; }
        }
        .spinner{ width:18px; height:18px; animation: rotate 2s linear infinite; }
        .spinner .path{ stroke:#fff; stroke-linecap:round; animation: dash 1.5s ease-in-out infinite; }

        /* Mobile-first tweaks */
        @media (max-width: 420px){
          .login-card{ padding:16px 14px 14px; }
          .title{ font-size:1.05rem; }
        }

        /* Respeta header sticky del layout */
        @media (min-width: 768px){
          .login-wrap{
            padding-top: max(24px, calc(var(--header-h, 64px) + 16px));
          }
        }

        /* Accesibilidad */
        .visually-hidden{
          position:absolute !important; height:1px; width:1px; overflow:hidden;
          clip:rect(1px,1px,1px,1px); white-space:nowrap;
        }
      `}</style>
    </div>
  );
}
