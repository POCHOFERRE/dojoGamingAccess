import { useEffect, useRef, useCallback, useState } from 'react';
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight, FaUndo, FaPlay, FaPause } from 'react-icons/fa';
import styled from 'styled-components';

// === Constantes ===
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;  // ms
const MIN_SPEED = 80;       // ms
const SPEED_DECREASE = 5;   // ms por comida
const TOUCH_THRESHOLD = 30; // px swipe

const DIRECTIONS = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1  },
  LEFT:  { x: -1, y: 0  },
  RIGHT: { x: 1,  y: 0  },
};

// === Estilos ===
const GameContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 8px;
  touch-action: none;
  font-family: 'Press Start 2P', monospace;
  background-color: #1d1f21; /* Fondo estilo GBA */
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(0,0,0,.25);
`;

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: auto;
  background: #0f1422; /* pantalla estilo GBA */
  border: 4px solid #1a1c2c;
  border-radius: 10px;
  box-shadow: 4px 4px 0 #131620, inset 0 0 24px rgba(0,0,0,.4);
`;

const Overlay = styled.div`
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: rgba(0,0,0,.78);
  color: #fff; border-radius: 10px; text-align: center; padding: 20px;
  z-index: 5;
  h2 { margin-bottom: 10px; }
  p { opacity: .9; margin: 4px 0; font-size: 12px; }
`;

const PixelButton = styled.button`
  background: #b13e53; color: #fff;
  border: 3px solid #1a1c2c; border-radius: 10px;
  padding: 10px 16px; margin-top: 12px;
  font-family: 'Press Start 2P', monospace; font-size: 12px;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 4px 4px 0 #131620; cursor: pointer;
  transition: transform .08s, box-shadow .08s, filter .08s;
  &:hover { filter: brightness(1.06); }
  &:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 #131620; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

const ScoreDisplay = styled.div`
  position: absolute; top: 10px; left: 0; right: 0;
  display: flex; justify-content: space-around;
  font-size: 12px; color: #ffcd75; text-shadow: 0 2px 0 #131620;
  z-index: 2;
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: 50px 50px 50px;
  grid-template-rows: 50px 50px 50px;
  gap: 6px; width: 162px; margin: 14px auto 0;

  button {
    background: #5d275d; color: #ffcd75;
    border: 3px solid #1a1c2c; border-radius: 10px;
    display: grid; place-items: center; font-size: 18px;
    box-shadow: 3px 3px 0 #131620; cursor: pointer;
    transition: transform .08s, box-shadow .08s, filter .08s;
    &:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 #131620; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  }
`;

const Hint = styled.div`
  margin-top: 10px; text-align: center; font-size: 10px;
  color: #e1e1e1; opacity: .8;
`;

// === Componente ===
const SnakeGame = () => {
  const canvasRef = useRef(null);
  const rafIdRef = useRef(0);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snakeHighScore') || '0', 10));
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 10 },
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    speed: INITIAL_SPEED,
    lastUpdate: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    cellSize: 0,
  });

  // --- Dibujo ---
  const drawGame = useCallback((ctx, s, w, h) => {
    const cs = s.cellSize;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1a2c38'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * cs + .5, 0); ctx.lineTo(i * cs + .5, GRID_SIZE * cs); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cs + .5); ctx.lineTo(GRID_SIZE * cs, i * cs + .5); ctx.stroke();
    }

    // Snake
    s.snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * cs, y = seg.y * cs;
      const g = ctx.createLinearGradient(x, y, x + cs, y + cs);
      g.addColorStop(0, isHead ? '#4CAF50' : '#2E7D32');
      g.addColorStop(1, isHead ? '#81C784' : '#4CAF50');
      ctx.fillStyle = g; ctx.fillRect(x, y, cs, cs);
      ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, cs - 1, cs - 1);

      if (isHead) {
        const eye = cs * 0.2, off = cs * 0.25;
        const ex = x + (s.direction.x === 1 ? cs - off * 1.5 : off);
        const ey = y + (s.direction.y === 1 ? cs - off * 1.5 : off);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, eye, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ex, ey, eye * .5, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Food
    const fx = s.food.x * cs, fy = s.food.y * cs;
    const fg = ctx.createRadialGradient(fx + cs * .5, fy + cs * .5, 0, fx + cs * .5, fy + cs * .5, cs * .7);
    fg.addColorStop(0, '#FF5252'); fg.addColorStop(1, '#D32F2F');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(fx + cs * .5, fy + cs * .5, cs * .4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.arc(fx + cs * .3, fy + cs * .3, cs * .15, 0, Math.PI * 2); ctx.fill();
  }, []);

  // --- Canvas + DPR ---
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 16, 500);
    const cellSize = Math.floor(size / GRID_SIZE);
    const cssW = cellSize * GRID_SIZE;
    const cssH = cellSize * GRID_SIZE;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    setCanvasSize({ width: cssW, height: cssH });
    stateRef.current.cellSize = cellSize;

    drawGame(ctx, stateRef.current, cssW, cssH);
  }, [drawGame]);

  useEffect(() => {
    updateCanvasSize();
    setShowMobileControls(window.innerWidth <= 768);
    const onResize = () => {
      updateCanvasSize();
      setShowMobileControls(window.innerWidth <= 768);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateCanvasSize]);

  // --- Juego ---
  const generateFood = useCallback((snake) => {
    let food;
    do {
      food = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
    return food;
  }, []);

  const initGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    const s = stateRef.current;
    s.snake = initialSnake;
    s.food = generateFood(initialSnake);
    s.direction = DIRECTIONS.RIGHT;
    s.nextDirection = DIRECTIONS.RIGHT;
    s.speed = INITIAL_SPEED;
    s.lastUpdate = 0;

    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
  }, [generateFood]);

  const gameLoop = useCallback((ts) => {
    const s = stateRef.current;
    if (!gameStarted || isPaused || gameOver) return;

    if (s.lastUpdate === 0) s.lastUpdate = ts;
    if (ts - s.lastUpdate >= s.speed) {
      s.lastUpdate = ts;

      // Dirección
      s.direction = { ...s.nextDirection };

      // Nueva cabeza
      const head = { x: s.snake[0].x + s.direction.x, y: s.snake[0].y + s.direction.y };

      // Colisiones
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('snakeHighScore', String(score));
        }
        return;
      }

      // Avanzar
      const newSnake = [head, ...s.snake];

      // ¿Comió?
      if (head.x === s.food.x && head.y === s.food.y) {
        const nextScore = score + 10;
        setScore(nextScore);
        if (s.speed > MIN_SPEED) s.speed = Math.max(MIN_SPEED, s.speed - SPEED_DECREASE);
        s.food = generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      s.snake = newSnake;

      // Dibujo
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawGame(ctx, s, canvasSize.width, canvasSize.height);
      }
    }

    rafIdRef.current = requestAnimationFrame(gameLoop);
  }, [canvasSize.width, canvasSize.height, gameOver, gameStarted, isPaused, score, highScore, generateFood, drawGame]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      rafIdRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(rafIdRef.current);
    }
    return () => {};
  }, [gameStarted, gameOver, isPaused, gameLoop]);

  // --- Input teclado ---
  const handleKeyDown = useCallback((e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();

    if (!gameStarted) {
      if (e.code === 'Space') initGame();
      return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
      setIsPaused(v => !v);
      return;
    }

    const s = stateRef.current;
    if (e.key === 'ArrowUp'    && s.direction !== DIRECTIONS.DOWN)  s.nextDirection = DIRECTIONS.UP;
    if (e.key === 'ArrowDown'  && s.direction !== DIRECTIONS.UP)    s.nextDirection = DIRECTIONS.DOWN;
    if (e.key === 'ArrowLeft'  && s.direction !== DIRECTIONS.RIGHT) s.nextDirection = DIRECTIONS.LEFT;
    if (e.key === 'ArrowRight' && s.direction !== DIRECTIONS.LEFT)  s.nextDirection = DIRECTIONS.RIGHT;
  }, [gameStarted, initGame]);

  // --- Touch ---
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]; const s = stateRef.current;
    s.touchStartX = t.clientX; s.touchStartY = t.clientY; s.touchStartTime = Date.now();
  }, []);

  const onTouchMove = useCallback((e) => {
    if (gameStarted && !gameOver) e.preventDefault();
  }, [gameStarted, gameOver]);

  const onTouchEnd = useCallback((e) => {
    const t = e.changedTouches[0]; const s = stateRef.current;
    const dx = t.clientX - s.touchStartX, dy = t.clientY - s.touchStartY;
    const dist = Math.hypot(dx, dy), dt = Date.now() - s.touchStartTime;

    if (dt < 300 && dist < 10) { setIsPaused(v => !v); return; }
    if (dist < TOUCH_THRESHOLD) return;

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle > -45 && angle <= 45)        { if (s.direction !== DIRECTIONS.LEFT)  s.nextDirection = DIRECTIONS.RIGHT; }
    else if (angle > 45 && angle <= 135)   { if (s.direction !== DIRECTIONS.UP)    s.nextDirection = DIRECTIONS.DOWN; }
    else if (angle > 135 || angle <= -135) { if (s.direction !== DIRECTIONS.RIGHT) s.nextDirection = DIRECTIONS.LEFT; }
    else                                   { if (s.direction !== DIRECTIONS.DOWN)  s.nextDirection = DIRECTIONS.UP; }
  }, []);

  useEffect(() => {
    const keyHandler = (e) => handleKeyDown(e);
    window.addEventListener('keydown', keyHandler);
    const c = canvasRef.current;
    if (c) {
      c.addEventListener('touchstart', onTouchStart, { passive: true });
      c.addEventListener('touchmove', onTouchMove, { passive: false });
      c.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    return () => {
      window.removeEventListener('keydown', keyHandler);
      if (c) {
        c.removeEventListener('touchstart', onTouchStart);
        c.removeEventListener('touchmove', onTouchMove);
        c.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [handleKeyDown, onTouchStart, onTouchMove, onTouchEnd]);

  return (
    <GameContainer>
      <ScoreDisplay>
        <div>Puntos: {score}</div>
        <div>Mejor: {highScore}</div>
      </ScoreDisplay>

      <Canvas ref={canvasRef} />

      {!gameStarted && (
        <Overlay>
          <h2>Snake</h2>
          <p>Flechas / deslizar para moverte</p>
          <p>Barra espaciadora o P = Pausa</p>
          <PixelButton onClick={initGame}><FaPlay /> Jugar</PixelButton>
        </Overlay>
      )}

      {gameOver && (
        <Overlay>
          <h2>¡Juego terminado!</h2>
          <p>Puntuación: {score}</p>
          <p>Mejor: {highScore}</p>
          <PixelButton onClick={initGame}><FaUndo /> Reintentar</PixelButton>
        </Overlay>
      )}

      {isPaused && gameStarted && !gameOver && (
        <Overlay>
          <h2>Pausa</h2>
          <PixelButton onClick={() => setIsPaused(false)}><FaPlay /> Continuar</PixelButton>
        </Overlay>
      )}

      {showMobileControls && gameStarted && !isPaused && !gameOver && (
        <>
          <Controls>
            <div />
            <button onClick={() => { const s = stateRef.current; if (s.direction !== DIRECTIONS.DOWN)  s.nextDirection = DIRECTIONS.UP; }} aria-label="Arriba"><FaArrowUp /></button>
            <div />
            <button onClick={() => { const s = stateRef.current; if (s.direction !== DIRECTIONS.RIGHT) s.nextDirection = DIRECTIONS.LEFT; }} aria-label="Izquierda"><FaArrowLeft /></button>
            <button onClick={() => setIsPaused(true)} aria-label="Pausa"><FaPause /></button>
            <button onClick={() => { const s = stateRef.current; if (s.direction !== DIRECTIONS.LEFT)  s.nextDirection = DIRECTIONS.RIGHT; }} aria-label="Derecha"><FaArrowRight /></button>
            <div />
            <button onClick={() => { const s = stateRef.current; if (s.direction !== DIRECTIONS.UP)    s.nextDirection = DIRECTIONS.DOWN; }} aria-label="Abajo"><FaArrowDown /></button>
            <div />
          </Controls>
          <Hint>P para pausar • Come los puntos rojos</Hint>
        </>
      )}
    </GameContainer>
  );
};

export default SnakeGame;
