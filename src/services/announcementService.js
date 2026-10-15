import { supabase } from './supabaseClient.js';

// Pengumuman aktif yang boleh dibaca publik.
// RLS sudah menyaring is_published + rentang tanggal;
// filter ganda di sini hanya untuk berjaga-jaga.
export async function getActiveAnnouncements(limit = 20) {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, content, importance, start_date, end_date, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

export async function getLatestAnnouncements(limit = 3) {
  return getActiveAnnouncements(limit);
}