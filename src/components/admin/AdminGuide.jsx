import { useState } from 'react';
import { BookOpen, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminGuide({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Langkah 1: Data Kelas',
      desc: 'Sebelum membuat jadwal, pastikan daftar kelas (contoh: X1, XI PA, XII Science 1) sudah dimasukkan ke dalam sistem.',
      links: [{ label: 'Buka Data Kelas', to: '/admin/kelas' }]
    },
    {
      title: 'Langkah 2: Data Guru & Mapel',
      desc: 'Masukkan daftar Guru, Mata Pelajaran, dan Ruang kelas. Data ini akan muncul sebagai pilihan (dropdown) saat Anda mengisi jadwal.',
      links: [{ label: 'Buka Data Master', to: '/admin/master' }]
    },
    {
      title: 'Langkah 3: Buat Jadwal Harian',
      desc: 'Buka menu "Jadwal KBM", lalu klik tombol "Buat Jadwal Baru". Anda juga bisa menyalin jadwal dari hari kemarin agar tidak mengetik ulang.',
      links: [{ label: 'Buat Jadwal', to: '/admin/jadwal' }]
    },
    {
      title: 'Langkah 4: Isi Pelajaran',
      desc: 'Di dalam jadwal yang sudah dibuat, buka tab "Pelajaran". Gunakan tab "Isi banyak sekaligus" (Tabel) agar Anda bisa mengisi banyak kelas dalam satu layar sekaligus.',
      links: [{ label: 'Coba Isi Jadwal', to: '/admin/jadwal' }]
    },
    {
      title: 'Langkah 5: Publikasikan',
      desc: 'Jika jadwal sudah benar, klik tombol "Publikasikan" berwarna biru di bagian atas. Santri akan langsung bisa melihat jadwal tersebut secara otomatis.',
    },
        {
      title: 'Langkah 6: Fitur Cari Guru (Untuk Santri)',
      desc: 'Di halaman utama website (bukan panel admin), terdapat kotak "Cari Jadwal Guru". Santri atau Bapak/Ibu Guru bisa memilih nama guru, dan jadwal akan otomatis menyaring hanya jadwal mengajar guru tersebut pada hari itu.',
    }
    
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="modal-header">
          <BookOpen size={24} className="text-primary" style={{ color: 'var(--primary)' }} />
          <h2>Panduan Penggunaan</h2>
        </div>
        
        <div className="modal-body">
          <div className="guide-step">
            <h3>{steps[step].title}</h3>
            <p>{steps[step].desc}</p>
            {steps[step].links && (
              <div className="guide-links">
                {steps[step].links.map((l, i) => (
                  <Link key={i} to={l.to} className="btn btn--secondary" onClick={onClose}>
                    {l.label} <ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="guide-dots">
            {steps.map((_, i) => (
              <span key={i} className={`guide-dot ${i === step ? 'is-active' : ''}`} />
            ))}
          </div>
          <div className="guide-actions">
            <button 
              className="btn btn--ghost" 
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft size={16} /> Kembali
            </button>
            {step < steps.length - 1 ? (
              <button className="btn btn--primary" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn--primary" onClick={onClose}>
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}