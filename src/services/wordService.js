import { supabase } from './supabaseClient.js';

// Untuk halaman publik (hanya 50 besar)
export async function getWordLeaderboard() {
  const { data, error } = await supabase
    .from('word_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

// Untuk halaman admin (ambil semua)
export async function getAllWordLeaderboard() {
  const { data, error } = await supabase
    .from('word_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkWordPlayerExists(name) {
  const { data, error } = await supabase
    .from('word_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitWordScore(playerName, score, wordsSolved) {
  const { error } = await supabase.rpc('submit_word_score', {
    p_name: playerName,
    p_score: score,
    p_solved: wordsSolved
  });
  return { error };
}

// Untuk Admin menghapus data
export async function deleteWordLeaderboardEntry(id) {
  const { error } = await supabase
    .from('word_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}