import { supabase } from './supabaseClient.js';

export async function getRecentMessages(limit = 30) {
  const { data, error } = await supabase
    .from('game_chat')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  // Dibalik agar pesan terbaru ada di bawah
  return { data: data?.reverse() ?? [], error };
}

export async function sendChatMessage(playerName, message) {
  const { error } = await supabase
    .from('game_chat')
    .insert({ player_name: playerName, message: message.trim() });
  return { error };
}