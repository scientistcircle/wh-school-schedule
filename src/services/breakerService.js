import { supabase } from './supabaseClient.js';

export async function getBreakerLeaderboard() {
  const { data, error } = await supabase
    .from('breaker_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

export async function getAllBreakerLeaderboard() {
  const { data, error } = await supabase
    .from('breaker_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkBreakerPlayerExists(name) {
  const { data, error } = await supabase
    .from('breaker_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitBreakerScore(playerName, score) {
  const { error } = await supabase.rpc('submit_breaker_score', {
    p_name: playerName,
    p_score: score
  });
  return { error };
}

export async function deleteBreakerLeaderboardEntry(id) {
  const { error } = await supabase
    .from('breaker_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}