import { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Medal, ChevronDown, Send, Flame, Trophy } from 'lucide-react'; // <-- Trophy ditambahkan
import { getLeaderboard, submitScore } from '../../services/gameService.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import GameHUD from '../../components/GameHUD.jsx';

const TIME_MAPPING = { easy: 5, medium: 10, hard: 15 };

function generateMathProblem(difficulty) {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer, text;
  let maxAddSub = 20; let maxMulDiv = 5;  

  if (difficulty === 'medium') { maxAddSub = 50; maxMulDiv = 10; } 
  else if (difficulty === 'hard') { maxAddSub = 100; maxMulDiv = 15; }

  if (op === '+') { a = Math.floor(Math.random() * maxAddSub) + 2; b = Math.floor(Math.random() * maxAddSub) + 2; answer = a + b; text = `${a} + ${b}`; } 
  else if (op === '-') { a = Math.floor(Math.random() * maxAddSub) + 10; b = Math.floor(Math.random() * (a - 1)) + 1; answer = a - b; text = `${a} - ${b}`; } 
  else if (op === '×') { a = Math.floor(Math.random() * maxMulDiv) + 2; b = Math.floor(Math.random() * maxMulDiv) + 2; answer = a * b; text = `${a} × ${b}`; } 
  else { answer = Math.floor(Math.random() * maxMulDiv) + 2; b = Math.floor(Math.random() * maxMulDiv) + 2; a = b * answer; text = `${a} ÷ ${b}`; }

  return { text, answer };
}

export default function GamePage() {
  const toast = useToast();
  const { profile } = useAuth();
  const playerName = profile?.display_name || 'Player';

  const [gameState, setGameState] = useState('start');
  const [difficulty, setDifficulty] = useState('medium');
  
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [correctCount, setCorrectCount] = useState(0); 
  const [currentQuestion, setCurrentQuestion] = useState({ text: '', answer: 0 });
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase.channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getLeaderboard();
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
  }, [gameState, questionNumber, lives]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) inputRef.current.focus();
  }, [gameState, questionNumber]);

  useEffect(() => {
    if (gameState === 'result' && score > 0) {
      const saveScore = async () => {
        const { error } = await submitScore(playerName.trim(), score, correctCount);
        if (error) toast.error(`Gagal menyimpan skor: ${error.message}`, 5000);
      };
      saveScore();
    }
  }, [gameState]);

  const startGame = (e) => {
    e.preventDefault();
    setLives(3);
    setScore(0);
    setCorrectCount(0);
    setQuestionNumber(1);
    setTimeLeft(TIME_MAPPING[difficulty]); 
    setInputValue('');
    setCurrentQuestion(generateMathProblem(difficulty));
    setGameState('playing');
  };

  const submitAnswer = (e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    clearInterval(timerRef.current);
    const isCorrect = parseInt(inputValue, 10) === currentQuestion.answer;
    
    if (isCorrect) {
      let multiplier = 1;
      if (difficulty === 'medium') multiplier = 1.5;
      if (difficulty === 'hard') multiplier = 2;
      const baseScore = 100 + (timeLeft * 10);
      const earnedPoints = Math.round(baseScore * multiplier);
      setScore((prev) => prev + earnedPoints);
      setCorrectCount((prev) => prev + 1);
      nextQuestion();
    } else {
      handleWrongAnswer();
    }
  };

  const handleWrongAnswer = () => {
    clearInterval(timerRef.current);
    setInputValue('');
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameState('result');
    } else {
      toast.error(`Salah! Nyawa tersisa ${newLives}`, 1500);
      nextQuestion();
    }
  };

  const nextQuestion = () => {
    setInputValue(''); 
    setQuestionNumber((prev) => prev + 1);
    setCurrentQuestion(generateMathProblem(difficulty));
    setTimeLeft(TIME_MAPPING[difficulty]); 
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Math Sprint ⚡</h1>
        <p className="muted">Survival Mode: 3 Nyawa.</p>
      </div>

      <div className="game-layout">
        <div className="game-area card">
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Flame size={56} className="text-danger" /></div>
              <h2>Mode Survival</h2>
              
              <div className="player-badge">
                <span>Bermain sebagai: <strong>{playerName}</strong></span>
              </div>

              <div className="game-form-grid" style={{ marginTop: '12px' }}>
                <label className="field field--wide">
                  <span>Level Kesulitan</span>
                  <div className="select-wrapper">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Ez (5 Detik)</option>
                      <option value="medium">Medium (10 Detik)</option>
                      <option value="hard">Hard (15 Detik)</option>
                    </select>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                </label>
              </div>

              <button type="submit" className="btn btn--danger btn--block" style={{ marginTop: '24px', padding: '14px', background: 'var(--danger)' }}>
                <Play size={18} /> Mulai Bertahan
              </button>
            </form>
          )}

          {gameState === 'playing' && (
            <div className="game-playing">
              
              {/* KOMPONEN HUD BARU */}
              <GameHUD lives={lives} score={score} timeLeft={timeLeft} maxTime={TIME_MAPPING[difficulty]} />

              <div className="game-question">{currentQuestion.text} = ?</div>

              <form onSubmit={submitAnswer} className="game-input-group">
                <input ref={inputRef} type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="game-input-field" placeholder="Jawaban..." required />
                <button type="submit" className="game-submit-btn" style={{ background: 'var(--danger)' }}>
                  <Send size={18} /> <span style={{ marginLeft: '8px' }}>Kirim</span>
                </button>
              </form>
            </div>
          )}

          {gameState === 'result' && (
            <div className="game-result">
              <div className="game-icon-large"><Medal size={72} className="text-primary" /></div>
              <h2>Nyawa Habis!</h2>
              <div className="game-final-score">
                <span>Skor Akhir</span>
                <strong>{score}</strong>
              </div>
              <p className="muted">Kamu menjawab benar <strong>{correctCount}</strong> soal.</p>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setGameState('start')} style={{ marginTop: '24px' }}>
                <RefreshCw size={16} /> Main Lagi
              </button>
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Papan Peringkat</h3>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((item, index) => (
              <div key={item.id} className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                <div className="lb-rank">{index + 1}</div>
                <div className="lb-info">
                  <strong>{item.player_name}</strong>
                  <span>{item.correct_answers} soal benar</span>
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