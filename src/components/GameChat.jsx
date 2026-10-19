import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { getRecentMessages, sendChatMessage } from '../services/chatService.js';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function GameChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Ambil pesan awal
    getRecentMessages().then(({ data }) => setMessages(data));

    // Dengarkan pesan baru secara realtime
    const channel = supabase.channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_chat' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    setBusy(true);
    await sendChatMessage(profile.display_name, input);
    setInput('');
    setBusy(false);
  }

  return (
    <div className="game-chat-container glass-card">
      <div className="game-chat-header">Global Chat Room 💬</div>
      
      <div className="game-chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">Belum ada obrolan. Jadilah yang pertama!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.player_name === profile?.display_name ? 'is-me' : ''}`}>
              <span className="chat-name">{msg.player_name}</span>
              <span className="chat-text">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="game-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
          maxLength={200}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}