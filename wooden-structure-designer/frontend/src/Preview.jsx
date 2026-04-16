import React, { useEffect, useState } from 'react';
import Viewport from './components/Viewport';
import useStore from './store/useStore';
import { Box, X, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const Preview = () => {
  const { setCurrentDesign, components } = useStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    // 1. Try to load from URL hash first (shared links)
    const hash = window.location.hash.substring(1);
    if (hash) {
      try {
        const data = JSON.parse(atob(hash));
        setCurrentDesign(null, data);
        setShareUrl(window.location.href);
        return;
      } catch (e) {
        console.error("Failed to parse shared link data", e);
      }
    }

    // 2. Fallback to localStorage (local preview)
    const tempState = localStorage.getItem('preview_state');
    if (tempState) {
      const data = JSON.parse(tempState);
      setCurrentDesign(null, data);
      
      // Update hash so the URL becomes shareable
      try {
        const encoded = btoa(JSON.stringify(data));
        const newUrl = `${window.location.origin}${window.location.pathname}#${encoded}`;
        setShareUrl(newUrl);
        // We don't change window.location.hash here to avoid triggering effects, 
        // but we prepare the shareUrl for the modal.
      } catch(err) {
        setShareUrl(window.location.href);
      }
    }
  }, [setCurrentDesign]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', alignItems: 'center' }}>
            <h2 className="panel-header" style={{ border: 'none', width: '100%' }}>Share Design</h2>
            
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', margin: '1.5rem 0' }}>
              <QRCodeCanvas value={shareUrl} size={200} level="M" />
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Scan this QR code to view on mobile or copy the link below.
            </p>

            <div style={{ 
              width: '100%', 
              background: 'rgba(0,0,0,0.3)', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem'
            }}>
              <input 
                readOnly 
                value={shareUrl} 
                style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, fontSize: '0.75rem' }} 
              />
              <button className="btn" onClick={handleCopyLink} style={{ padding: '0.4rem', background: copied ? 'var(--accent-color)' : '' }}>
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => setShowShareModal(false)} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="glass" style={{ 
        position: 'absolute', 
        top: '2rem', 
        left: '2rem', 
        zIndex: 100, 
        padding: '0.75rem 1.5rem', 
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <Box size={20} color="var(--accent-color)" />
        <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>3D Preview Mode</h2>
        <div style={{ width: '1px', background: 'var(--border-color)', height: '20px' }}></div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View-only mode</p>
      </div>

      {/* Action Buttons */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100, display: 'flex', gap: '0.75rem' }}>
        <button 
          className="btn glass" 
          onClick={() => setShowShareModal(true)}
          style={{ padding: '0.5rem 1rem', borderRadius: '9999px' }}
        >
          <Share2 size={18} />
          Share
        </button>
        <button 
          className="btn glass" 
          onClick={() => window.close()} 
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
        >
          <X size={20} />
        </button>
      </div>

      <Viewport readOnly={true} />

      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 100,
        textAlign: 'center',
        background: 'rgba(0,0,0,0.5)',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)'
      }}>
         <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          © All Copyrights Reserved by Dev Patel | Developed by Suchna Tech & Solutions
         </p>
      </div>
    </div>
  );
};

export default Preview;
