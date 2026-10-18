import { supabase } from './supabaseClient.js';

export async function getLeaderboard() {
  // Ambil semua data (bukan cuma 10), nanti di UI akan dibatasi tinggi & di-scroll
  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(100); // Ambil maksimal 100 besar
  return { data: data ?? [], error };
}

export async function checkPlayerNameExists(name) {
  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim()) // ilike = case-insensitive
    .maybeSingle();
  
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitScore(playerName, score, correctAnswers) {
  const { error } = await supabase.rpc('submit_score', {
    p_name: playerName,
    p_score: score,
    p_correct: correctAnswers
  });
  
  if (error) {
    console.error("Gagal submit skor ke Supabase:", error);
  }
  
  return { error };
}

export async function getAllLeaderboard() {
  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function deleteLeaderboardEntry(id) {
  const { error } = await supabase
    .from('game_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}