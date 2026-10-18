import { supabase } from './supabaseClient.js';

export async function getCountryLeaderboard() {
  const { data, error } = await supabase
    .from('country_leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

export async function getAllCountryLeaderboard() {
  const { data, error } = await supabase
    .from('country_leaderboard')
    .select('*')
    .order('score', { ascending: false });
  return { data: data ?? [], error };
}

export async function checkCountryPlayerExists(name) {
  const { data, error } = await supabase
    .from('country_leaderboard')
    .select('id, player_name')
    .ilike('player_name', name.trim())
    .maybeSingle();
  return { exists: !!data, actualName: data?.player_name, error };
}

export async function submitCountryScore(playerName, score, correctAnswers) {
  const { error } = await supabase.rpc('submit_country_score', {
    p_name: playerName,
    p_score: score,
    p_correct: correctAnswers
  });
  return { error };
}

export async function deleteCountryLeaderboardEntry(id) {
  const { error } = await supabase
    .from('country_leaderboard')
    .delete()
    .eq('id', id);
  return { error };
}