import React, { useEffect } from 'react';
import Viewport from './components/Viewport';
import useStore from './store/useStore';
import { Box, X } from 'lucide-react';

const Preview = () => {
  const { setCurrentDesign } = useStore();

  useEffect(() => {
    // Load state from localStorage for instant preview
    const tempState = localStorage.getItem('preview_state');
    if (tempState) {
      const data = JSON.parse(tempState);
      // We use setCurrentDesign to load into store, but we skip design ID
      setCurrentDesign(null, data);
    }
  }, [setCurrentDesign]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
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

      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }}>
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
