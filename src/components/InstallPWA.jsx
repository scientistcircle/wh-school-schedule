import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.jsx';

export default function InstallPWA() {
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi SUDAH terinstall (mode standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true; 
      
    if (isStandalone) return; // Jika sudah install, jangan munculkan dialog

    // 2. Deteksi iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Tangkap event install dari browser
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Tampilkan modal setiap kali web dibuka (setelah 3 detik)
    const timer = setTimeout(() => setShowModal(true), 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Jika browser memblokir prompt otomatis (karena user pernah menolak)
      toast.info('Silakan install manual melalui menu browser (titik tiga > Install App/Tambahkan ke Layar Utama).', 6000);
      setShowModal(false);
      return;
    }
    
    // Tampilkan prompt install bawaan browser
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowModal(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowModal(false);
    // Kita hapus localStorage. Jadi saat web di-refresh, dialog akan muncul lagi.
  };

  if (!showModal) return null;

  return (
    <div className="install-overlay" onClick={handleClose}>
      <div className="install-modal" onClick={(e) => e.stopPropagation()}>
        <button className="install-close" onClick={handleClose} aria-label="Tutup">
          <X size={20} />
        </button>

        <div className="install-icon-wrap">
          <img src="/logo.png" alt="Logo" className="install-logo" />
        </div>

        <h2 className="install-title">Install WH School Schedule</h2>
        <p className="install-desc">
          Pasang aplikasi ini di perangkat Anda untuk akses lebih cepat dan dapat dibuka layaknya aplikasi biasa.
        </p>

        {isIOS ? (
          <div className="install-ios-guide">
            <p>Untuk menginstall di iPhone/iPad:</p>
            <ol>
              <li>Ketuk tombol <strong>Share</strong> <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> di bawah.</li>
              <li>Pilih <strong>Tambahkan ke Layar Utama</strong> (Add to Home Screen).</li>
            </ol>
            <button className="btn btn--primary" onClick={handleClose} style={{ width: '100%', marginTop: '16px' }}>
              Mengerti
            </button>
          </div>
        ) : (
          <div className="install-actions">
            <button className="btn btn--ghost" onClick={handleClose}>
              Nanti Saja
            </button>
            <button className="btn btn--primary" onClick={handleInstallClick}>
              <Download size={16} /> Install Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}