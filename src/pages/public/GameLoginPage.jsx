import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Gamepad2, User, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function GameLoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || '/game';

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const formatEmail = (playerName) => {
    const cleanName = playerName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}@player.wh`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !password) return toast.error('Nama dan Password wajib diisi.');
    if (name.trim().length < 3) return toast.error('Nama minimal 3 karakter.');
    if (password.length < 6) return toast.error('Password minimal 6 karakter.');

    setBusy(true);
    const email = formatEmail(name);

    if (mode === 'register') {
      const { data: isTaken, error: rpcError } = await supabase.rpc('is_username_taken', { 
        username: name.trim() 
      });

      if (rpcError) {
        setBusy(false);
        return toast.error('Terjadi kesalahan sistem. Coba lagi.');
      }

      if (isTaken) {
        setBusy(false);
        return toast.error('Nama ini sudah pernah dipakai. Silakan gunakan nama lain atau login jika ini akun Anda.', 6000);
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() } },
      });

      if (error) {
        setBusy(false);
        if (error.message.includes('already registered')) {
          return toast.error('Nama ini sudah terdaftar. Silakan masuk.');
        }
        return toast.error(error.message);
      }
      toast.success('Akun berhasil dibuat! Selamat bermain.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setBusy(false);
        return toast.error('Nama atau Password salah.');
      }
      toast.success('Berhasil masuk!');
    }
    
    setBusy(false);
  }

  return (
    <div className="game-login-wrapper">
      
      {/* ANIMASI BACKGROUND AMBIENT PS2 */}
      <div className="ps2-ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="game-login-card">
        <div className="game-login-header">
          <div className="game-login-icon">
            <Gamepad2 size={32} />
          </div>
          <h1>WH GAME HUB</h1>
          <p>Masuk untuk menyimpan skor dan bersaing di papan peringkat.</p>
        </div>

        <div className="game-login-tabs">
          <button 
            type="button" 
            className={mode === 'login' ? 'is-active' : ''} 
            onClick={() => setMode('login')}
          >
            Masuk
          </button>
          <button 
            type="button" 
            className={mode === 'register' ? 'is-active' : ''} 
            onClick={() => setMode('register')}
          >
            Buat Akun
          </button>
        </div>

        <form onSubmit={handleSubmit} className="game-login-form">
          <label className="field">
            <span>Nama Panggilan</span>
            <div className="input-with-icon">
              <User size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad"
                required
                maxLength={20}
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-with-icon">
              <KeyRound size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
          </label>

          <button type="submit" className="btn btn--primary game-login-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : (mode === 'login' ? 'Masuk & Main' : 'Daftar & Main')}
          </button>
        </form>

        <p className="game-login-footer">
          Nama ini otomatis dipakai di semua game.
        </p>
      </div>
    </div>
  );
}