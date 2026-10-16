import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Trash2, Info } from 'lucide-react';
import { resetAllData, resetTable } from '../../services/resetService.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const TABLES = [
  { key: 'classes', label: 'Kelas', desc: 'Semua daftar kelas' },
  { key: 'teachers', label: 'Guru', desc: 'Semua daftar guru' },
  { key: 'subjects', label: 'Mata Pelajaran', desc: 'Semua daftar mapel' },
  { key: 'rooms', label: 'Ruang', desc: 'Semua daftar ruang' },
  { key: 'announcements', label: 'Pengumuman', desc: 'Semua pengumuman' },
];

export default function SettingsPage() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function handleResetAll() {
    if (confirmText !== 'RESET') {
      toast.error('Ketik RESET (huruf kapital) untuk konfirmasi.');
      return;
    }
    if (!confirm('PERINGATAN TERAKHIR: Seluruh jadwal, guru, kelas, mapel, ruang, dan pengumuman akan dihapus permanen. Lanjutkan?')) {
      return;
    }

    setBusy(true);
    const result = await resetAllData();
    setBusy(false);

    if (result.ok) {
      toast.success('Semua data berhasil dihapus. Silakan input manual.');
      setConfirmText('');
    } else {
      const errList = result.errors.map((e) => e.step).join(', ');
      toast.error(`Sebagian gagal dihapus: ${errList}. Cek console untuk detail.`);
      console.error('[reset]', result.errors);
    }
  }

  async function handleResetTable(table) {
    const cfg = TABLES.find((t) => t.key === table);
    if (!confirm(`Hapus semua data ${cfg?.label}? Tindakan ini permanen.`)) return;

    setBusy(true);
    const { error } = await resetTable(table);
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success(`Data ${cfg?.label} berhasil dihapus.`);
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Pengaturan</h1>
          <p className="muted">Kelola data master dan reset sistem.</p>
        </div>
      </div>

      <section className="card">
        <h2 className="card__title">Informasi</h2>
        <div className="info-box">
          <Info size={16} strokeWidth={2} />
          <div>
            <p style={{ margin: 0 }}>
              <strong>Reset per bagian</strong> menghapus isi satu tabel saja — cocok kalau
              hanya ingin memperbarui daftar guru atau kelas.
            </p>
            <p style={{ margin: '6px 0 0' }}>
              <strong>Reset total</strong> menghapus semuanya termasuk jadwal dan pelajaran.
              Gunakan hanya untuk memulai dari nol.
            </p>
            <p style={{ margin: '6px 0 0' }}>
              Akun admin <strong>tidak terhapus</strong>. Hanya data operasional yang dibersihkan.
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Reset Per Bagian</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Hapus data satu jenis saja. Fitur ini berguna untuk mengganti daftar yang sudah ada
          dengan yang baru.
        </p>

        <div className="reset-list">
          {TABLES.map((t) => (
            <div key={t.key} className="reset-list__item">
              <div className="reset-list__info">
                <strong>{t.label}</strong>
                <span className="muted">{t.desc}</span>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleResetTable(t.key)}
                disabled={busy}
              >
                <RotateCcw size={14} strokeWidth={2.25} />
                <span>Kosongkan</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card danger-card">
        <h2 className="card__title">
          <AlertTriangle size={16} strokeWidth={2.25} />
          Reset Total
        </h2>
        <p>
          Menghapus <strong>seluruh data</strong> dari database:
        </p>
        <ul className="danger-list">
          <li>Semua jadwal hari (hari sekolah)</li>
          <li>Semua pelajaran dan sesi KBM</li>
          <li>Semua guru piket dan agenda harian</li>
          <li>Semua kelas, guru, mata pelajaran, dan ruang</li>
          <li>Semua pengumuman</li>
        </ul>
        <p className="danger-warn">
          Akun admin tetap aman. Setelah reset, Anda dapat mengisi data master dari awal secara manual.
        </p>

        <div className="confirm-row">
          <label className="field">
            <span>Ketik <code>RESET</code> untuk mengaktifkan tombol</span>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleResetAll}
            disabled={busy || confirmText !== 'RESET'}
          >
            <Trash2 size={14} strokeWidth={2.25} />
            {busy ? 'Menghapus…' : 'Hapus Semua Data'}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: '0.75rem' }}>
          Butuh backup dulu? Buka{' '}
          <Link to="/admin/jadwal" style={{ color: 'inherit', textDecoration: 'underline' }}>
            halaman Jadwal KBM
          </Link>{' '}
          dan salin jadwal yang masih dipakai sebelum menghapus.
        </p>
      </section>
    </div>
  );
}