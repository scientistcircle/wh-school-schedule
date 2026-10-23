import { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, Medal, Loader2, UserCircle2, Pencil } from 'lucide-react';
import { getSnakeBlockadeLeaderboard, submitSnakeBlockadeScore, checkSnakeBlockadePlayerExists } from '../../services/snakeBlockadeService.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

// Pengaturan Canvas
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 20;

export default function SnakeBlockadePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'result'
  const [showTutorial, setShowTutorial] = useState(false);
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // State Game (disimpan di useRef agar tidak memicu re-render saat loop)
  const snakeRef = useRef([]);
  const dirRef = useRef({ x: 0, y: -1 });
  const blocksRef = useRef([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(100); // Kecepatan pergerakan (ms)

  useEffect(() => {
    const savedName = localStorage.getItem('snake_blockade_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('snake_blockade_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snake_blockade_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getSnakeBlockadeLeaderboard();
    setLeaderboard(data || []);
  };

  // Kontrol Mouse / Touch
  const handleMouseMove = (e) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Ular mengikuti kursor (hanya sumbu X)
    const head = snakeRef.current[0];
    if (mouseX > head.x * CELL_SIZE + CELL_SIZE) dirRef.current = { x: 1, y: 0 };
    else if (mouseX < head.x * CELL_SIZE) dirRef.current = { x: -1, y: 0 };
    else dirRef.current = { x: 0, y: -1 }; // Default ke atas
  };

  const handleTouchMove = (e) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    const head = snakeRef.current[0];
    if (touchX > head.x * CELL_SIZE + CELL_SIZE) dirRef.current = { x: 1, y: 0 };
    else if (touchX < head.x * CELL_SIZE) dirRef.current = { x: -1, y: 0 };
    else dirRef.current = { x: 0, y: -1 };
  };

  // Logika Utama Game Loop
  const gameLoop = () => {
    if (gameState !== 'playing') return;
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // 1. Pergerakan Ular
    const head = { x: snakeRef.current[0].x + dirRef.current.x, y: snakeRef.current[0].y + dirRef.current.y };
    
    // Cek Tabrakan Dinding
    if (head.x < 0 || head.x >= CANVAS_WIDTH / CELL_SIZE || head.y < 0) {
      gameOver();
      return;
    }

    snakeRef.current.unshift(head);

    // 2. Cek Tabrakan dengan Blok
    let blockHitIndex = -1;
    blocksRef.current.forEach((block, index) => {
      if (block.active && head.x === block.x && head.y === block.y) {
        blockHitIndex = index;
      }
    });

    if (blockHitIndex !== -1) {
      const block = blocksRef.current[blockHitIndex];
      if (snakeRef.current.length > block.value) {
        // Ular cukup panjang, hancurkan blok
        snakeRef.current.splice(snakeRef.current.length - block.value, block.value); // Potong ekor
        block.active = false;
        scoreRef.current += 10;
        setScore(scoreRef.current);
      } else {
        // Ular terlalu pendek, mati
        gameOver();
        return;
      }
    } else {
      // Jika tidak memakan blok, potong ekor (ular bergerak normal)
      snakeRef.current.pop();
    }

    // 3. Buat Blok Baru di Atas
    if (blocksRef.current.filter(b => b.active).length < 5) {
      spawnBlock();
    }

    // 4. Gambar Ulang Canvas
    drawGame(ctx);
    
    // Kecepatan bertambah seiring waktu
    if (scoreRef.current % 50 === 0 && scoreRef.current > 0) {
      speedRef.current = Math.max(40, speedRef.current - 5);
    }

    requestRef.current = setTimeout(() => {
      gameLoop();
    }, speedRef.current);
  };

  const spawnBlock = () => {
    // Blok muncul dari atas (y = -1) secara acak
    const randomX = Math.floor(Math.random() * (CANVAS_WIDTH / CELL_SIZE));
    const randomValue = Math.floor(Math.random() * 10) + 1; // Nilai 1-10
    const colors = ['#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fbbf24'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    blocksRef.current.push({
      x: randomX,
      y: -1,
      value: randomValue,
      color: randomColor,
      active: true
    });
  };

  const drawGame = (ctx) => {
    ctx.fillStyle = '#141517';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Gambar Blok
    blocksRef.current.forEach(block => {
      if (block.active) {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x * CELL_SIZE + 1, block.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(block.value, block.x * CELL_SIZE + CELL_SIZE / 2, block.y * CELL_SIZE + CELL_SIZE / 2 + 4);
        
        // Blok turun perlahan
        block.y += 0.5; 
        if (block.y > CANVAS_HEIGHT / CELL_SIZE) block.active = false;
      }
    });

    // Gambar Ular
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#fbbf24' : '#f59e0b'; // Kepala kuning terang
      ctx.beginPath();
      ctx.arc(segment.x * CELL_SIZE + CELL_SIZE / 2, segment.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const gameOver = () => {
    cancelAnimationFrame(requestRef.current);
    setGameState('result');
    if (scoreRef.current > 0) {
      submitSnakeBlockadeScore(playerName.trim(), scoreRef.current).then(({ error }) => {
        if (error) toast.error("Gagal menyimpan skor.");
      });
    }
  };

  const startGame = async (e) => {
    e.preventDefault();
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');
      
      setIsCheckingName(true);
      const { exists, actualName, error } = await checkSnakeBlockadePlayerExists(inputName);
      setIsCheckingName(false);
      
      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('snake_blockade_player_name', inputName);
      setIsRegistered(true);
    }

    // Reset Game
    snakeRef.current = [{ x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }]; // Ular awal panjang 3
    dirRef.current = { x: 0, y: -1 }; // Mulai ke atas
    scoreRef.current = 0;
    setScore(0);
    speedRef.current = 100;
    blocksRef.current = [];
    
    // Spawn blok awal
    for(let i=0; i<3; i++) spawnBlock();

    setGameState('playing');
    requestRef.current = setTimeout(() => { gameLoop(); }, speedRef.current);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Snake Blockade 🟡</h1>
        <p className="muted">Kumpulkan poin, jangan sampai menabrak blok besar!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Trophy size={56} className="text-warning" /></div>
              <h2>Snake Blockade</h2>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('snake_blockade_player_name');
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

              <button type="button" className="btn btn--ghost btn--block" style={{ marginTop: '12px' }} onClick={() => setShowTutorial(true)}>
                Cara Bermain
              </button>

              <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: '12px', padding: '14px' }} disabled={isCheckingName}>
                {isCheckingName ? <Loader2 size={18} className="spin" /> : <Play size={18} />} 
                {isCheckingName ? 'Memeriksa Nama...' : 'Mulai Bermain'}
              </button>
            </form>
          )}

          {(gameState === 'playing' || gameState === 'result') && (
            <div className="snake-playing" style={{ position: 'relative' }}>
              <div className="game-status-bar" style={{ marginBottom: '10px' }}>
                <span className="badge badge--status-published">Skor: {score}</span>
              </div>
              
              <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="snake-canvas"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                style={{ touchAction: 'none', borderRadius: '8px', border: '2px solid #333' }}
              />
              
              {gameState === 'result' && (
                <div className="breaker-overlay" style={{ borderRadius: '8px' }}>
                  <Medal size={64} className="text-warning" />
                  <h2>Game Over!</h2>
                  <div className="game-final-score">
                    <span>Skor Akhir</span>
                    <strong>{score}</strong>
                  </div>
                  <button type="button" className="btn btn--primary" onClick={() => setGameState('start')}>
                    <RefreshCw size={16} /> Main Lagi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Blockade</h3>
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

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="ig-modal-overlay" onClick={() => setShowTutorial(false)}>
          <div className="ig-modal-content" style={{ background: '#000', color: '#fff', border: '4px solid #fff', maxWidth: '350px' }}>
            <div className="ig-modal-header" style={{ borderBottom: 'none', padding: '20px' }}>
              <h2 style={{ fontSize: '24px', letterSpacing: '4px', fontWeight: '400', margin: '0 0 20px 0' }}>TUTORIAL</h2>
              
              <div style={{ border: '2px solid #fff', borderRadius: '8px', padding: '20px', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>
                <p style={{ margin: '0 0 16px 0' }}>Gerakkan mouse Anda<br/>untuk mengarahkan ular.</p>
                <p style={{ margin: '0 0 16px 0' }}>Kumpulkan poin<br/>untuk memanjangkan ular.</p>
                <p style={{ margin: '0 0 16px 0' }}>Kumpulkan bintang untuk membuka skin baru.</p>
                <p style={{ margin: 0 }}>Hindari blok dengan angka besar.</p>
              </div>
            </div>
            
            <button 
              className="ig-modal-btn" 
              onClick={() => setShowTutorial(false)}
              style={{ border: '2px solid #fff', margin: '10px auto', borderRadius: '4px', width: '80px', padding: '10px' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}