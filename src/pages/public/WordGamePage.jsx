import { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, Medal, Send, ChevronDown, HelpCircle, Eye } from 'lucide-react';
import { getWordLeaderboard, submitWordScore } from '../../services/wordService.js';
import { WORD_BANK } from '../../utils/wordList.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import GameHUD from '../../components/GameHUD.jsx'; // <-- Import GameHUD

function scrambleWord(word) {
  let scrambled = word;
  while (scrambled === word) {
    scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  }
  return scrambled;
}

export default function WordGamePage() {
  const toast = useToast();
  const { profile } = useAuth();
  const playerName = profile?.display_name || 'Player';

  const [gameState, setGameState] = useState('start');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wordsSolved, setWordsSolved] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(30); 
  
  const [currentWord, setCurrentWord] = useState({ original: '', scrambled: '', hint: '' });
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase.channel('word_leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getWordLeaderboard();
    setLeaderboard(data || []);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleWrongAnswer(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, currentWord]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) inputRef.current.focus();
  }, [gameState, currentWord]);

  useEffect(() => {
    if (gameState === 'result' && score > 0) {
      submitWordScore(playerName.trim(), score, wordsSolved).then(({ error }) => {
        if (error) toast.error("Gagal menyimpan skor.");
      });
    }
  }, [gameState]);

  const generateNewWord = () => {
    const random = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    setCurrentWord({
      original: random.word,
      scrambled: scrambleWord(random.word),
      hint: random.hint
    });
    setInputValue('');
    setShowHint(false); 
    setTimeLeft(30);
  };

  const startGame = (e) => {
    e.preventDefault();
    setLives(3);
    setScore(0);
    setWordsSolved(0);
    generateNewWord();
    setGameState('playing');
  };

  const submitAnswer = (e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    clearInterval(timerRef.current);
    const isCorrect = inputValue.trim().toUpperCase() === currentWord.original.toUpperCase();
    
    if (isCorrect) {
      const earnedPoints = 100 + (timeLeft * 5);
      setScore((prev) => prev + earnedPoints);
      setWordsSolved((prev) => prev + 1);
      toast.success("Benar! +" + earnedPoints, 1000);
      generateNewWord();
    } else {
      handleWrongAnswer();
    }
  };

  const handleWrongAnswer = () => {
    clearInterval(timerRef.current);
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameState('result');
    } else {
      toast.error(`Salah! Nyawa tersisa ${newLives}`, 1500);
      generateNewWord();
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Tebak Kata 🧩</h1>
        <p className="muted">Susun huruf acak menjadi kata yang benar.</p>
      </div>

      <div className="game-layout">
        <div className="game-area card">
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Trophy size={56} className="text-warning" /></div>
              <h2>Mode Survival</h2>
              
              <div className="player-badge">
                <span>Bermain sebagai: <strong>{playerName}</strong></span>
              </div>

              <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: '24px', padding: '14px' }}>
                <Play size={18} /> Mulai Bermain
              </button>
            </form>
          )}

          {gameState === 'playing' && (
            <div className="game-playing">
              
              {/* KOMPONEN HUD BARU */}
              <GameHUD lives={lives} score={score} timeLeft={timeLeft} maxTime={30} />

              <div className="word-display">
                {(() => {
                  const firstChar = currentWord.original.charAt(0);
                  const index = currentWord.scrambled.indexOf(firstChar);
                  if (index === -1) return currentWord.scrambled;
                  return (
                    <>
                      {currentWord.scrambled.slice(0, index)}
                      <span className="word-display__highlight">{currentWord.scrambled.charAt(index)}</span>
                      {currentWord.scrambled.slice(index + 1)}
                    </>
                  );
                })()}
              </div>
              
              <div className="word-hint-container">
                {!showHint ? (
                  <button type="button" className="btn btn--ghost btn-hint" onClick={() => setShowHint(true)}>
                    <Eye size={16} /> Lihat Petunjuk
                  </button>
                ) : (
                  <div className="word-hint animate-in">
                    <HelpCircle size={16} /> Petunjuk: {currentWord.hint}
                  </div>
                )}
              </div>

              <form onSubmit={submitAnswer} className="game-input-group" style={{ marginTop: '24px' }}>
                <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="game-input-field" placeholder="Ketik jawaban..." autoComplete="off" required />
                <button type="submit" className="game-submit-btn">
                  <Send size={18} /> <span style={{ marginLeft: '8px' }}>Kirim</span>
                </button>
              </form>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large"><Medal size={72} className="text-warning" /></div>
              <h2>Nyawa Habis!</h2>
              <div className="game-final-score">
                <span>Skor Akhir</span>
                <strong>{score}</strong>
              </div>
              <p className="muted">Kamu berhasil menyusun <strong>{wordsSolved}</strong> kata.</p>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setGameState('start')} style={{ marginTop: '24px' }}>
                <RefreshCw size={16} /> Main Lagi
              </button>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Tebak Kata</h3>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((item, index) => (
              <div key={item.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                <div className="lb-rank">{index + 1}</div>
                <div className="lb-info">
                  <strong>{item.player_name}</strong>
                  <span>{item.words_solved} kata benar</span>
                </div>
                <div className="lb-score">{item.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}