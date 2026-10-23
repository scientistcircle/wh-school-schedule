import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RefreshCw, Gamepad2, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { submitArcadeScore, getArcadeLeaderboard } from '../../services/arcadeService.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function CatchTheBallPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const iframeRef = useRef(null);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const playerName = localStorage.getItem('snake_player_name') || profile?.display_name || 'Anonim';

  const fetchScores = async () => {
    setLoading(true);
    const { data } = await getArcadeLeaderboard('catch-the-ball', 10);
    setLeaderboard(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();

    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'ARCADE_RESULT' && event.data.game === 'catch-the-ball') {
        const { error } = await submitArcadeScore(playerName, 'catch-the-ball', event.data.score);
        if (!error) {
          toast.success(`Skor tersimpan: ${event.data.score}`);
          fetchScores();
        } else {
          toast.error("Gagal menyimpan skor.");
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profile, playerName]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#05070a', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <Link to="/game" className="btn btn--ghost" style={{ color: '#fff', borderColor: '#333' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 size={20} /> Catch the Ball
        </h2>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> {playerName}
          </span>
          <Link to="/game/arcade-leaderboard" className="btn btn--ghost" style={{ color: '#fff', borderColor: '#333' }}>
            <Trophy size={16} /> Papan Skor Lengkap
          </Link>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '16px', gap: '16px' }}>
        
        {/* KIRI: GAME (Biarkan Iframe Mengisi Ruang) */}
        <div style={{ 
          flex: 1, 
          background: '#1a1a2e',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden', // Memotong jika ada yang keluar
          position: 'relative'
        }}>
          <iframe 
            ref={iframeRef}
            src="/catch-the-ball/index.html" 
            title="Catch the Ball" 
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allowFullScreen 
          />
        </div>

        {/* KANAN: LEADERBOARD */}
        <div style={{ 
          width: '340px', 
          background: 'rgba(17, 24, 39, 0.9)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '16px',
          display: 'flex', 
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Trophy size={18} /> Top 10
            </h3>
            <button onClick={fetchScores} className="btn btn--ghost" style={{ color: '#9ca3af', padding: '6px' }}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading && leaderboard.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>Memuat...</p>
            ) : leaderboard.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>Belum ada skor.</p>
            ) : (
              leaderboard.map((item, index) => (
                <div key={item.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', 
                  background: index === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: index === 0 ? '#fbbf24' : '#374151',
                      color: index === 0 ? '#000' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 'bold'
                    }}>{index + 1}</span>
                    <strong style={{ color: item.player_name === playerName ? '#4ade80' : '#fff', fontSize: '14px' }}>
                      {item.player_name}
                    </strong>
                  </div>
                  <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '16px' }}>{item.score}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}