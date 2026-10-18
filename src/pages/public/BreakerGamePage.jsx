import { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, Loader2, UserCircle2, Pencil, Gamepad2, Heart, HeartOff } from 'lucide-react';
import { getBreakerLeaderboard, submitBreakerScore, checkBreakerPlayerExists } from '../../services/breakerService.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = CANVAS_HEIGHT - PADDLE_HEIGHT - 10;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 55;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 15;

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

export default function BreakerGamePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start');
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const canvasRef = useRef(null);
  
  const requestRef = useRef(null);
  const paddleXRef = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 0, dy: 0 });
  const bricksRef = useRef([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  useEffect(() => {
    const savedName = localStorage.getItem('breaker_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('breaker_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'breaker_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getBreakerLeaderboard();
    setLeaderboard(data || []);
  };

  // Mouse/Touch Control (Diperbaiki untuk Canvas Scaled)
  const handleMouseMove = (e) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const relativeX = (e.clientX - rect.left) * scaleX;
    
    paddleXRef.current = Math.max(0, Math.min(relativeX - PADDLE_WIDTH / 2, CANVAS_WIDTH - PADDLE_WIDTH));
  };

  const handleTouchMove = (e) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    e.preventDefault(); // Mencegah scroll layar saat main di HP
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const relativeX = (e.touches[0].clientX - rect.left) * scaleX;
    
    paddleXRef.current = Math.max(0, Math.min(relativeX - PADDLE_WIDTH / 2, CANVAS_WIDTH - PADDLE_WIDTH));
  };

  const initBricks = () => {
    const newBricks = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      for (let r = 0; r < BRICK_ROWS; r++) {
        newBricks.push({
          x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          status: 1,
          color: COLORS[r % COLORS.length]
        });
      }
    }
    bricksRef.current = newBricks;
  };

  const resetBall = () => {
    const baseSpeed = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5.5;
    // Kecepatan X dan Y dibagi akar 2 agar pergerakan diagonal konsisten
    const dx = (baseSpeed / Math.sqrt(2)) * (Math.random() > 0.5 ? 1 : -1);
    const dy = -baseSpeed / Math.sqrt(2);
    
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: PADDLE_Y - BALL_RADIUS - 5,
      dx: dx,
      dy: dy
    };
  };

  // ==========================================
  // GAME LOOP & PHYSICS REALISTIS
  // ==========================================
  useEffect(() => {
    if (gameState !== 'playing') {
      cancelAnimationFrame(requestRef.current);
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const ball = ballRef.current;

      // 1. Pergerakan Bola X
      ball.x += ball.dx;
      if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - BALL_RADIUS;
        ball.dx = -ball.dx;
      } else if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.dx = -ball.dx;
      }

      // 2. Pergerakan Bola Y (Atas)
      ball.y += ball.dy;
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.dy = -ball.dy;
      }

      // 3. Tabrakan Paddle
      if (ball.dy > 0 && ball.y + BALL_RADIUS >= PADDLE_Y && ball.y - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT) {
        if (ball.x + BALL_RADIUS > paddleXRef.current && ball.x - BALL_RADIUS < paddleXRef.current + PADDLE_WIDTH) {
          ball.y = PADDLE_Y - BALL_RADIUS;
          ball.dy = -Math.abs(ball.dy); // Pastikan mantul ke atas
          
          // Ubah sudut pantul berdasarkan posisi bola di paddle
          const hitPos = (ball.x - (paddleXRef.current + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          ball.dx = hitPos * speed * 0.8; 
        }
      }

      // 4. Jatuh ke Bawah (Kehilangan Nyawa)
      if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        
        if (livesRef.current <= 0) {
          finishGame();
          return;
        } else {
          resetBall();
          return requestAnimationFrame(gameLoop);
        }
      }

      // 5. Tabrakan Bata (Realistis)
      for (let i = 0; i < bricksRef.current.length; i++) {
        const b = bricksRef.current[i];
        if (b.status === 1) {
          // Deteksi Tabrakan (AABB)
          const closestX = Math.max(b.x, Math.min(ball.x, b.x + BRICK_WIDTH));
          const closestY = Math.max(b.y, Math.min(ball.y, b.y + BRICK_HEIGHT));
          const distX = ball.x - closestX;
          const distY = ball.y - closestY;
          const distSq = (distX * distX) + (distY * distY);

          if (distSq <= BALL_RADIUS * BALL_RADIUS) {
            b.status = 0;
            scoreRef.current += 10;
            setScore(scoreRef.current);

            // Tentukan sisi tabrakan untuk pantulan yang benar
            const overlapX = BALL_RADIUS - Math.abs(distX);
            const overlapY = BALL_RADIUS - Math.abs(distY);

            if (overlapX < overlapY) {
              // Tabrak kiri/kanan bata
              ball.dx = -ball.dx;
              // Dorong bola keluar dari bata
              if (ball.x < b.x) ball.x -= overlapX;
              else ball.x += overlapX;
            } else {
              // Tabrak atas/bawah bata
              ball.dy = -ball.dy;
              // Dorong bola keluar dari bata
              if (ball.y < b.y) ball.y -= overlapY;
              else ball.y += overlapY;
            }
            
            // Satu frame hanya bisa menghancurkan 1 bata agar lebih stabil
            break; 
          }
        }
      }

      // 6. Cek Menang
      const remaining = bricksRef.current.filter(br => br.status === 1).length;
      if (remaining === 0) {
        finishGame(true);
        return;
      }

      // 7. Draw
      ctx.fillStyle = '#141517';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Bricks
      bricksRef.current.forEach(b => {
        if (b.status === 1) {
          ctx.beginPath();
          ctx.rect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.closePath();
        }
      });

      // Draw Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.closePath();

      // Draw Paddle
      ctx.beginPath();
      ctx.rect(paddleXRef.current, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.closePath();

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, difficulty]);

  const finishGame = async (isWin = false) => {
    cancelAnimationFrame(requestRef.current);
    setGameState('result');
    if (scoreRef.current > 0) {
      await submitBreakerScore(playerName.trim(), scoreRef.current);
    }
    if (isWin) toast.success("Selamat! Kamu menghancurkan semua bata!");
  };

  const startGame = async (e) => {
    e.preventDefault();
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');

      setIsCheckingName(true);
      const { exists, actualName, error } = await checkBreakerPlayerExists(inputName);
      setIsCheckingName(false);

      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('breaker_player_name', inputName);
      setIsRegistered(true);
    }

    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    initBricks();
    resetBall();
    setGameState('playing');
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Block Breaker 🧱</h1>
        <p className="muted">Hancurkan semua bata dengan pantulan bola!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Gamepad2 size={56} className="text-primary" /></div>
              <h2>Siap Menghancurkan?</h2>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('breaker_player_name');
                    setPlayerName('');
                    setIsRegistered(false);
                  }}><Pencil size={14} /></button>
                </div>
              ) : (
                <div className="game-form-grid" style={{ marginTop: '16px' }}>
                  <label className="field field--wide">
                    <span>Nama Panggilan (Hanya diisi sekali)</span>
                    <input 
                      type="text" 
                      value={playerName} 
                      onChange={(e) => setPlayerName(e.target.value)} 
                      placeholder="Contoh: Ahmad" 
                      maxLength={15}
                      required={!isRegistered} 
                    />
                  </label>
                </div>
              )}

              <div className="game-form-grid" style={{ marginTop: '12px' }}>
                <label className="field field--wide">
                  <span>Kecepatan Bola</span>
                  <div className="select-wrapper">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Ez (Lambat)</option>
                      <option value="medium">Medium (Sedang)</option>
                      <option value="hard">Hard (Cepat)</option>
                    </select>
                  </div>
                </label>
              </div>

              <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: '24px', padding: '14px' }} disabled={isCheckingName}>
                {isCheckingName ? <Loader2 size={18} className="spin" /> : <Play size={18} />} 
                {isCheckingName ? 'Memeriksa Nama...' : 'Mulai Bermain'}
              </button>
            </form>
          )}

          {(gameState === 'playing' || gameState === 'result') && (
            <div className="breaker-playing">
              <div className="game-status-bar" style={{ marginBottom: '10px', width: '100%', maxWidth: '500px' }}>
                <div className="lives-container">
                  {[...Array(3)].map((_, i) => (
                    i < lives ? <Heart key={i} size={20} className="fill-danger" /> : <HeartOff key={i} size={20} className="text-muted" />
                  ))}
                </div>
                <span className="badge badge--status-published">Skor: {score}</span>
              </div>
              
              <div style={{ position: 'relative' }}>
                <canvas 
                  ref={canvasRef} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT}
                  className="breaker-canvas"
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  style={{ touchAction: 'none' }} // Mencegah scroll di HP
                />
                {gameState === 'result' && (
                  <div className="breaker-overlay">
                    <h2>{score === 0 ? 'Game Over' : 'Selesai!'}</h2>
                    <p>Skor Akhir: <strong>{score}</strong></p>
                    <button type="button" className="btn btn--primary" onClick={() => setGameState('start')}>
                      <RefreshCw size={16} /> Main Lagi
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Breaker</h3>
          </div>
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>Belum ada skor.</p>
            ) : (
              leaderboard.map((item, index) => (
                <div key={item.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                  <div className="lb-rank">{index + 1}</div>
                  <div className="lb-info">
                    <strong>{item.player_name}</strong>
                  </div>
                  <div className="lb-score">{item.score}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}