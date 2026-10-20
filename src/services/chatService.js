import { supabase } from './supabaseClient.js';

export async function getRecentMessages(limit = 50) {
  const { data, error } = await supabase
    .from('game_chat')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return { data: data?.reverse() ?? [], error };
}

// Tambahkan parameter replyData
export async function sendChatMessage(playerName, message, replyData = null) {
  const payload = { 
    player_name: playerName, 
    message: message.trim() 
  };

  if (replyData) {
    payload.reply_to_name = replyData.name;
    payload.reply_to_text = replyData.text;
  }

  const { error } = await supabase
    .from('game_chat')
    .insert(payload);
  return { error };
}

export async function deleteChatMessage(id) {
  const { error } = await supabase
    .from('game_chat')
    .delete()
    .eq('id', id);
  return { error };
}