import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MathQuestPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/game" className="btn btn--ghost" style={{ color: '#fff', borderColor: '#444' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🔢 Math Quest</h2>
      </div>
      <iframe src="/math-quest/index.html" title="Math Quest" style={{ flex: 1, width: '100%', border: 'none' }} allowFullScreen />
    </div>
  );
}
