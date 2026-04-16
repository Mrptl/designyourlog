import React from 'react';
import useStore from '../store/useStore';
import { SlidersHorizontal, Trash2, Lock, Unlock } from 'lucide-react';

const Controls = () => {
  const { components, selectedComponentId, updateComponent, removeComponent, displayUnit, setDisplayUnit } = useStore();
  
  const selectedComponent = components.find(c => c.id === selectedComponentId);

  if (!selectedComponent) {
    return (
      <div className="sidebar-right glass">
        <h2 className="panel-header">Properties</h2>
        <div className="sidebar-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="controls-empty">
            <SlidersHorizontal size={48} strokeWidth={1} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select a component to edit.</p>
          </div>
        </div>
      </div>
    );
  }

  const toDisplay = (val) => displayUnit === 'mm' ? (val * 25.4).toFixed(1) : val.toString();
  const fromDisplay = (val) => displayUnit === 'mm' ? (parseFloat(val) || 0) / 25.4 : parseFloat(val) || 0;

  const handleChange = (field, index, value, convertUnit = true) => {
    if (selectedComponent.locked) return;
    const numValue = convertUnit ? fromDisplay(value) : (parseFloat(value) || 0);
    const newArray = [...selectedComponent[field]];
    newArray[index] = numValue;
    updateComponent(selectedComponent.id, { [field]: newArray });
  };

  return (
    <div className="sidebar-right glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="panel-header" style={{ margin: 0, padding: 0, border: 'none' }}>Edit {selectedComponent.type}</h2>
        
        <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-dark)', borderRadius: '6px', padding: '0.2rem' }}>
          <button 
            className="btn" 
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', border: 'none', background: displayUnit === 'inch' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: displayUnit === 'inch' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
            onClick={() => setDisplayUnit('inch')}
          >
            inch
          </button>
          <button 
            className="btn" 
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', border: 'none', background: displayUnit === 'mm' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: displayUnit === 'mm' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
            onClick={() => setDisplayUnit('mm')}
          >
            mm
          </button>
        </div>
      </div>
      
      <div className="sidebar-content thin-scrollbar">
        <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1, marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Dimensions [{displayUnit}]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="0.1" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.dimensions[0])} onChange={e => handleChange('dimensions', 0, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.1" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.dimensions[1])} onChange={e => handleChange('dimensions', 1, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.1" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.dimensions[2])} onChange={e => handleChange('dimensions', 2, e.target.value)} onFocus={() => useStore.getState().saveState()} />
          </div>
        </div>

        <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1, marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Position [{displayUnit}]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="0.5" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.position[0])} onChange={e => handleChange('position', 0, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.5" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.position[1])} onChange={e => handleChange('position', 1, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.5" className="input-field" disabled={selectedComponent.locked} value={toDisplay(selectedComponent.position[2])} onChange={e => handleChange('position', 2, e.target.value)} onFocus={() => useStore.getState().saveState()} />
          </div>
        </div>

        <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1, marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Rotation [deg]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="15" className="input-field" disabled={selectedComponent.locked} value={selectedComponent.rotation[0]} onChange={e => handleChange('rotation', 0, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="15" className="input-field" disabled={selectedComponent.locked} value={selectedComponent.rotation[1]} onChange={e => handleChange('rotation', 1, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="15" className="input-field" disabled={selectedComponent.locked} value={selectedComponent.rotation[2]} onChange={e => handleChange('rotation', 2, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button 
            className={`btn ${selectedComponent.locked ? 'btn-primary' : ''}`}
            style={{ flex: 1 }}
            onClick={() => {
              useStore.getState().saveState();
              updateComponent(selectedComponent.id, { locked: !selectedComponent.locked });
            }}
          >
            {selectedComponent.locked ? <Lock size={16} /> : <Unlock size={16} />}
            {selectedComponent.locked ? 'Locked' : 'Lock'}
          </button>
          
          <button 
            className="btn" 
            style={{ padding: '0.6rem', color: '#ef4444' }}
            onClick={() => !selectedComponent.locked && removeComponent(selectedComponent.id)}
            disabled={selectedComponent.locked}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
