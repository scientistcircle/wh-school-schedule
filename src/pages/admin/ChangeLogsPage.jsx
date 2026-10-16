import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Filter } from 'lucide-react';
import { supabase } from '../../services/supabaseClient.js';
import { formatDateTime } from '../../utils/jakartaTime.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';

const ENTITY_LABELS = {
  school_days: 'Hari Sekolah',
  lessons: 'Pelajaran',
  announcements: 'Pengumuman',
};

const ACTION_LABELS = {
  create: 'Dibuat',
  update: 'Diperbarui',
  publish: 'Dipublikasikan',
  unpublish: 'Dibatalkan',
  delete: 'Dihapus',
};

const ACTION_TONE = {
  create: 'success',
  update: 'info',
  publish: 'success',
  unpublish: 'warning',
  delete: 'danger',
};

export default function ChangeLogsPage() {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase
      .from('change_logs')
      .select('id, admin_id, entity_type, entity_id, action, change_summary, changed_at')
      .order('changed_at', { ascending: false })
      .limit(200);
    setState({ loading: false, error, rows: data ?? [] });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return state.rows.filter((r) => {
      if (filterEntity !== 'all' && r.entity_type !== filterEntity) return false;
      if (filterAction !== 'all' && r.action !== filterAction) return false;
      return true;
    });
  }, [state.rows, filterEntity, filterAction]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Riwayat Perubahan</h1>
          <p className="muted">Catatan otomatis setiap perubahan yang dilakukan admin.</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar__filters">
            <span className="toolbar__label">
              <Filter size={13} strokeWidth={2.25} />
              Jenis
            </span>
            {[
              { key: 'all', label: 'Semua' },
              { key: 'school_days', label: 'Hari' },
              { key: 'lessons', label: 'Pelajaran' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={'chip-filter' + (filterEntity === f.key ? ' is-active' : '')}
                onClick={() => setFilterEntity(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="toolbar__filters">
            <span className="toolbar__label">Aksi</span>
            {[
              { key: 'all', label: 'Semua' },
              { key: 'create', label: 'Buat' },
              { key: 'update', label: 'Edit' },
              { key: 'publish', label: 'Terbit' },
              { key: 'delete', label: 'Hapus' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={'chip-filter' + (filterAction === f.key ? ' is-active' : '')}
                onClick={() => setFilterAction(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.loading && <LoadingState message="Memuat riwayat…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && filtered.length === 0 && (
        <EmptyState
          title="Belum ada riwayat"
          description="Perubahan pada jadwal, pelajaran, dan pengumuman akan muncul di sini."
        />
      )}

      {filtered.length > 0 && (
        <div className="card card--flush">
          <div className="timeline">
            {filtered.map((r) => (
              <div key={r.id} className="timeline__item">
                <div className="timeline__bullet" data-tone={ACTION_TONE[r.action] ?? 'info'}>
                  <History size={13} strokeWidth={2.25} />
                </div>
                <div className="timeline__content">
                  <div className="timeline__head">
                    <strong>{ENTITY_LABELS[r.entity_type] ?? r.entity_type}</strong>
                    <span className={'badge badge--imp-' + (ACTION_TONE[r.action] ?? 'normal')}>
                      {ACTION_LABELS[r.action] ?? r.action}
                    </span>
                  </div>
                  {r.change_summary && (
                    <p className="timeline__summary">{r.change_summary}</p>
                  )}
                  <small className="timeline__time">
                    {formatDateTime(r.changed_at)} WIB
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}