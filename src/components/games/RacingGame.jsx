import { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';

// === Estilos del juego de carreras ===
const GameContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #222;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const GameCanvas = styled.canvas`
  background: #333;
  border: 4px solid #444;
  border-radius: 8px;
  max-width: 100%;
  max-height: 70vh;
  touch-action: none;
  image-rendering: pixelated;
`;

const GameUI = styled.div`
  color: white;
  font-family: 'Press Start 2P', cursive;
  font-size: 1rem;
  margin: 1rem 0;
  text-align: center;
`;

const Controls = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  background: #4CAF50;
  border: none;
  color: white;
  padding: 0.8rem 1.5rem;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1rem;
  margin: 0.5rem;
  cursor: pointer;
  border-radius: 5px;
  font-family: 'Press Start 2P', cursive;
  
  &:active {
    transform: translateY(2px);
  }
`;

// === Lógica del juego de carreras ===
const RacingGame = ({ onClose }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const animationFrameId = useRef();

  // Cargar imagen del coche
  const carImage = useRef(new Image());
  carImage.current.src = 'https://upload.wikimedia.org/wikipedia/commons/7/77/Alpine_A521_F1_2021_06.jpg'; // Alpine F1

  // Game variables
  const car = useRef({
    x: 150,
    y: 400,
    width: 50,
    height: 80,
    speed: 5,
  });

  const road = useRef({
    y: 0,
    speed: 3,
  });

  const obstacles = useRef([]);
  const keys = useRef({});
  const lastObstacleTime = useRef(0);
  const gameTime = useRef(0);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('racingHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle touch controls
  const handleTouchStart = (e) => {
    if (!gameStarted) {
      startGame();
      return;
    }

    const touchX = e.touches[0].clientX;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = touchX - rect.left;

    if (canvasX < canvas.width / 2) {
      // Left side of screen
      keys.current['ArrowLeft'] = true;
      keys.current['ArrowRight'] = false;
    } else {
      // Right side of screen
      keys.current['ArrowRight'] = true;
      keys.current['ArrowLeft'] = false;
    }
  };

  const handleTouchEnd = () => {
    keys.current['ArrowLeft'] = false;
    keys.current['ArrowRight'] = false;
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    gameTime.current = 0;
    obstacles.current = [];
    car.current = {
      x: 150,
      y: 400,
      width: 50,
      height: 80,
      speed: 5,
    };
    road.current = {
      y: 0,
      speed: 3,
    };

    // Start game loop
    gameLoop();
  };

  const gameLoop = (timestamp) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw road
    drawRoad(ctx, canvas);

    // Update and draw car
    updateCar(canvas);
    drawCar(ctx);

    // Update and draw obstacles
    updateObstacles(canvas, timestamp);
    drawObstacles(ctx);

    // Check collisions
    if (checkCollisions()) {
      endGame();
      return;
    }

    // Update score
    gameTime.current++;
    if (gameTime.current % 10 === 0) {
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('racingHighScore', newScore.toString());
        }
        return newScore;
      });
    }

    // Increase difficulty
    if (gameTime.current % 500 === 0) {
      road.current.speed = Math.min(road.current.speed + 0.5, 10);
    }

    // Continue game loop
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const drawRoad = (ctx, canvas) => {
    // Draw road
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road markings
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.setLineDash([20, 20]);

    // Move road
    road.current.y += road.current.speed;
    if (road.current.y > 40) road.current.y = 0;

    // Draw dashed center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, road.current.y - 40);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);
  };

  const updateCar = (canvas) => {
    // Move car left/right with arrow keys or touch
    if (keys.current['ArrowLeft'] || keys.current['a']) {
      car.current.x = Math.max(0, car.current.x - car.current.speed);
    }
    if (keys.current['ArrowRight'] || keys.current['d']) {
      car.current.x = Math.min(canvas.width - car.current.width, car.current.x + car.current.speed);
    }
  };

  const drawCar = (ctx) => {
    // Draw car body (Alpine F1)
    const carImage = new Image();
    carImage.src = car.current.image;
    carImage.onload = () => {
      ctx.drawImage(carImage, car.current.x, car.current.y, car.current.width, car.current.height);
    };
  };

  const updateObstacles = (canvas, timestamp) => {
    // Add new obstacles
    if (timestamp - lastObstacleTime.current > 2000) { // Every 2 seconds
      const width = 60 + Math.random() * 60;
      const x = Math.random() * (canvas.width - width);

      obstacles.current.push({
        x,
        y: -100,
        width,
        height: 80,
        speed: 3 + Math.random() * 2,
      });

      lastObstacleTime.current = timestamp;
    }

    // Update obstacle positions
    obstacles.current = obstacles.current.filter(obstacle => {
      obstacle.y += obstacle.speed;
      return obstacle.y < canvasRef.current.height;
    });
  };

  const drawObstacles = (ctx) => {
    ctx.fillStyle = '#e74c3c';
    obstacles.current.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  };

  const checkCollisions = () => {
    return obstacles.current.some(obstacle => {
      return (
        car.current.x < obstacle.x + obstacle.width &&
        car.current.x + car.current.width > obstacle.x &&
        car.current.y < obstacle.y + obstacle.height &&
        car.current.y + car.current.height > obstacle.y
      );
    });
  };

  const endGame = () => {
    setGameOver(true);
    cancelAnimationFrame(animationFrameId.current);
  };

  return (
    <GameContainer>
      <GameUI>
        <div>Puntuación: {score}</div>
        <div>Mejor Puntuación: {Math.max(score, highScore)}</div>
      </GameUI>

      <GameCanvas
        ref={canvasRef}
        width={300}
        height={500}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {!gameStarted && !gameOver && (
        <div style={{ textAlign: 'center', color: 'white', marginTop: '1rem' }}>
          <p>Toca la pantalla para comenzar</p>
          <p>Deslíza hacia los lados para esquivar</p>
        </div>
      )}

      {gameOver && (
        <div style={{ textAlign: 'center', color: 'white', marginTop: '1rem' }}>
          <h2>¡Juego Terminado!</h2>
          <p>Puntuación: {score}</p>
          <Button onClick={startGame}>Jugar de nuevo</Button>
        </div>
      )}

      <Controls>
        <Button onClick={onClose}>Cerrar</Button>
      </Controls>
    </GameContainer>
  );
};

export default RacingGame;
