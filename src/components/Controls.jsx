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
        <div className="controls-empty">
          <SlidersHorizontal size={48} strokeWidth={1} style={{ opacity: 0.5 }} />
          <p>Select a component in the 3D viewport to edit its properties.</p>
        </div>
      </div>
    );
  }

  // Conversion helper: State is stored in INCHES.
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 className="panel-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Edit {selectedComponent.type}</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-dark)', borderRadius: '4px', padding: '0.2rem' }}>
          <button 
            className="btn" 
            style={{ padding: '0.2rem 0.5rem', border: 'none', background: displayUnit === 'inch' ? 'var(--bg-hover)' : 'transparent', color: displayUnit === 'inch' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
            onClick={() => setDisplayUnit('inch')}
          >
            inch
          </button>
          <button 
            className="btn" 
            style={{ padding: '0.2rem 0.5rem', border: 'none', background: displayUnit === 'mm' ? 'var(--bg-hover)' : 'transparent', color: displayUnit === 'mm' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
            onClick={() => setDisplayUnit('mm')}
          >
            mm
          </button>
        </div>
      </div>
      
      <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1 }}>
        <label>Dimensions (W, H, D) - [{displayUnit}]</label>
        <div className="input-row">
          <input type="number" step="0.1" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.dimensions[0])} 
                 onChange={e => handleChange('dimensions', 0, e.target.value)} 
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.1" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.dimensions[1])} 
                 onChange={e => handleChange('dimensions', 1, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.1" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.dimensions[2])} 
                 onChange={e => handleChange('dimensions', 2, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>

      <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1 }}>
        <label>Position (X, Y, Z) - [{displayUnit}]</label>
        <div className="input-row">
          <input type="number" step="0.5" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.position[0])} 
                 onChange={e => handleChange('position', 0, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.5" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.position[1])} 
                 onChange={e => handleChange('position', 1, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.5" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={toDisplay(selectedComponent.position[2])} 
                 onChange={e => handleChange('position', 2, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>

      <div className="form-group" style={{ opacity: selectedComponent.locked ? 0.5 : 1 }}>
        <label>Rotation (X, Y, Z) - [degrees]</label>
        <div className="input-row">
          <input type="number" step="15" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={selectedComponent.rotation[0]} 
                 onChange={e => handleChange('rotation', 0, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="15" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={selectedComponent.rotation[1]} 
                 onChange={e => handleChange('rotation', 1, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="15" className="input-field" 
                 disabled={selectedComponent.locked}
                 value={selectedComponent.rotation[2]} 
                 onChange={e => handleChange('rotation', 2, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>
      
      <div className="form-group" style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
        <button 
          className={`btn ${selectedComponent.locked ? 'btn-primary' : ''}`}
          style={{ flex: 1, borderColor: selectedComponent.locked ? 'var(--accent-color)' : 'var(--border-color)' }}
          onClick={() => {
            useStore.getState().saveState();
            updateComponent(selectedComponent.id, { locked: !selectedComponent.locked });
          }}
        >
          {selectedComponent.locked ? <Lock size={16} /> : <Unlock size={16} />}
          {selectedComponent.locked ? 'Locked' : 'Lock Item'}
        </button>
        
        <button 
          className="btn" 
          style={{ padding: '0.6rem', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          onClick={() => !selectedComponent.locked && removeComponent(selectedComponent.id)}
          disabled={selectedComponent.locked}
          title={selectedComponent.locked ? "Unlock to delete" : "Delete Component"}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
