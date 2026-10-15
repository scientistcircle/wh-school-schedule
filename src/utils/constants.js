// Zona waktu tunggal untuk seluruh aplikasi.
export const APP_TIMEZONE = 'Asia/Jakarta';
export const APP_LOCALE = 'id-ID';

// Label status hari sekolah — dipakai di beberapa halaman.
export const SCHOOL_DAY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const SCHOOL_DAY_STATUS_LABEL = {
  draft: 'Belum Dipublikasikan',
  published: 'Sudah Dipublikasikan',
};

// Kode sesi KBM. Harus konsisten dengan CHECK constraint di lesson_periods.
export const PERIOD_CODES = ['KBM1', 'KBM2', 'KBM3', 'KBM4', 'KBM5'];

export const PERIOD_LABEL = {
  KBM1: 'KBM 1',
  KBM2: 'KBM 2',
  KBM3: 'KBM 3',
  KBM4: 'KBM 4',
  KBM5: 'KBM 5',
};

// Tingkat kepentingan pengumuman. Harus konsisten dengan CHECK constraint.
export const IMPORTANCE_LEVELS = ['low', 'normal', 'high', 'urgent'];

export const IMPORTANCE_LABEL = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Penting',
  urgent: 'Mendesak',
};

// Kode agenda harian. Harus konsisten dengan CHECK di daily_activities.
export const ACTIVITY_CODES = [
  'APEL',
  'PICKET',
  'KBM1',
  'KBM2',
  'ISTIRAHAT',
  'KBM3',
  'KBM4',
  'DZUHUR',
  'KBM5',
];

// Status koneksi realtime.
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  LIVE: 'live',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
};

export const CONNECTION_LABEL = {
  connecting: 'Menghubungkan…',
  live: 'Live',
  reconnecting: 'Menghubungkan kembali…',
  offline: 'Offline',
};