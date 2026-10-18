import { Link } from 'react-router-dom';
import { Zap, Puzzle, ArrowRight, Gamepad2, LayoutGrid, Globe, Swords, Box } from 'lucide-react';

export default function GameHubPage() {
  return (
    <div className="game-hub">
      <div className="game-hub__header">
        <h1 className="game-hub__title">Pilih Game 🎮</h1>
        <p className="muted">Tantang dirimu, kumpulkan skor, dan masuk ke Papan Peringkat!</p>
      </div>

      <div className="game-hub__grid">
        <Link to="/game/math" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}><Zap size={32} /></div>
          <h2 className="game-hub-card__title">Math Sprint</h2>
          <p className="game-hub-card__desc">Uji kecepatan berhitungmu. Jawab soal matematika acak sebelum waktu habis.</p>
          <div className="game-hub-card__footer"><span className="badge badge--danger">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/word" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><Puzzle size={32} /></div>
          <h2 className="game-hub-card__title">Tebak Kata</h2>
          <p className="game-hub-card__desc">Susun huruf acak menjadi kata yang benar. Asah kosakata dan kecepatan mengetikmu.</p>
          <div className="game-hub-card__footer"><span className="badge badge--imp-normal">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/snake" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><Gamepad2 size={32} /></div>
          <h2 className="game-hub-card__title">Snake Classic</h2>
          <p className="game-hub-card__desc">Game ular legendaris. Makan buah, tumbuh panjang, dan jangan sampai menabrak!</p>
          <div className="game-hub-card__footer"><span className="badge badge--status-published">Arcade</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/memory" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><LayoutGrid size={32} /></div>
          <h2 className="game-hub-card__title">Memori Match</h2>
          <p className="game-hub-card__desc">Temukan pasangan kartu yang sama. Uji ingatanmu sebelum waktu habis!</p>
          <div className="game-hub-card__footer"><span className="badge badge--imp-info">Puzzle</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/country" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}><Globe size={32} /></div>
          <h2 className="game-hub-card__title">Tebak Negara</h2>
          <p className="game-hub-card__desc">Seberapa luas wawasan geografimu? Tebak nama negara dari benderanya!</p>
          <div className="game-hub-card__footer"><span className="badge badge--warning">Survival</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/chess" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--surface-alt)', color: 'var(--text)' }}>
            <Swords size={32} />
          </div>
          <h2 className="game-hub-card__title">Catur Klasik</h2>
          <p className="game-hub-card__desc">Asah strategimu di papan catur. Kalahkan Bot untuk meraih skor tertinggi!</p>
          <div className="game-hub-card__footer"><span className="badge badge--imp-normal">Strategy</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>

        <Link to="/game/breaker" className="game-hub-card">
          <div className="game-hub-card__icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            <Box size={32} />
          </div>
          <h2 className="game-hub-card__title">Block Breaker</h2>
          <p className="game-hub-card__desc">Game pantulan bola klasik. Hancurkan semua bata sebelum bola jatuh!</p>
          <div className="game-hub-card__footer"><span className="badge badge--danger">Arcade</span><ArrowRight size={18} className="game-hub-card__arrow" /></div>
        </Link>
      </div>
    </div>
  );
}