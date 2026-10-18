import { useCallback, useEffect, useState } from 'react';
import { Trophy, Trash2, RefreshCw, Zap, Puzzle, Gamepad2, LayoutGrid, Globe, Swords, Box } from 'lucide-react';
import { getAllLeaderboard, deleteLeaderboardEntry } from '../../services/gameService.js';
import { getAllWordLeaderboard, deleteWordLeaderboardEntry } from '../../services/wordService.js';
import { getAllSnakeLeaderboard, deleteSnakeLeaderboardEntry } from '../../services/snakeService.js';
import { getAllMemoryLeaderboard, deleteMemoryLeaderboardEntry } from '../../services/memoryService.js';
import { getAllCountryLeaderboard, deleteCountryLeaderboardEntry } from '../../services/countryService.js';
import { getAllChessLeaderboard, deleteChessLeaderboardEntry } from '../../services/chessService.js';
import { getAllBreakerLeaderboard, deleteBreakerLeaderboardEntry } from '../../services/breakerService.js'; // IMPORT BARU
import { supabase } from '../../services/supabaseClient.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDateTime } from '../../utils/jakartaTime.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const TABS = [
  { key: 'math', label: 'Math Sprint', Icon: Zap },
  { key: 'word', label: 'Tebak Kata', Icon: Puzzle },
  { key: 'snake', label: 'Snake Classic', Icon: Gamepad2 },
  { key: 'memory', label: 'Memori Match', Icon: LayoutGrid },
  { key: 'country', label: 'Tebak Negara', Icon: Globe },
  { key: 'chess', label: 'Catur Klasik', Icon: Swords },
  { key: 'breaker', label: 'Block Breaker', Icon: Box }, // TAB BARU
];

export default function GameAdminPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('math');
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    let result;
    
    if (activeTab === 'math') result = await getAllLeaderboard();
    else if (activeTab === 'word') result = await getAllWordLeaderboard();
    else if (activeTab === 'snake') result = await getAllSnakeLeaderboard();
    else if (activeTab === 'memory') result = await getAllMemoryLeaderboard();
    else if (activeTab === 'country') result = await getAllCountryLeaderboard();
    else if (activeTab === 'chess') result = await getAllChessLeaderboard();
    else if (activeTab === 'breaker') result = await getAllBreakerLeaderboard(); // FETCH BARU

    setState({ loading: false, error: result.error, rows: result.data });
  }, [activeTab]);

  useEffect(() => {
    load();

    let table = 'game_leaderboard';
    if (activeTab === 'word') table = 'word_leaderboard';
    if (activeTab === 'snake') table = 'snake_leaderboard';
    if (activeTab === 'memory') table = 'memory_leaderboard';
    if (activeTab === 'country') table = 'country_leaderboard';
    if (activeTab === 'chess') table = 'chess_leaderboard';
    if (activeTab === 'breaker') table = 'breaker_leaderboard'; // REALTIME BARU

    const channel = supabase.channel(`admin_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, activeTab]);

  async function handleDelete(row) {
    if (!confirm(`Hapus skor ${row.player_name} (${row.score} poin)?`)) return;
    setBusy(true);
    
    let error;
    if (activeTab === 'math') ({ error } = await deleteLeaderboardEntry(row.id));
    else if (activeTab === 'word') ({ error } = await deleteWordLeaderboardEntry(row.id));
    else if (activeTab === 'snake') ({ error } = await deleteSnakeLeaderboardEntry(row.id));
    else if (activeTab === 'memory') ({ error } = await deleteMemoryLeaderboardEntry(row.id));
    else if (activeTab === 'country') ({ error } = await deleteCountryLeaderboardEntry(row.id));
    else if (activeTab === 'chess') ({ error } = await deleteChessLeaderboardEntry(row.id));
    else if (activeTab === 'breaker') ({ error } = await deleteBreakerLeaderboardEntry(row.id)); // HAPUS BARU
    
    setBusy(false);
    
    if (error) toast.error(error.message);
    else toast.success('Skor berhasil dihapus.');
  }

  const getDetailColumn = (r) => {
    if (activeTab === 'math') return `${r.correct_answers} soal`;
    if (activeTab === 'word') return `${r.words_solved} kata`;
    if (activeTab === 'memory') return `${r.moves} langkah`;
    if (activeTab === 'country') return `${r.correct_answers} negara`;
    if (activeTab === 'chess') return `${r.wins} menang`;
    return '-'; // Snake & Breaker
  };

  const getColumnHeader = () => {
    if (activeTab === 'word') return 'Kata Benar';
    if (activeTab === 'snake') return 'Detail';
    if (activeTab === 'memory') return 'Langkah';
    if (activeTab === 'chess') return 'Kemenangan';
    if (activeTab === 'breaker') return 'Detail';
    return 'Soal Benar'; // Math & Country
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Leaderboard Game</h1>
          <p className="muted">Pantau skor santri dan hapus jika ada data yang mencurigakan.</p>
        </div>
        <div className="page-header__counts">
          <button type="button" className="btn btn--ghost" onClick={load} disabled={state.loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <nav className="period-tabs">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={'period-tabs__link' + (activeTab === key ? ' is-active' : '')}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {state.loading && <LoadingState message="Memuat skor pemain…" />}
      
      {!state.loading && state.rows.length === 0 && (
        <EmptyState 
          title="Belum ada yang bermain" 
          description="Belum ada santri yang menyelesaikan game ini." 
        />
      )}

      {state.rows.length > 0 && (
        <div className="card card--flush">
          <div className="table-wrap table-wrap--bare">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                  <th>Nama Pemain</th>
                  <th>Skor</th>
                  <th>{getColumnHeader()}</th>
                  <th>Waktu Main</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r, index) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: 'center' }}>
                      {index === 0 ? <Trophy size={18} className="text-warning" /> : index + 1}
                    </td>
                    <td><strong>{r.player_name}</strong></td>
                    <td><span className="badge badge--status-published">{r.score}</span></td>
                    <td>{getDetailColumn(r)}</td>
                    <td>{formatDateTime(r.created_at)} WIB</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn--danger btn--xs"
                        onClick={() => handleDelete(r)}
                        disabled={busy}
                        title="Hapus Pemain"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}