import { supabase } from './supabaseClient.js';

export async function getSnakeLeaderboard() {
  const { data, error } = await supabase
    .from('snake_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

export async function getAllSnakeLeaderboard() {
  const { data, error } = await supabase
    .from('snake_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkSnakePlayerExists(name) {
  const { data, error } = await supabase
    .from('snake_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitSnakeScore(playerName, score) {
  const { error } = await supabase.rpc('submit_snake_score', {
    p_name: playerName,
    p_score: score
  });
  return { error };
}

export async function deleteSnakeLeaderboardEntry(id) {
  const { error } = await supabase
    .from('snake_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}