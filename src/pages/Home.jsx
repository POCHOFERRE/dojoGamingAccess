
import { FaInstagram } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <section className="card mb-8">
        <div className="p-6 text-center">
          <h1 className="text-3xl mb-4">🕹️ BIENVENIDO A DOJO GAMING</h1>
          <p className="mb-6">TU DESTINO PARA LA MEJOR EXPERIENCIA DE ENTRETENIMIENTO. DISFRUTÁ DE NUESTRAS CONSOLAS, SIMULADORES Y MÁS.</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="px-4 py-2 bg-gba-darkest text-gba-lightest rounded-full text-sm font-bold border border-gba-light">
              🎮 CONSOLAS
            </span>
            <span className="px-4 py-2 bg-gba-darkest text-gba-lightest rounded-full text-sm font-bold border border-gba-light">
              🎬 CINE
            </span>
            <span className="px-4 py-2 bg-gba-darkest text-gba-lightest rounded-full text-sm font-bold border border-gba-light">
              🏆 MEMBRESÍAS
            </span>
          </div>
        </div>
      </section>
      
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a href="/consolas" className="block">
          <div className="card h-full hover:transform hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🎮</div>
            <h2 className="text-xl font-bold mb-2">CONSOLAS</h2>
            <p className="text-sm mb-4">RESERVÁ TU CONSOLA FAVORITA Y DISFRUTÁ DE HORAS DE DIVERSIÓN CON LOS MEJORES JUEGOS.</p>
            <span className="text-gba-lightest text-sm font-bold">VER CONSOLAS →</span>
          </div>
        </a>
        
        <a href="/cine" className="block">
          <div className="card h-full hover:transform hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-xl font-bold mb-2">CINE</h2>
            <p className="text-sm mb-4">DISFRUTÁ DE LAS MEJORES PELÍCULAS EN PANTALLA GIGANTE CON SONIDO ENVOLVENTE.</p>
            <span className="text-gba-lightest text-sm font-bold">VER CARTELERA →</span>
          </div>
        </a>
        
        <a href="/merch" className="block">
          <div className="card h-full hover:transform hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">👕</div>
            <h2 className="text-xl font-bold mb-2">MERCHANDISING</h2>
            <p className="text-sm mb-4">DESCUBRÍ NUESTRA COLECCIÓN DE PRODUCTOS EXCLUSIVOS CON DISEÑOS ÚNICOS.</p>
            <span className="text-gba-lightest text-sm font-bold">VER PRODUCTOS →</span>
          </div>
        </a>
        
        <a href="/membresias" className="block">
          <div className="card h-full hover:transform hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-bold mb-2">MEMBRESÍAS</h2>
            <p className="text-sm mb-4">ACCEDÉ A BENEFICIOS EXCLUSIVOS Y DESCUENTOS ESPECIALES COMO MIEMBRO.</p>
            <span className="text-gba-lightest text-sm font-bold">CONOCER BENEFICIOS →</span>
          </div>
        </a>
      </div>
      
      {/* Info Section */}
      <div className="card p-6 text-center">
        <h2 className="text-2xl mb-4">📅 HORARIO DE ATENCIÓN</h2>
        <p className="mb-4">LUNES A DOMINGO DE 14:00 A 23:00 HS</p>
        <div className="text-sm">
          <p>📍 DIRECCIÓN: LOS ARTESANOS 157, VILLA CARLOS PAZ</p>
          <div className="mt-4">
            <a 
              href="https://www.instagram.com/dojo_gaming_vcp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gba-lightest hover:text-accent transition-colors"
            >
              <FaInstagram className="text-xl" />
              <span> @dojo_gaming_vcp</span>
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Custom styles specific to the Home page */
        .card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 0 var(--gba-darkest);
        }
        
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--gba-light), var(--gba-lightest));
        }
        
        /* Animation for the hero section */
        @keyframes pixel-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .card {
            margin-bottom: 1rem;
          }
        }
        }
        
        .badges-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        
        .badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(5px);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
        }
        
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          width: 100%;
          margin-bottom: 24px;
        }
        
        .card {
          background: var(--card);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          height: 100%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-color: var(--accent);
        }
        
        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
          display: inline-block;
          transition: transform 0.3s ease;
        }
        
        .card:hover .card-icon {
          transform: scale(1.1);
        }
        
        .card h2 {
          margin: 0 0 12px 0;
          font-size: 1.4rem;
          color: var(--text);
          font-weight: 600;
        }
        
        .card p {
          margin: 0 0 16px 0;
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .card-cta {
          color: var(--accent);
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        .card:hover .card-cta {
          transform: translateX(4px);
        }
        
        .info-section {
          background: var(--card);
          border-radius: 16px;
          padding: 20px;
          margin-top: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .info-section h2 {
          font-size: 1.3rem;
          margin: 0 0 12px 0;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .info-section p {
          margin: 0 0 8px 0;
          color: var(--muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .contact-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        @media (max-width: 768px) {
          .home-container {
            padding: 12px 12px 100px;
          }
          
          .welcome-card {
            padding: 20px 16px;
            margin: 0 -4px 20px;
            border-radius: 0 0 20px 20px;
          }
          
          .welcome-card h1 {
            font-size: 1.5rem;
          }
          
          .card-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .card {
            padding: 20px;
          }
          
          .card h2 {
            font-size: 1.3rem;
          }
          
          .info-section {
            margin: 0 -4px;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }
        
        @media (min-width: 1024px) {
          .card-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1280px) {
          .card-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
