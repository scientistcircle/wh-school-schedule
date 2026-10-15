// Client Supabase tunggal untuk seluruh aplikasi.
// Service worker PWA menangani cache untuk GET request ke Supabase;
// request tulis (POST/PATCH/DELETE) selalu langsung ke jaringan.
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Berhenti dengan pesan jelas agar tidak bingung saat .env belum diisi.
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib diisi di .env.local. ' +
      'Lihat .env.example untuk formatnya.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      // Batasi laju event agar tidak melebihi kuota free tier.
      eventsPerSecond: 5,
    },
  },
});