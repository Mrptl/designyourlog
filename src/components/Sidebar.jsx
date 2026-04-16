import React from 'react';
import useStore from '../store/useStore';
import { Box, Columns, Layers, Package, Archive } from 'lucide-react';

const Sidebar = () => {
  const addComponent = useStore(state => state.addComponent);
  const loadTemplate = useStore(state => state.loadTemplate);
  const showLabels = useStore(state => state.showLabels);
  const setShowLabels = useStore(state => state.setShowLabels);

  const libraryItems = [
    { type: 'plank', name: 'Wooden Plank', icon: <Columns size={32} strokeWidth={1.5} />, desc: 'Standard structural piece' },
    { type: 'block', name: 'Support Block', icon: <Box size={32} strokeWidth={1.5} />, desc: 'Base support blocks' }
  ];

  const templateItems = [
    { type: 'pallet', name: 'Standard Pallet', icon: <Layers size={32} strokeWidth={1.5} />, desc: 'Basic 48x40 wooden pallet' },
    { type: 'box', name: 'Simple Box', icon: <Package size={32} strokeWidth={1.5} />, desc: 'Enclosed 20x20x20 container' },
    { type: 'crate', name: 'Slatted Crate', icon: <Archive size={32} strokeWidth={1.5} />, desc: 'Open 30x24x20 shipping crate' }
  ];

  return (
    <div className="sidebar-left glass" style={{ overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 className="panel-header" style={{ margin: 0, border: 'none' }}>Library</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <input 
            type="checkbox" 
            checked={showLabels} 
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Labels
        </label>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {libraryItems.map(item => (
          <div 
            key={item.type}
            className="component-card"
            onClick={() => addComponent(item.type)}
            title="Click to add to center"
          >
            <div style={{ color: 'var(--accent-color)' }}>
              {item.icon}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.name}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <h2 className="panel-header">Ready-Made Templates</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {templateItems.map(item => (
          <div 
            key={item.type}
            className="component-card"
            onClick={() => {
              if (window.confirm(`Loading the ${item.name} template will clear your current scene. Continue?`)) {
                loadTemplate(item.type);
              }
            }}
            title="Click to load template (replaces scene)"
          >
            <div style={{ color: 'var(--accent-color)' }}>
              {item.icon}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.name}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Click a component to add it to the scene, then drag it in 3D space to position.
        </p>
        
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8, textAlign: 'center' }}>
            © {new Date().getFullYear()} All Copyrights Reserved by <strong>Dev Patel</strong>
          </p>
          <p style={{ fontSize: '0.65rem', color: 'var(--accent-color)', opacity: 0.7, textAlign: 'center', marginTop: '0.25rem' }}>
            Designed & Developed by <strong>Suchna Tech & Solutions</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
