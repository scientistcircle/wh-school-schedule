import { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, Medal, Loader2, UserCircle2, Pencil, Timer, Circle, ArrowDownRight, Triangle, Square, ChevronDown, Heart, HeartOff } from 'lucide-react';
import { getMemoryLeaderboard, submitMemoryScore, checkMemoryPlayerExists } from '../../services/memoryService.js';
import { MEMORY_ITEMS } from '../../utils/memoryCards.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

const LEVEL_CONFIG = {
  easy:   { pairs: 6,  cols: 4, previewTime: 60, playTime: 60, lives: 3 }, // Preview 1 mnt, Main 1 mnt
  medium: { pairs: 8,  cols: 4, previewTime: 120, playTime: 180, lives: 3 }, // Preview 2 mnt, Main 3 mnt
  hard:   { pairs: 10, cols: 5, previewTime: 180, playTime: 300, lives: 3 }  // Preview 3 mnt, Main 5 mnt
};

// Fungsi format waktu MM:SS
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const generateDeck = (difficulty) => {
  const pairCount = LEVEL_CONFIG[difficulty].pairs;
  const selectedItems = MEMORY_ITEMS.slice(0, pairCount);
  const doubled = [...selectedItems, ...selectedItems].map((item, index) => ({
    ...item,
    uniqueId: index,
    isFlipped: true, // <-- Awalnya terbuka untuk dihafal (Preview)
    isMatched: false
  }));
  return shuffleArray(doubled);
};

export default function MemoryGamePage() {
  const toast = useToast();
  // state: 'start', 'preview', 'playing', 'result'
  const [gameState, setGameState] = useState('start');
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  
  const [lives, setLives] = useState(3);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('memory_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('memory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memory_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getMemoryLeaderboard();
    setLeaderboard(data || []);
  };

  // TIMER TICK
  useEffect(() => {
    if (gameState !== 'preview' && gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // HANDLE TIMER HABIS
  useEffect(() => {
    if (timeLeft > 0) return;
    
    if (gameState === 'preview') {
      // Fase Preview habis, mulai bermain
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setTimeLeft(LEVEL_CONFIG[difficulty].playTime);
      setGameState('playing');
    } else if (gameState === 'playing') {
      // Waktu bermain habis, Game Over
      finishGame(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameState]);

  // SIMPAN SKOR
  useEffect(() => {
    if (gameState === 'result' && score > 0) {
      submitMemoryScore(playerName.trim(), score, moves).then(({ error }) => {
        if (error) toast.error("Gagal menyimpan skor.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startGame = async (e) => {
    e.preventDefault();
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');

      setIsCheckingName(true);
      const { exists, actualName, error } = await checkMemoryPlayerExists(inputName);
      setIsCheckingName(false);

      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('memory_player_name', inputName);
      setIsRegistered(true);
    }

    setCards(generateDeck(difficulty));
    setFlippedIndices([]);
    setLives(LEVEL_CONFIG[difficulty].lives);
    setMoves(0);
    setMatchedPairs(0);
    setScore(0);
    setTimeLeft(LEVEL_CONFIG[difficulty].previewTime);
    setGameState('preview'); // Mulai di fase hafalan
  };

  const handleCardClick = (index) => {
    if (gameState !== 'playing') return; // Tidak bisa diklik saat preview
    if (isChecking || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);
      
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].id === cards[secondIdx].id) {
        // COCOK
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setIsChecking(false);
          
          const newMatchedCount = matchedPairs + 1;
          setMatchedPairs(newMatchedCount);
          
          if (newMatchedCount === LEVEL_CONFIG[difficulty].pairs) {
            finishGame(true);
          }
        }, 500);
      } else {
        // TIDAK COCOK
        const newLives = lives - 1;
        setLives(newLives);
        
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsChecking(false);
          
          if (newLives <= 0) {
            finishGame(false);
          }
        }, 1000);
      }
    }
  };

  const finishGame = (isWin) => {
    if (gameState === 'result') return;
    clearInterval(timerRef.current);
    
    let finalScore = 0;
    const multiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;

    if (isWin) {
      const baseScore = (timeLeft * 10) - (moves * 5) + 500;
      finalScore = Math.round(Math.max(0, baseScore) * multiplier);
    } else {
      const baseScore = (matchedPairs * 50) - (moves * 5);
      finalScore = Math.round(Math.max(0, baseScore) * multiplier);
    }
    
    setScore(finalScore);
    setGameState('result');
  };

  const renderCardContent = (card) => {
    if (card.type === 'text') {
      return <span className="memory-text">{card.content}</span>;
    }
    
    if (card.content === 'circle') return <Circle size={48} strokeWidth={3} />;
    if (card.content === 'arrow-down-right') return <ArrowDownRight size={48} strokeWidth={3} />;
    if (card.content === 'triangle') return <Triangle size={48} strokeWidth={3} />;
    if (card.content === 'parallelogram') return <Square size={48} strokeWidth={3} style={{ transform: 'skewX(-15deg)' }} />;
    if (card.content === 'square') return <Square size={48} strokeWidth={3} />;
    return null;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Memori Match 🧠</h1>
        <p className="muted">Hafalkan posisi kartu, lalu temukan pasangannya!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Trophy size={56} className="text-primary" /></div>
              <h2>Uji Ingatanmu</h2>
              <p className="muted" style={{ marginBottom: '20px' }}>
                Kartu akan dibuka untuk dihafal, lalu ditutup. Kamu punya 3 Nyawa!
              </p>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('memory_player_name');
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
                  <span>Level Kesulitan</span>
                  <div className="select-wrapper">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Ez (Hafal 1m, Main 1m)</option>
                      <option value="medium">Medium (Hafal 2m, Main 3m)</option>
                      <option value="hard">Hard (Hafal 3m, Main 5m)</option>
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

          {(gameState === 'preview' || gameState === 'playing') && (
            <div className="memory-playing">
              {/* Header Preview / Status Bar */}
              {gameState === 'preview' ? (
                <div style={{ textAlign: 'center', marginBottom: '16px', background: 'var(--warning-soft)', padding: '12px', borderRadius: 'var(--radius-md)', width: '100%' }}>
                  <h2 style={{ color: 'var(--warning)', margin: '0 0 4px 0', fontSize: 'var(--fs-lg)' }}>Hafalkan Posisi Kartu!</h2>
                  <p style={{ color: 'var(--warning)', margin: 0, fontWeight: 'bold' }}>Sisa Waktu: {formatTime(timeLeft)}</p>
                </div>
              ) : (
                <div className="game-status-bar" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: '550px' }}>
                  <div className="lives-container">
                    {[...Array(3)].map((_, i) => (
                      i < lives ? <Heart key={i} size={20} className="fill-danger" /> : <HeartOff key={i} size={20} className="text-muted" />
                    ))}
                  </div>
                  <span className={`badge ${timeLeft <= 10 ? 'badge--danger' : 'badge--status-published'}`}>
                    <Timer size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> 
                    {formatTime(timeLeft)}
                  </span>
                  <span className="badge badge--imp-normal">Langkah: {moves}</span>
                </div>
              )}
              
              <div 
                className="memory-grid" 
                style={{ 
                  gridTemplateColumns: `repeat(${LEVEL_CONFIG[difficulty].cols}, 1fr)`,
                  pointerEvents: gameState === 'preview' ? 'none' : 'auto' // Cegah klik saat preview
                }}
              >
                {cards.map((card, index) => (
                  <div 
                    key={card.uniqueId} 
                    className={`memory-card ${card.isFlipped || card.isMatched ? 'is-flipped' : ''} ${card.isMatched ? 'is-matched' : ''}`}
                    onClick={() => handleCardClick(index)}
                  >
                    <div className="memory-card-inner">
                      <div className="memory-card-front">
                        <span className="memory-q">?</span>
                      </div>
                      <div className="memory-card-back">
                        {renderCardContent(card)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large">
                <Medal size={72} className="text-primary" />
              </div>
              <h2>{matchedPairs === LEVEL_CONFIG[difficulty].pairs ? 'Selamat, Kamu Menang!' : 'Game Over!'}</h2>
              <div className="game-final-score">
                <span>Skor Kamu</span>
                <strong>{score}</strong>
              </div>
              <p className="muted">
                Kamu menyelesaikan <strong>{matchedPairs}</strong> pasang dalam <strong>{moves}</strong> langkah.
                {matchedPairs !== LEVEL_CONFIG[difficulty].pairs && ' (Waktu/Nyawa habis)'}
              </p>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setGameState('start')} style={{ marginTop: '24px' }}>
                <RefreshCw size={16} /> Main Lagi
              </button>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Memori</h3>
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
                    <span>{item.moves} langkah</span>
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