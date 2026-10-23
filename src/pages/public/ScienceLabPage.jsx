import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScienceLabPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar Navigasi */}
      <div style={{ padding: '12px 20px', background: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link 
          to="/game" 
          className="btn btn--ghost" 
          style={{ color: '#fff', borderColor: '#444' }}
          onClick={() => {
            // Paksa keluar dari mode layar penuh jika game memicunya
            if (document.fullscreenElement) document.exitFullscreen();
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Game Hub
        </Link>
        
        <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px' }}>
          🔬 SCIENCE LAB: The Lost Energy Core
        </h2>
        
        <div style={{ width: '150px' }}></div> {/* Spacer agar judul di tengah */}
      </div>

      {/* Iframe Game */}
      <iframe 
        src="/science-lab/index.html" 
        title="Science Lab Game"
        style={{ flex: 1, width: '100%', border: 'none', background: '#000' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}