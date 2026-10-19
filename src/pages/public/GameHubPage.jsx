import { Link, useNavigate } from 'react-router-dom';
import { Zap, Puzzle, ArrowRight, Gamepad2, LayoutGrid, Globe, Swords, Box, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import GameChat from '../../components/GameChat.jsx'; // <-- IMPORT CHAT

export default function GameHubPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLogout() {
    await signOut();
    toast.success('Berhasil keluar dari Game.');
    navigate('/game/login');
  }

  return (
    <div className="game-hub-wrapper">
      {/* ANIMASI BACKGROUND AMBIENT PS2 */}
      <div className="ps2-ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="game-hub-content">
        <div className="game-hub__header" style={{ position: 'relative' }}>
          
          {/* Tombol Logout di Pojok Kanan */}
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <button type="button" onClick={handleLogout} className="btn btn--ghost" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'rgba(0,0,0,0.3)' }}>
              <LogOut size={16} /> Keluar
            </button>
          </div>

          <h1 className="game-hub__title" style={{ color: '#fff' }}>Pilih Game 🎮</h1>
          <p className="muted" style={{ fontSize: '1.1rem', marginTop: '8px', color: '#9ca3af' }}>
            Bermain sebagai: <strong style={{ color: '#60a5fa' }}>{profile?.display_name}</strong>
          </p>
        </div>

        <div className="game-hub__grid">
          <Link to="/game/math" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><Zap size={28} /></div>
            <h2 className="game-hub-card__title">Math Sprint</h2>
            <p className="game-hub-card__desc">Uji kecepatan berhitungmu. Jawab soal matematika acak sebelum waktu habis.</p>
            <div className="game-hub-card__footer"><span className="badge badge--danger">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/word" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><Puzzle size={28} /></div>
            <h2 className="game-hub-card__title">Tebak Kata</h2>
            <p className="game-hub-card__desc">Susun huruf acak menjadi kata yang benar. Asah kosakata dan kecepatan mengetikmu.</p>
            <div className="game-hub-card__footer"><span className="badge badge--imp-normal">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/snake" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><Gamepad2 size={28} /></div>
            <h2 className="game-hub-card__title">Snake Classic</h2>
            <p className="game-hub-card__desc">Game ular legendaris. Makan buah, tumbuh panjang, dan jangan sampai menabrak!</p>
            <div className="game-hub-card__footer"><span className="badge badge--status-published">Arcade</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/memory" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}><LayoutGrid size={28} /></div>
            <h2 className="game-hub-card__title">Memori Match</h2>
            <p className="game-hub-card__desc">Temukan pasangan kartu yang sama. Uji ingatanmu sebelum waktu habis!</p>
            <div className="game-hub-card__footer"><span className="badge badge--imp-info">Puzzle</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/country" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Globe size={28} /></div>
            <h2 className="game-hub-card__title">Tebak Negara</h2>
            <p className="game-hub-card__desc">Seberapa luas wawasan geografimu? Tebak nama negara dari benderanya!</p>
            <div className="game-hub-card__footer"><span className="badge badge--warning">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/chess" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' }}><Swords size={28} /></div>
            <h2 className="game-hub-card__title">Catur Klasik</h2>
            <p className="game-hub-card__desc">Asah strategimu di papan catur. Kalahkan Bot untuk meraih skor tertinggi!</p>
            <div className="game-hub-card__footer"><span className="badge badge--imp-normal">Strategy</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>

          <Link to="/game/breaker" className="game-hub-card glass-card">
            <div className="game-hub-card__icon" style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' }}><Box size={28} /></div>
            <h2 className="game-hub-card__title">Block Breaker</h2>
            <p className="game-hub-card__desc">Game pantulan bola klasik. Hancurkan semua bata sebelum bola jatuh!</p>
            <div className="game-hub-card__footer"><span className="badge badge--danger">Arcade</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
          </Link>
        </div>

        {/* KOMPONEN CHAT ROOM DITARUH DI SINI */}
        <GameChat />
        
      </div>
    </div>
  );
}