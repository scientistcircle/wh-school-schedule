import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getArcadeLeaderboard } from '../../services/arcadeService.js';

const GAMES = [
  { id: 'quiz', name: 'Quiz Game', icon: '🧠' },
  { id: 'math-quest', name: 'Math Quest', icon: '🔢' },
  { id: 'sports-heads', name: 'Sports Heads', icon: '⚽' },
  { id: 'catch-the-ball', name: 'Catch the Ball', icon: '🏀' },
  { id: 'number-disco', name: 'Number Disco', icon: '🎯' },
];

export default function ArcadeLeaderboardPage() {
  const [activeGame, setActiveGame] = useState('quiz');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Ambil SEMUA peserta
    getArcadeLeaderboard(activeGame, 1000).then(({ data }) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, [activeGame]);

  return (
    <div className="stack" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>🏆 Papan Skor Arcade</h1>
        <Link to="/game" className="btn btn--ghost">Kembali ke Game Hub</Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`btn ${activeGame === game.id ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: '1 1 auto', minWidth: '120px' }}
          >
            {game.icon} {game.name}
          </button>
        ))}
      </div>

      <div className="card card--flush">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Memuat skor...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Belum ada skor. Jadilah yang pertama!</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                  <th>Nama Pemain</th>
                  <th>Skor</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>
                      {index === 0 ? <Trophy size={18} className="text-warning" /> : index + 1}
                    </td>
                    <td><strong>{item.player_name}</strong></td>
                    <td><span className="badge badge--status-published">{item.score}</span></td>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}