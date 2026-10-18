import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, Play, RefreshCw, Loader2, UserCircle2, Pencil, Swords, Undo2 } from 'lucide-react';
import { getChessLeaderboard, submitChessScore, checkChessPlayerExists } from '../../services/chessService.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../services/supabaseClient.js';

// Nilai bidak untuk Bot Hard (Minimax)
const PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

export default function ChessGamePage() {
  const toast = useToast();
  const [gameState, setGameState] = useState('start'); 
  
  // State Pendaftaran
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  
  // State Pengaturan Game
  const [playerColor, setPlayerColor] = useState('w'); // 'w' atau 'b'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  
  // State Papan
  const [fen, setFen] = useState(new Chess().fen());
  const [fenHistory, setFenHistory] = useState([new Chess().fen()]);
  const [statusMsg, setStatusMsg] = useState('Giliran Anda');
  const [moveCount, setMoveCount] = useState(0);
  
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const savedName = localStorage.getItem('chess_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
    
    fetchLeaderboard();
    const channel = supabase.channel('chess_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await getChessLeaderboard();
    setLeaderboard(data || []);
  };

  const submitScore = async (finalScore) => {
    const scoreToSave = Math.max(100, finalScore); 
    const { error } = await submitChessScore(playerName.trim(), scoreToSave);
    if (error) toast.error("Gagal menyimpan skor.");
    else toast.success(`Skor ${scoreToSave} tersimpan!`);
  };

  // ==========================================
  // LOGIKA BOT (Easy, Medium, Hard)
  // ==========================================
  const getBotMove = (game) => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'medium') {
      // Prioritas memakan bidak lawan
      const captures = moves.filter(m => m.captured);
      if (captures.length > 0) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'hard') {
      // Minimax Sederhana (Depth 2)
      const botColor = playerColor === 'w' ? 'b' : 'w';
      
      const evaluateBoard = (board) => {
        let total = 0;
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece) {
              const val = PIECE_VALUES[piece.type] || 0;
              total += piece.color === botColor ? val : -val;
            }
          }
        }
        return total;
      };

      const minimax = (gameInstance, depth, alpha, beta, isMaximizing) => {
        if (depth === 0 || gameInstance.isGameOver()) {
          return evaluateBoard(gameInstance.board());
        }
        if (isMaximizing) {
          let maxEval = -Infinity;
          for (const move of gameInstance.moves()) {
            gameInstance.move(move);
            const ev = minimax(gameInstance, depth - 1, alpha, beta, false);
            gameInstance.undo();
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
          }
          return maxEval;
        } else {
          let minEval = Infinity;
          for (const move of gameInstance.moves()) {
            gameInstance.move(move);
            const ev = minimax(gameInstance, depth - 1, alpha, beta, true);
            gameInstance.undo();
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
          }
          return minEval;
        }
      };

      let bestMove = null;
      let bestValue = -Infinity;
      for (const move of moves) {
        game.move(move);
        const value = minimax(game, 2, -Infinity, Infinity, false);
        game.undo();
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }
      return bestMove;
    }
  };

  // ==========================================
  // EFFECT: JALANKAN BOT JIKA GILIRANNYA
  // ==========================================
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const gameCopy = new Chess(fen);
    const botColor = playerColor === 'w' ? 'b' : 'w';

    // Cek Game Over
    if (gameCopy.isGameOver()) {
      if (gameCopy.isCheckmate()) {
        if (gameCopy.turn() !== playerColor) {
          setStatusMsg('Skakmat! Anda Menang! 🎉');
          submitScore(Math.max(100, 1000 - (moveCount * 10))); 
        } else {
          setStatusMsg('Skakmat! Anda Kalah. 😢');
        }
      } else {
        setStatusMsg('Permainan Seri (Draw).');
      }
      setGameState('result');
      return;
    }

    // Jika giliran Bot, jalankan
    if (gameCopy.turn() === botColor) {
      setStatusMsg('Bot sedang berpikir...');
      
      const timer = setTimeout(() => {
        const bestMove = getBotMove(gameCopy);
        if (bestMove) {
          gameCopy.move(bestMove);
          const newFen = gameCopy.fen();
          setFen(newFen);
          setFenHistory(prev => [...prev, newFen]);
          setMoveCount(prev => prev + 1);
        }
      }, 600);
      
      return () => clearTimeout(timer);
    } else {
      setStatusMsg('Giliran Anda');
    }
  }, [fen, gameState, playerColor, difficulty]);

  // ==========================================
  // FUNGSI PEMAIN MENGGESER BIDAK
  // ==========================================
  const onDrop = (sourceSquare, targetSquare) => {
    if (gameState !== 'playing') return false;
    
    const gameCopy = new Chess(fen);
    
    // Pastikan pemain hanya bisa menggeser bidak miliknya
    if (gameCopy.turn() !== playerColor) return false;

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', 
      });

      if (move === null) return false;

      const newFen = gameCopy.fen();
      setFen(newFen);
      setFenHistory(prev => [...prev, newFen]);
      setMoveCount(prev => prev + 1);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // ==========================================
  // FUNGSI UNDO (BATALKAN LANGKAH)
  // ==========================================
  const handleUndo = () => {
    if (fenHistory.length < 3) return; // Butuh minimal 3 history (Awal, Player, Bot)
    
    const newHistory = [...fenHistory];
    newHistory.pop(); // Hapus langkah bot
    newHistory.pop(); // Hapus langkah player
    
    setFenHistory(newHistory);
    setFen(newHistory[newHistory.length - 1]);
    setMoveCount(prev => Math.max(0, prev - 2));
    setStatusMsg('Giliran Anda');
  };

  // ==========================================
  // MULAI GAME
  // ==========================================
  const startGame = async (e) => {
    e.preventDefault();
    if (!isRegistered) {
      const inputName = playerName.trim();
      if (!inputName) return toast.warning('Masukkan nama panggilan dulu ya!');

      setIsCheckingName(true);
      const { exists, actualName, error } = await checkChessPlayerExists(inputName);
      setIsCheckingName(false);

      if (error) return toast.error('Gagal memeriksa nama. Coba lagi.');
      if (exists) return toast.error(`Nama "${actualName}" sudah dipakai pemain lain!`, 6000);
      
      localStorage.setItem('chess_player_name', inputName);
      setIsRegistered(true);
    }

    const newGame = new Chess();
    const initialFen = newGame.fen();
    setFen(initialFen);
    setFenHistory([initialFen]);
    setMoveCount(0);
    setStatusMsg(playerColor === 'w' ? 'Giliran Anda' : 'Bot sedang berpikir...');
    setGameState('playing');
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Catur Klasik ♟️</h1>
        <p className="muted">Kalahkan Bot untuk mendapatkan skor tertinggi!</p>
      </div>

      <div className="game-layout">
        <div className="game-area card" style={{ padding: '20px' }}>
          
          {gameState === 'start' && (
            <form onSubmit={startGame} className="game-start">
              <div className="game-icon-large"><Swords size={56} className="text-primary" /></div>
              <h2>Siap Taklukkan Bot?</h2>
              
              {isRegistered ? (
                <div className="player-badge">
                  <UserCircle2 size={20} className="text-primary" />
                  <span>Bermain sebagai: <strong>{playerName}</strong></span>
                  <button type="button" className="btn-edit-name" onClick={() => {
                    localStorage.removeItem('chess_player_name');
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
                <label className="field">
                  <span>Pilih Warna</span>
                  <div className="select-wrapper">
                    <select value={playerColor} onChange={(e) => setPlayerColor(e.target.value)}>
                      <option value="w">Putih (Jalan Dulu)</option>
                      <option value="b">Hitam (Jalan Kedua)</option>
                    </select>
                  </div>
                </label>

                <label className="field">
                  <span>Level Bot</span>
                  <div className="select-wrapper">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Easy (Acak)</option>
                      <option value="medium">Medium (Agresif)</option>
                      <option value="hard">Hard (Pintar)</option>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="chess-status-bar" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px', alignItems: 'center' }}>
                <span className="badge badge--imp-normal">{statusMsg}</span>
                <button 
                  type="button" 
                  className="btn btn--ghost btn-xs" 
                  onClick={handleUndo} 
                  disabled={fenHistory.length < 3 || gameState === 'result'}
                >
                  <Undo2 size={14} /> Undo
                </button>
              </div>
              
              <div className="chess-board-wrapper">
                <Chessboard 
                  position={fen} 
                  onPieceDrop={onDrop} 
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'} // Papan selalu di bawah sesuai warna pemain
                  customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
                  customLightSquareStyle={{ backgroundColor: '#eae9d2' }}
                />
              </div>

              {gameState === 'result' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button type="button" className="btn btn--primary" onClick={() => setGameState('start')}>
                    <RefreshCw size={16} /> Main Lagi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="leaderboard-card card">
          <div className="leaderboard-header">
            <Trophy size={20} className="text-warning" />
            <h3>Peringkat Catur</h3>
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
                    <span>{item.wins} kemenangan</span>
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