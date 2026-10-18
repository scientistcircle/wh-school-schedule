import { useState, useEffect, useRef } from 'react';
import { Trophy, Timer, Play, RefreshCw, Medal, Heart, HeartOff, Loader2, UserCircle2, Pencil, ChevronDown, Globe } from 'lucide-react';
import { getCountryLeaderboard, submitCountryScore, checkCountryPlayerExists } from '../../services/countryService.js';
import { COUNTRY_LIST } from '../../utils/countries.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

const LEVEL_CONFIG = {
  easy: { time: 15 },
  medium: { time: 10 },
  hard: { time: 5 }
};

const LETTERS = ['A', 'B', 'C', 'D'];

function generateQuestion() {
  const shuffled = [...COUNTRY_LIST].sort(() => 0.5 - Math.random());
  const target = shuffled[0];
  
  const options = [target];
  let i = 1;
  while (options.length < 4) {
    const distractor = shuffled[i];
    if (distractor.name !== target.name) {
      options.push(distractor);
    }
    i++;
  }
  
  const sortedOptions = options.sort(() => 0.5 - Math.random());
  const correctIndex = sortedOptions.findIndex((o) => o.name === target.name);

  return { target, options: sortedOptions, correctIndex };
}

export default function CountryGamePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start');
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const [currentQ, setCurrentQ] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('country_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('country_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'country_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getCountryLeaderboard();
    setLeaderboard(data || []);
  };

  useEffect(() => {
    if (gameState !== 'playing' || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(-1); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, currentQ, isAnswered]);

  useEffect(() => {
    if (gameState === 'result' && score > 0) {
      submitCountryScore(playerName.trim(), score, correctCount).then(({ error }) => {
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
      const { exists, actualName, error } = await checkCountryPlayerExists(inputName);
      setIsCheckingName(false);

      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('country_player_name', inputName);
      setIsRegistered(true);
    }

    setLives(3);
    setScore(0);
    setCorrectCount(0);
    setCurrentQ(generateQuestion());
    setTimeLeft(LEVEL_CONFIG[difficulty].time);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameState('playing');
  };

  const handleAnswer = (index) => {
    if (isAnswered) return;
    
    clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedOption(index);

    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      const earnedPoints = 100 + (timeLeft * 10);
      setScore((prev) => prev + earnedPoints);
      setCorrectCount((prev) => prev + 1);
      toast.success("Benar! +" + earnedPoints, 1000);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      toast.error(index === -1 ? "Waktu Habis!" : "Jawaban Salah!", 1500);
      
      if (newLives <= 0) {
        setTimeout(() => setGameState('result'), 1500);
        return;
      }
    }

    setTimeout(() => {
      setCurrentQ(generateQuestion());
      setTimeLeft(LEVEL_CONFIG[difficulty].time);
      setSelectedOption(null);
      setIsAnswered(false);
    }, 1500);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Tebak Negara 🌍</h1>
        <p className="muted">Tebak nama negara dari benderanya. 3 Nyawa!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Globe size={56} className="text-primary" /></div>
              <h2>Uji Wawasan Geografimu</h2>
              <p className="muted" style={{ marginBottom: '20px' }}>
                Pilih level kecepatan. Semakin cepat menjawab, skor semakin besar!
              </p>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('country_player_name');
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
                      <option value="easy">Ez (15 Detik/Soal)</option>
                      <option value="medium">Medium (10 Detik/Soal)</option>
                      <option value="hard">Hard (5 Detik/Soal)</option>
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

          {gameState === 'playing' && currentQ && (
            <div className="game-playing">
              <div className="game-status-bar">
                <div className="lives-container">
                  {[...Array(3)].map((_, i) => (
                    i < lives ? <Heart key={i} size={24} className="fill-danger" /> : <HeartOff key={i} size={24} className="text-muted" />
                  ))}
                </div>
                <span className="badge badge--status-published">Skor: {score}</span>
              </div>
              
              <div className={`game-timer ${timeLeft <= 3 ? 'is-danger' : ''}`}>
                <Timer size={22} /> {timeLeft} detik
              </div>

              {/* GANTI EMOJI DENGAN IMG DARI FLAGCDN */}
              <div className="country-flag">
                <img 
                  src={`https://flagcdn.com/w320/${currentQ.target.code}.png`} 
                  alt="Bendera" 
                  className="country-flag-img"
                />
              </div>
              <div className="country-continent">Benua: {currentQ.target.continent}</div>

              <div className="quiz-options-grid" style={{ marginTop: '24px' }}>
                {currentQ.options.map((opt, idx) => {
                  let btnClass = 'quiz-option-btn';
                  if (isAnswered) {
                    if (idx === currentQ.correctIndex) btnClass += ' is-correct';
                    else if (idx === selectedOption) btnClass += ' is-wrong';
                    else btnClass += ' is-disabled';
                  }

                  return (
                    <button
                      key={idx}
                      className={btnClass}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                    >
                      <span className="quiz-letter">{LETTERS[idx]}</span>
                      <span className="quiz-text">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large">
                <Medal size={72} className="text-primary" />
              </div>
              <h2>Nyawa Habis!</h2>
              <div className="game-final-score">
                <span>Skor Akhir</span>
                <strong>{score}</strong>
              </div>
              <p className="muted">Kamu berhasil menebak <strong>{correctCount}</strong> negara dengan benar.</p>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setGameState('start')} style={{ marginTop: '24px' }}>
                <RefreshCw size={16} /> Main Lagi
              </button>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Tebak Negara</h3>
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
                    <span>{item.correct_answers} negara benar</span>
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