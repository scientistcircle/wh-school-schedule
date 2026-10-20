import { supabase } from './supabaseClient.js';

// ---- Publik ----
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

// ---- Admin ----
export async function listAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

export async function createAnnouncement(payload) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(payload)
    .select()
    .single();
  return { data, error };
}

export async function updateAnnouncement(id, payload) {
  const { data, error } = await supabase
    .from('announcements')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  return { error };
}

export async function toggleAnnouncementPublish(id, publish) {
  const { data, error } = await supabase
    .from('announcements')
    .update({ is_published: publish })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}
// Tambah di adminService.js, setelah fungsi createMaster
export async function bulkCreateMaster(table, rows) {
  if (!rows || rows.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from(table)
    .insert(rows)
    .select();
  return { data: data ?? [], error };
}