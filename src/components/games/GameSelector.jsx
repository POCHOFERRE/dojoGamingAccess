import { useState, useEffect } from 'react';
import DinoGame from './DinoGame';
import SnakeGame from './SnakeGame';
import RacingGame from './RacingGame';

import { FaTimes, FaGamepad, FaCar, FaTrophy } from 'react-icons/fa';
import { GiSnake } from 'react-icons/gi';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const GameModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const GameContainer = styled.div`
  background: #1a1a2e;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;
  color: #fff;
`;

const GameHeader = styled.div`
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #0f3460;
`;

const GameTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #e94560;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const CloseButton = styled.button`
  background: #e94560;
  border: none;
  border-radius: 50%;
  width: 36px; height: 36px;
  display: grid; place-items: center;
  color: #fff; cursor: pointer;
  transition: all .2s;
  box-shadow: 0 2px 5px rgba(0,0,0,.2);
  &:hover { background: #ff6b81; transform: scale(1.1); }
  &:active { transform: scale(.95); }
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const GameCard = styled.button`
  appearance: none;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all .3s ease;
  position: relative;
  overflow: hidden;
  color: inherit;

  &::before{
    content:'';
    position:absolute; inset:0 0 auto 0;
    height:4px; background:${p=>p.$color};
  }
  &:hover{
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,.3);
    background: rgba(255,255,255,.1);
  }
  &:active{ transform: translateY(-2px); }
`;

const GameIcon = styled.div`
  width: 60px; height: 60px; margin: 0 auto 15px;
  border-radius: 50%;
  display: grid; place-items:center;
  font-size: 28px;
  color: ${p=>p.$color};
  background: rgba(255,255,255,.1);
  box-shadow: 0 4px 15px rgba(0,0,0,.2);
  transition: all .3s ease;
  ${GameCard}:hover & { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
`;

const GameName = styled.h3`
  margin: 0 0 8px; color:#fff; font-size:1.2rem;
`;
const GameDescription = styled.p`
  margin: 0; color:#a0a8c0; font-size:.9rem; line-height:1.4;
`;

const HighScoreBadge = styled.div`
  position:absolute; top:10px; right:10px;
  background: rgba(0,0,0,.3);
  border-radius: 12px;
  padding: 2px 8px;
  font-size:.7rem; display:flex; align-items:center; gap:4px;
  color:#ffd700;
  svg{ font-size:.8rem; }
`;

const GameSelector = ({ onClose }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [highScores, setHighScores] = useState({ dino: 0, snake: 0, racing: 0 });

  useEffect(() => {
    const load = () => setHighScores({
      dino: parseInt(localStorage.getItem('dinoHighScore') || '0', 10),
      snake: parseInt(localStorage.getItem('snakeHighScore') || '0', 10),
      racing: parseInt(localStorage.getItem('racingHighScore') || '0', 10),
    });
    load();
    const onStorage = e => { if (e.key && e.key.includes('HighScore')) load(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const games = [
    { id: 'racing', name: 'Carreras', icon: <FaCar size={32} />, color: '#E91E63', component: RacingGame, description: 'Corre con tu coche', highScore: highScores.racing },
    { id: 'dino', name: 'Dino Run', icon: <FaGamepad size={32} />, color: '#4CAF50', component: DinoGame, description: 'Salta los cactus como el juego de Chrome', highScore: highScores.dino },
    { id: 'snake', name: 'Snake', icon: <GiSnake size={32} />, color: '#2196F3', component: SnakeGame, description: 'El clásico juego de la serpiente', highScore: highScores.snake },

  ];

  const renderGame = () => {
    switch (selectedGame) {
      case 'racing':  return <RacingGame onBack={() => setSelectedGame(null)} />;
      case 'dino':   return <DinoGame onBack={() => setSelectedGame(null)} />;
      case 'snake':  return <SnakeGame onBack={() => setSelectedGame(null)} />;

      default:
        return (
          <GameContainer role="dialog" aria-modal="true" aria-label="Selector de juegos">
            <GameHeader>
              <GameTitle>🎮 Juegos Clásicos</GameTitle>
              <CloseButton onClick={onClose} aria-label="Cerrar"><FaTimes /></CloseButton>
            </GameHeader>
            <GameGrid>
              {games.map(game => (
                <GameCard
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  $color={game.color}
                  aria-label={`Jugar ${game.name}`}
                >
                  {game.highScore > 0 && (
                    <HighScoreBadge><FaTrophy /> {game.highScore}</HighScoreBadge>
                  )}
                  <GameIcon $color={game.color}>{game.icon}</GameIcon>
                  <GameName>{game.name}</GameName>
                  <GameDescription>{game.description}</GameDescription>
                </GameCard>
              ))}
            </GameGrid>
          </GameContainer>
        );
    }
  };

  return (
    <GameModal onClick={(e) => e.target === e.currentTarget && onClose()}>
      {renderGame()}
    </GameModal>
  );
};

export default GameSelector;
