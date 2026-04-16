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
    <div className="sidebar-left glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="panel-header" style={{ margin: 0, padding: 0, border: 'none' }}>Library</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <input 
            type="checkbox" 
            checked={showLabels} 
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Labels
        </label>
      </div>
      
      <div className="sidebar-content thin-scrollbar">
        <div className="section">
          {libraryItems.map(item => (
            <div 
              key={item.type}
              className="component-card"
              onClick={() => addComponent(item.type)}
            >
              <div style={{ color: 'var(--accent-color)' }}>{item.icon}</div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="panel-header" style={{ marginTop: '1rem', padding: '0.5rem 0' }}>Templates</h2>
        
        <div className="section">
          {templateItems.map(item => (
            <div 
              key={item.type}
              className="component-card"
              onClick={() => {
                if (window.confirm(`Loading ${item.name} will clear your current scene.`)) {
                  loadTemplate(item.type);
                }
              }}
            >
              <div style={{ color: 'var(--accent-color)' }}>{item.icon}</div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            © {new Date().getFullYear()} <strong>Dev Patel</strong>
          </p>
          <p style={{ fontSize: '0.6rem', color: 'var(--accent-color)', opacity: 0.7 }}>
            Suchna Tech & Solutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
