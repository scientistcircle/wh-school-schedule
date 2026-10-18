import { useCallback, useEffect, useState } from 'react';
import { Trophy, Trash2, RefreshCw } from 'lucide-react';
import { getAllLeaderboard, deleteLeaderboardEntry } from '../../services/gameService.js';
import { supabase } from '../../services/supabaseClient.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDateTime } from '../../utils/jakartaTime.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function GameAdminPage() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await getAllLeaderboard();
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => {
    load();

    // Dengarkan update realtime
    const channel = supabase.channel('admin_leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_leaderboard' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  async function handleDelete(row) {
    if (!confirm(`Hapus skor ${row.player_name} (${row.score} poin)?`)) return;
    setBusy(true);
    const { error } = await deleteLeaderboardEntry(row.id);
    setBusy(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Skor berhasil dihapus.');
      // Tidak perlu panggil load(), karena realtime akan otomatis me-refresh tabel
    }
  }

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

      {state.loading && <LoadingState message="Memuat skor pemain…" />}
      
      {!state.loading && state.rows.length === 0 && (
        <EmptyState 
          title="Belum ada yang bermain" 
          description="Belum ada santri yang menyelesaikan game matematika." 
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
                  <th>Jawaban Benar</th>
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
                    <td>{r.correct_answers} soal</td>
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