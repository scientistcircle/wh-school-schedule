import { useState, useEffect, useRef } from 'react';
import { Trophy, Timer, Play, RefreshCw, Medal, Send, Heart, HeartOff, Loader2, UserCircle2, Pencil, HelpCircle, Eye } from 'lucide-react';
import { getWordLeaderboard, submitWordScore, checkWordPlayerExists } from '../../services/wordService.js';
import { WORD_BANK } from '../../utils/wordList.js'; // <-- IMPORT DARI FILE BARU
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

// Fungsi mengacak huruf
function scrambleWord(word) {
  let scrambled = word;
  while (scrambled === word) {
    scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  }
  return scrambled;
}

export default function WordGamePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start');
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  
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
    const savedName = localStorage.getItem('word_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
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
        if (prev <= 1) {
          handleWrongAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, currentWord]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentWord]);

  useEffect(() => {
    if (gameState === 'result' && score > 0) {
      const saveScore = async () => {
        const { error } = await submitWordScore(playerName.trim(), score, wordsSolved);
        if (error) toast.error(`Gagal menyimpan skor: ${error.message}`, 5000);
      };
      saveScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleChangeName = () => {
    if (confirm('Yakin ingin mengganti nama? Skor sebelumnya tetap tersimpan dengan nama lama.')) {
      localStorage.removeItem('word_player_name');
      setPlayerName('');
      setIsRegistered(false);
    }
  };

  const generateNewWord = () => {
    // Ambil kata acak dari list lokal (wordList.js)
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

  const startGame = async (e) => {
    e.preventDefault();
    
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');

      setIsCheckingName(true);
      const { exists, actualName, error } = await checkWordPlayerExists(inputName);
      setIsCheckingName(false);

      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      
      if (exists) {
        return toast.error(`Nama "${actualName}" sudah dipakai pemain lain! Gunakan nama lain.`, 6000);
      }
      
      localStorage.setItem('word_player_name', inputName);
      setIsRegistered(true);
    }

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
        <p className="muted">Susun huruf acak menjadi kata yang benar. 3 Nyawa, waktu 30 detik!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card">
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Trophy size={56} className="text-warning" /></div>
              <h2>Mode Survival</h2>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={handleChangeName} title="Ganti Nama">
                    <Pencil size={14} />
                  </button>
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

              <button type="submit" className="btn btn--primary btn--block" style={{ marginTop: '24px', padding: '14px' }} disabled={isCheckingName}>
                {isCheckingName ? <Loader2 size={18} className="spin" /> : <Play size={18} />} 
                {isCheckingName ? 'Memeriksa Nama...' : 'Mulai Bermain'}
              </button>
            </form>
          )}

          {gameState === 'playing' && (
            <div className="game-playing">
              <div className="game-status-bar">
                <div className="lives-container">
                  {[...Array(3)].map((_, i) => (
                    i < lives ? <Heart key={i} size={24} className="fill-danger" /> : <HeartOff key={i} size={24} className="text-muted" />
                  ))}
                </div>
                <span className="badge badge--status-published">Skor: {score}</span>
              </div>
              
              <div className={`game-timer ${timeLeft <= 5 ? 'is-danger' : ''}`}>
                <Timer size={22} /> {timeLeft} detik
              </div>

               <div className="word-display">
  {(() => {
    // Cari posisi huruf pertama dari kata asli di dalam kata acak
    const firstChar = currentWord.original.charAt(0);
    const index = currentWord.scrambled.indexOf(firstChar);
    
    if (index === -1) return currentWord.scrambled; // Fallback jika tidak ketemu

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
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="game-input-field"
                  placeholder="Ketik jawaban..."
                  autoComplete="off"
                  required
                />
                <button type="submit" className="game-submit-btn">
                  <Send size={18} />
                  <span style={{ marginLeft: '8px' }}>Kirim</span>
                </button>
              </form>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large">
                <Medal size={72} className="text-warning" />
              </div>
              <h2>Nyawa Habis!</h2>
              <div className="game-final-score">
                <span>Skor Akhir</span>
                <strong>{score}</strong>
              </div>
              <p className="muted">Kamu berhasil menyusun <strong>{wordsSolved}</strong> kata dengan benar.</p>
              <button 
                type="button" 
                className="btn btn--primary btn--block" 
                onClick={() => setGameState('start')}
                style={{ marginTop: '24px' }}
              >
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
            {leaderboard.length === 0 ? (
              <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>Belum ada skor.</p>
            ) : (
              leaderboard.map((item, index) => (
                <div key={item.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                  <div className="lb-rank">{index + 1}</div>
                  <div className="lb-info">
                    <strong>{item.player_name}</strong>
                    <span>{item.words_solved} kata benar</span>
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