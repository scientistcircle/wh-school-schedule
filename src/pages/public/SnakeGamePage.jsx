import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, RefreshCw, Medal, Loader2, UserCircle2, Pencil, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { getSnakeLeaderboard, submitSnakeScore, checkSnakePlayerExists } from '../../services/snakeService.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

const GRID_SIZE = 20;
const CELL_SIZE = 20; 
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; 

const SPEED_MAP = {
  easy: 200,
  medium: 120,
  hard: 70
};

export default function SnakeGamePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start');
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const canvasRef = useRef(null);
  
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const dirRef = useRef({ x: 0, y: -1 });
  const foodRef = useRef({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const gameLoopRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('snake_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('snake_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snake_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getSnakeLeaderboard();
    setLeaderboard(data || []);
    if (data && data.length > 0) setHighScore(data[0].score);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      
      const keysToPrevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
      if (keysToPrevent.includes(e.key)) {
        e.preventDefault();
      }
      
      const { x, y } = dirRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && y === 0) dirRef.current = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's') && y === 0) dirRef.current = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a') && x === 0) dirRef.current = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && x === 0) dirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#141517'; 
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#ef4444'; 
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * CELL_SIZE + CELL_SIZE / 2,
      foodRef.current.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2, 0, 2 * Math.PI
    );
    ctx.fill();

    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#3b82f6' : '#60a5fa'; 
      ctx.fillRect(
        segment.x * CELL_SIZE + 1, 
        segment.y * CELL_SIZE + 1, 
        CELL_SIZE - 2, 
        CELL_SIZE - 2
      );
    });
  };

  const spawnFood = () => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = snakeRef.current.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    foodRef.current = newFood;
  };

  const gameOver = useCallback(() => {
    clearInterval(gameLoopRef.current);
    setGameState('result');
    setScore(scoreRef.current);
    
    if (scoreRef.current > 0) {
      submitSnakeScore(playerName.trim(), scoreRef.current).then(({ error }) => {
        if (error) toast.error("Gagal menyimpan skor.");
      });
    }
  }, [playerName, toast]);

  const gameStep = useCallback(() => {
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    
    head.x += dirRef.current.x;
    head.y += dirRef.current.y;

    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      spawnFood();
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    drawGame();
  }, [gameOver]);

  const startGame = async (e) => {
    e.preventDefault();
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');
      
      setIsCheckingName(true);
      const { exists, actualName, error } = await checkSnakePlayerExists(inputName);
      setIsCheckingName(false);
      
      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('snake_player_name', inputName);
      setIsRegistered(true);
    }

    snakeRef.current = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    dirRef.current = { x: 0, y: -1 };
    scoreRef.current = 0;
    setScore(0);
    spawnFood();
    setGameState('playing');
    
    clearInterval(gameLoopRef.current);
    const speed = SPEED_MAP[difficulty];
    gameLoopRef.current = setInterval(gameStep, speed);
  };

  useEffect(() => {
    return () => clearInterval(gameLoopRef.current);
  }, []);

  const changeDir = (x, y) => {
    const current = dirRef.current;
    if (current.x === -x && current.y === -y) return; 
    if (current.x !== 0 && x !== 0) return;
    if (current.y !== 0 && y !== 0) return;
    dirRef.current = { x, y };
  };

  return (
    <div className="game-container">
      {/* HEADER SIMPLE */}
      <div className="game-header" style={{ marginBottom: '24px' }}>
        <h1 className="game-title">Snake Classic 🐍</h1>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Trophy size={56} className="text-success" style={{ color: 'var(--success)' }} /></div>
              <h2>Snake Classic</h2>
              <p className="muted" style={{ marginBottom: '20px' }}>
                Skor Tertinggi: <strong>{highScore}</strong>
              </p>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('snake_player_name');
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
                  <span>Level Kecepatan</span>
                  <div className="select-wrapper">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Ez (Lambat)</option>
                      <option value="medium">Medium (Sedang)</option>
                      <option value="hard">Hard (Cepat)</option>
                    </select>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                </label>
              </div>

              <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: '24px', padding: '14px' }} disabled={isCheckingName}>
                {isCheckingName ? <Loader2 size={18} className="spin" /> : <Play size={18} />} 
                {isCheckingName ? 'Memeriksa Nama...' : 'Mulai Bermain'}
              </button>
            </form>
          )}

          {gameState === 'playing' && (
            <div className="snake-playing">
              
              {/* SKOR BADGE (KEMBALI SEPERTI AWAL) */}
              <div className="game-status-bar" style={{ marginBottom: '10px' }}>
                <span className="badge badge--status-published">Skor: {score}</span>
              </div>
              
              <canvas 
                ref={canvasRef} 
                width={CANVAS_SIZE} 
                height={CANVAS_SIZE}
                className="snake-canvas"
              />

              <div className="snake-dpad">
                <button type="button" onClick={() => changeDir(0, -1)}><ArrowUp size={24}/></button>
                <div className="snake-dpad-row">
                  <button type="button" onClick={() => changeDir(-1, 0)}><ArrowLeft size={24}/></button>
                  <button type="button" onClick={() => changeDir(0, 1)}><ArrowDown size={24}/></button>
                  <button type="button" onClick={() => changeDir(1, 0)}><ArrowRight size={24}/></button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large"><Medal size={72} className="text-primary" /></div>
              <h2>Game Over!</h2>
              <div className="game-final-score">
                <span>Skor Kamu</span>
                <strong>{score}</strong>
              </div>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setGameState('start')} style={{ marginTop: '24px' }}>
                <RefreshCw size={16} /> Main Lagi
              </button>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Snake</h3>
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