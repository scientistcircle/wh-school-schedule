import { supabase } from './supabaseClient.js';

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);
  return { data: data ?? [], error };
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
// Tambahkan 2 fungsi ini di paling bawah file gameService.js

export async function getAllLeaderboard() {
  // Admin bisa melihat semua data, bukan cuma 10 besar
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