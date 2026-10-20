import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Trash2, Smile, Reply } from 'lucide-react'; 
import { getRecentMessages, sendChatMessage, deleteChatMessage } from '../services/chatService.js'; 
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function GameChat() {
  const { profile, isAdmin } = useAuth(); 
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false); 
  const [replyTo, setReplyTo] = useState(null); 
  const [fontSize, setFontSize] = useState(14);
  
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [hasNewMessage, setHasNewMessage] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); // State Loading
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Effect 1: Load pesan saat chat dibuka
  useEffect(() => {
    if (!isOpen) { 
      setReplyTo(null); 
      return; 
    }
    
    setIsLoading(true);
    getRecentMessages().then(({ data }) => {
      setMessages(data);
      setIsLoading(false);
    });
  }, [isOpen]);

  // Effect 2: Realtime pendengar pesan baru (jalan terus di background)
  useEffect(() => {
    const channel = supabase.channel('chat_room_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_chat' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        if (!isOpen) setHasNewMessage(true); // Munculkan titik merah
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_chat' }, (payload) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [isOpen]);

  // Effect 3: Scroll ke bawah otomatis
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    setBusy(true);
    const replyData = replyTo ? { name: replyTo.player_name, text: replyTo.message } : null;
    await sendChatMessage(profile.display_name, input.trim(), replyData);
    setInput('');
    setReplyTo(null); 
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await deleteChatMessage(deleteTarget.id);
    if (!error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== deleteTarget.id));
    }
    setDeleteTarget(null); 
  }
  
  function handleReply(msg) {
    setReplyTo(msg);
    inputRef.current?.focus();
  }

  return (
    <div className="floating-chat-wrapper">
      {isOpen && (
        <div 
          className="ig-chat-container animate-ig-chat" 
          style={{ '--chat-font-size': `${fontSize}px` }}
        >
          {/* HEADER */}
          <div className="ig-chat-header">
            <div className="ig-chat-header-left">
              <button className="ig-icon-btn" onClick={() => setIsOpen(false)}>
                <svg aria-label="Kembali" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M21 11H6.414l5.293-5.293-1.414-1.414L2.586 12l7.707 7.707 1.414-1.414L6.414 13H21v-2z"></path></svg>
              </button>
              <div className="ig-header-user">
                <div className="ig-avatar-small"><img src="/logo.png" alt="Avatar" /></div>
                <div className="ig-header-info">
                  <strong>Global Chat</strong>
                  <span>Chat Now</span>
                </div>
              </div>
            </div>
            
            <div className="ig-chat-header-right">
               <div className="ig-font-controls">
                 <button type="button" className="ig-font-btn" onClick={() => setFontSize(prev => Math.max(10, prev - 2))}>A-</button>
                 <button type="button" className="ig-font-btn" onClick={() => setFontSize(prev => Math.min(24, prev + 2))}>A+</button>
               </div>
            </div>
          </div>

          {/* BODY PESAN */}
          <div className="ig-chat-messages">
            <div className="ig-chat-inner">
              
              {isLoading ? (
                <div className="ig-chat-empty"><p className="muted">Memuat pesan...</p></div>
              ) : messages.length === 0 ? (
                <div className="ig-chat-empty">
                  <div className="ig-avatar-large"><img src="/logo.png" alt="Logo" /></div>
                  <h2>Pesan</h2>
                  <p>Belum ada obrolan. Kirim pesan pertamamu!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.player_name === profile?.display_name;
                  const canDelete = isMe || isAdmin; 

                  return (
                    <div key={msg.id} className={`ig-msg-group ${isMe ? 'is-me' : ''}`}>
                      {!isMe && (
                        <div className="ig-avatar-tiny">{msg.player_name.charAt(0).toUpperCase()}</div>
                      )}
                      
                      <div className="ig-msg-body">
                        {!isMe && <span className="ig-msg-name">{msg.player_name}</span>}
                        
                        <div className="ig-bubble-row">
                          <div className={`ig-bubble ${isMe ? 'ig-bubble-me' : 'ig-bubble-other'}`} onClick={() => !isMe && handleReply(msg)}>
                            {msg.reply_to_name && (
                              <div className="ig-replied-quote">
                                <span className="ig-replied-label">Membalas <strong>{msg.reply_to_name}</strong></span>
                                <div className="ig-replied-box"><span className="ig-replied-text">{msg.reply_to_text}</span></div>
                              </div>
                            )}
                            <div className="ig-text">{msg.message}</div>
                          </div>

                          <div className="ig-msg-actions">
                            <button className="ig-action-btn"><Smile size={16} /></button>
                            {!isMe && (
                              <button className="ig-action-btn" onClick={() => handleReply(msg)} title="Balas">
                                <Reply size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button className="ig-action-btn text-danger" onClick={() => setDeleteTarget(msg)} title="Hapus">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* INDIKATOR REPLY */}
          {replyTo && (
            <div className="ig-reply-indicator">
              <div className="ig-reply-content">
                <Reply size={14} />
                <span>Membalas <strong>{replyTo.player_name}</strong></span>
              </div>
              <button className="ig-reply-close" onClick={() => setReplyTo(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* INPUT AREA */}
          <form onSubmit={handleSubmit} className="ig-chat-input-area">
            <div className="ig-input-wrapper">
              <button type="button" className="ig-input-icon"><Smile size={22} /></button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={replyTo ? `Balas ${replyTo.player_name}...` : "Kirim pesan..."}
                maxLength={200}
                disabled={busy}
              />
            </div>
            {input.trim() && (
              <button type="submit" className="ig-send-btn" disabled={busy}>Kirim</button>
            )}
          </form>
        </div>
      )}

      {/* TOMBOL TOGGLE */}
      {!isOpen && (
        <button 
          className="chat-toggle-btn ig-toggle-btn" 
          onClick={() => {
            setIsOpen(true);
            setHasNewMessage(false); 
          }}
        >
          <MessageCircle size={24} />
          {hasNewMessage && <span className="notification-dot" />}
        </button>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="ig-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ig-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <h3 className="ig-modal-title">Hapus pesan?</h3>
              <p className="ig-modal-desc">
                Ini akan menghapus pesan untuk semua orang. Orang-orang mungkin sudah melihatnya.
              </p>
            </div>
            <button className="ig-modal-btn ig-modal-btn--danger" onClick={confirmDelete}>
              Hapus
            </button>
            <button className="ig-modal-btn ig-modal-btn--cancel" onClick={() => setDeleteTarget(null)}>
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}