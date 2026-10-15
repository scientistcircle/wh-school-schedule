import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function LoginPage() {
  const { session, isAdmin, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/admin';

  if (session && isAdmin) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      toast.error(`Login gagal: ${error.message}`);
      return;
    }
    toast.success('Login berhasil.');
    // Session & profile akan terisi via AuthContext, lalu Navigate di atas memindahkan.
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="brand__mark">WH</span>
          <div>
            <strong>WH SCHOOL SCHEDULE</strong>
            <span className="muted">Panel Admin</span>
          </div>
        </div>

        <h1 className="login-title">Masuk</h1>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>

        <p className="muted login-help">
          Akun admin dibuat oleh pemilik sistem. Tidak ada pendaftaran publik.
        </p>
      </form>
    </div>
  );
}