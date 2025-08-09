import { useEffect, useRef, useState, useCallback } from 'react';

export default function DinoGame({ onClose }) {
  const canvasRef = useRef(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem('dinoHighScore') || 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameLoopRef = useRef();
  const dinoRef = useRef({
    x: 50,
    y: 150,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.6,
    jumpForce: -12,
    isJumping: false
  });
  const cactusRef = useRef([]);
  const cloudRef = useRef([]);
  const gameSpeedRef = useRef(5);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);

  const jump = useCallback(() => {
    const dino = dinoRef.current;
    if (!dino.isJumping) {
      dino.velocity = dino.jumpForce;
      dino.isJumping = true;
    }
  }, []);

  const resetGame = useCallback(() => {
    dinoRef.current = {
      ...dinoRef.current,
      y: 150,
      velocity: 0,
      isJumping: false
    };
    cactusRef.current = [];
    cloudRef.current = [];
    gameSpeedRef.current = 5;
    scoreRef.current = 0;
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  }, []);

  // Mobile Touch Event
  const handleTouchStart = useCallback((e) => {
    if (isGameOver) {
      resetGame();
    } else if (!isPlaying) {
      resetGame();
    } else {
      jump();
    }
  }, [isGameOver, isPlaying, jump, resetGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = 200;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Draw functions
    const drawDino = (dino) => {
      ctx.fillStyle = '#000';  // Dark color for GBA vibe
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
      
      // Draw eyes when jumping
      ctx.fillStyle = '#fff';  // White eyes
      ctx.fillRect(dino.x + 35, dino.y + 10, 5, 5);
    };
    
    const drawCactus = (cactus) => {
      ctx.fillStyle = '#228B22';  // Green cactus for GBA vibe
      ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
    };
    
    const drawCloud = (cloud) => {
      ctx.fillStyle = '#B0C4DE';  // Light gray clouds
      ctx.fillRect(cloud.x, cloud.y, 30, 10);
      ctx.fillRect(cloud.x + 5, cloud.y - 10, 20, 10);
    };
    
    const drawGround = () => {
      ctx.fillStyle = '#8B4513';  // Ground in brown
      ctx.fillRect(0, 200, canvas.width, 5);
      
      // Draw ground line
      ctx.beginPath();
      ctx.strokeStyle = '#A52A2A';  // Ground stroke with GBA red
      ctx.setLineDash([10, 10]);
      ctx.moveTo(0, 200);
      ctx.lineTo(canvas.width, 200);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    
    const drawScore = () => {
      ctx.fillStyle = '#fff';  // White text for visibility
      ctx.font = '14px Press Start 2P, sans-serif';  // GBA pixel font
      ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 10, 20);
      ctx.fillText(`High Score: ${highScore}`, 10, 40);
      
      if (!isPlaying && !isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Press Start 2P';
        ctx.textAlign = 'center';
        ctx.fillText('Tap to start', canvas.width / 2, 100);
        ctx.textAlign = 'left';
      }
      
      if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Press Start 2P';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, 90);
        ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, canvas.width / 2, 120);
        ctx.fillText('Tap to restart', canvas.width / 2, 150);
        ctx.textAlign = 'left';
      }
      
      if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Press Start 2P';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, 100);
        ctx.fillText('Tap to resume', canvas.width / 2, 130);
        ctx.textAlign = 'left';
      }
    };
    
    // Game logic
    const update = () => {
      if (isPaused || !isPlaying) return;
      
      const dino = dinoRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update dino
      dino.velocity += dino.gravity;
      dino.y += dino.velocity;
      
      // Ground collision
      if (dino.y > 150) {
        dino.y = 150;
        dino.velocity = 0;
        dino.isJumping = false;
      }
      
      // Update cacti
      if (frameCountRef.current % 100 === 0) {
        const height = 20 + Math.random() * 30;
        cactusRef.current.push({
          x: canvas.width,
          y: 200 - height,
          width: 20,
          height: height
        });
      }
      
      // Update clouds
      if (frameCountRef.current % 200 === 0) {
        cloudRef.current.push({
          x: canvas.width,
          y: 30 + Math.random() * 50,
          speed: 1 + Math.random() * 2
        });
      }
      
      // Move and draw cacti
      for (let i = cactusRef.current.length - 1; i >= 0; i--) {
        const cactus = cactusRef.current[i];
        cactus.x -= gameSpeedRef.current;
        
        // Collision detection
        if (
          dino.x < cactus.x + cactus.width &&
          dino.x + dino.width > cactus.x &&
          dino.y < cactus.y + cactus.height &&
          dino.y + dino.height > cactus.y
        ) {
          setIsGameOver(true);
          setIsPlaying(false);
          if (scoreRef.current > highScore) {
            setHighScore(Math.floor(scoreRef.current));
            localStorage.setItem('dinoHighScore', Math.floor(scoreRef.current));
          }
        }
        
        // Remove off-screen cacti
        if (cactus.x + cactus.width < 0) {
          cactusRef.current.splice(i, 1);
        } else {
          drawCactus(cactus);
        }
      }
      
      // Move and draw clouds
      for (let i = cloudRef.current.length - 1; i >= 0; i--) {
        const cloud = cloudRef.current[i];
        cloud.x -= cloud.speed;
        
        // Remove off-screen clouds
        if (cloud.x + 30 < 0) {
          cloudRef.current.splice(i, 1);
        } else {
          drawCloud(cloud);
        }
      }
      
      // Increase game speed and score
      frameCountRef.current++;
      if (frameCountRef.current % 5 === 0) {
        scoreRef.current += 0.1;
        setScore(prev => prev + 0.1);
      }
      
      if (frameCountRef.current % 500 === 0) {
        gameSpeedRef.current += 0.5;
      }
      
      // Draw everything
      drawGround();
      drawDino(dino);
      drawScore();
      
      if (!isGameOver && isPlaying) {
        gameLoopRef.current = requestAnimationFrame(update);
      }
    };
    
    // Start the game loop
    if (isPlaying && !isGameOver && !isPaused) {
      gameLoopRef.current = requestAnimationFrame(update);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, isPaused, highScore]);

  // Event listeners for touch
  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleTouchStart]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a1a',  // GBA background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '10px'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#282828',  // Dark background for GBA
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        border: '3px solid #FFD700'  // Golden border for GBA style
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 15px',
          backgroundColor: '#333',
          borderBottom: '1px solid #FFD700'
        }}>
          <div style={{ fontWeight: 'bold', color: '#FFD700', fontSize: '20px' }}>Dino Game</div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#FFD700'
            }}
            aria-label="Close game"
          >
            ×
          </button>
        </div>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '200px',
            backgroundColor: '#f7f7f7',
            cursor: 'pointer',
            borderTop: '3px solid #FFD700'
          }}
        />
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#333',
          borderTop: '1px solid #FFD700',
          fontSize: '12px',
          color: '#FFD700',
          textAlign: 'center'
        }}>
          <div>Tap anywhere to jump</div>
          <div>High Score: {highScore}</div>
        </div>
      </div>
    </div>
  );
}
