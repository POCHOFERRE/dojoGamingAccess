import { useMemo, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const NAMES = ['dojo', 'kirin', 'pixel', 'retro', 'katana', 'combo', 'arcade', 'chocobo', 'mako', 'zeta', 'alpha', 'beta'];

export default function AvatarPicker({ value, onSelect, onClose }) {
  const [selectedSeed, setSelectedSeed] = useState(value?.seed || 'dojo');
  
  // Update selected seed when value changes
  useEffect(() => {
    if (value?.seed) {
      setSelectedSeed(value.seed);
    }
  }, [value]);

  const avatars = useMemo(() => {
    return NAMES.map(name => ({
      seed: name,
      url: `https://api.dicebear.com/7.x/pixel-art/svg?size=96&seed=${encodeURIComponent(name)}`
    }));
  }, []);

  const handleSelect = (avatar) => {
    setSelectedSeed(avatar.seed);
    if (onSelect) {
      onSelect({
        seed: avatar.seed,
        url: avatar.url
      });
    }
  };

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-header">
        <h3>Elegí tu avatar</h3>
        <button className="close-button" onClick={onClose} aria-label="Cerrar">
          <FaTimes />
        </button>
      </div>
      
      <div className="avatar-grid">
        {avatars.map(avatar => (
          <button
            key={avatar.seed}
            type="button"
            onClick={() => handleSelect(avatar)}
            className={`avatar-option ${selectedSeed === avatar.seed ? 'selected' : ''}`}
            aria-label={`Avatar ${avatar.seed}`}
          >
            <img 
              src={avatar.url} 
              alt={avatar.seed} 
              width="64" 
              height="64" 
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="avatar-name">{avatar.seed}</span>
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .avatar-picker {
          width: 100%;
          max-width: 500px;
        }
        
        .avatar-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .avatar-picker-header h3 {
          margin: 0;
          color: var(--text-color);
        }
        
        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 15px;
          max-height: 400px;
          overflow-y: auto;
          padding: 5px;
        }
        
        .avatar-option {
          background: none;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .avatar-option.selected {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(0, 196, 204, 0.3);
        }
        
        .avatar-name {
          margin-top: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: capitalize;
          text-align: center;
        }
        
        @media (max-width: 480px) {
          .avatar-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 10px;
          }
          
          .avatar-option {
            padding: 6px;
          }
          
          .avatar-option img {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </div>
  )
}
