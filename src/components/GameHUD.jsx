import { Heart, HeartOff, Timer } from 'lucide-react';

export default function GameHUD({ lives, score, timeLeft, maxTime }) {
  // Hitung persentase waktu tersisa
  const percent = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  
  // Tentukan warna bar berdasarkan sisa waktu
  let barColor = 'var(--success)'; // Hijau
  if (percent <= 25) barColor = 'var(--danger)'; // Merah
  else if (percent <= 50) barColor = 'var(--warning)'; // Kuning

  return (
    <div className="game-hud">
      <div className="game-hud__top">
        <div className="lives-container">
          {[...Array(3)].map((_, i) => (
            i < lives ? <Heart key={i} size={22} className="fill-danger" /> : <HeartOff key={i} size={22} className="text-muted" />
          ))}
        </div>
        <div className="score-container">
          Skor <strong>{score}</strong>
        </div>
      </div>

      <div className="timer-bar-container">
        <div 
          className="timer-bar-fill" 
          style={{ width: `${percent}%`, backgroundColor: barColor }} 
        />
        <div className="timer-text">
          <Timer size={14} /> {timeLeft} detik
        </div>
      </div>
    </div>
  );
}