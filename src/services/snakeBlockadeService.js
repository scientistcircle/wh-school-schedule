import { supabase } from './supabaseClient.js';

export async function getSnakeBlockadeLeaderboard() {
  const { data, error } = await supabase
    .from('snake_blockade_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

export async function checkSnakeBlockadePlayerExists(name) {
  const { data, error } = await supabase
    .from('snake_blockade_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitSnakeBlockadeScore(playerName, score) {
  const { error } = await supabase.rpc('submit_snake_blockade_score', {
    p_name: playerName,
    p_score: score
  });
  return { error };
}