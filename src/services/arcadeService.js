import { supabase } from './supabaseClient.js';

// Ambil skor tertinggi berdasarkan game (default 1000 = semua)
export async function getArcadeLeaderboard(gameName, limit = 1000) {
  const { data, error } = await supabase
    .from('arcade_scores')
    .select('*')
    .eq('game_name', gameName)
    .order('score', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

// Simpan skor
export async function submitArcadeScore(playerName, gameName, score, level = 'EASY') {
  const { error } = await supabase.rpc('submit_arcade_score', {
    p_name: playerName,
    p_game: gameName,
    p_score: score,
    p_level: level
  });
  return { error };
}