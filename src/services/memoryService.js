import { supabase } from './supabaseClient.js';

export async function getMemoryLeaderboard() {
  const { data, error } = await supabase.from('memory_leaderboard').select('*').order('score', { ascending: false }).limit(50);
  return { data: data ?? [], error };
}

export async function getAllMemoryLeaderboard() {
  const { data, error } = await supabase.from('memory_leaderboard').select('*').order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkMemoryPlayerExists(name) {
  const { data, error } = await supabase.from('memory_leaderboard').select('id, player_name').ilike('player_name', name.trim()).maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitMemoryScore(playerName, score, moves) {
  const { error } = await supabase.rpc('submit_memory_score', { p_name: playerName, p_score: score, p_moves: moves });
  return { error };
}

export async function deleteMemoryLeaderboardEntry(id) {
  const { error } = await supabase.from('memory_leaderboard').delete().eq('id', id);
  return { error };
}