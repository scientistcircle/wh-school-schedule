import { supabase } from './supabaseClient.js';

export async function getChessLeaderboard() {
  const { data, error } = await supabase
    .from('chess_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

export async function getAllChessLeaderboard() {
  const { data, error } = await supabase
    .from('chess_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkChessPlayerExists(name) {
  const { data, error } = await supabase
    .from('chess_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitChessScore(playerName, score) {
  const { error } = await supabase.rpc('submit_chess_score', {
    p_name: playerName,
    p_score: score
  });
  return { error };
}

export async function deleteChessLeaderboardEntry(id) {
  const { error } = await supabase
    .from('chess_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}