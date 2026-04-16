import React from 'react';
import useStore from '../store/useStore';
import { SlidersHorizontal, Trash2 } from 'lucide-react';

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
  // When displaying in mm, multiply by 25.4. When saving from mm, divide by 25.4.
  const toDisplay = (val) => displayUnit === 'mm' ? (val * 25.4).toFixed(1) : val.toString();
  const fromDisplay = (val) => displayUnit === 'mm' ? (parseFloat(val) || 0) / 25.4 : parseFloat(val) || 0;

  const handleChange = (field, index, value, convertUnit = true) => {
    const numValue = convertUnit ? fromDisplay(value) : (parseFloat(value) || 0);
    const newArray = [...selectedComponent[field]];
    newArray[index] = numValue;
    updateComponent(selectedComponent.id, { [field]: newArray });
  };

  return (
    <div className="sidebar-right glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 className="panel-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Edit {selectedComponent.type}</h2>
        
        {/* Unit Toggle */}
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
      
      <div className="form-group">
        <label>Dimensions (W, H, D) - [{displayUnit}]</label>
        <div className="input-row">
          <input type="number" step="0.1" className="input-field" 
                 value={toDisplay(selectedComponent.dimensions[0])} 
                 onChange={e => handleChange('dimensions', 0, e.target.value)} 
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.1" className="input-field" 
                 value={toDisplay(selectedComponent.dimensions[1])} 
                 onChange={e => handleChange('dimensions', 1, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.1" className="input-field" 
                 value={toDisplay(selectedComponent.dimensions[2])} 
                 onChange={e => handleChange('dimensions', 2, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>

      <div className="form-group">
        <label>Position (X, Y, Z) - [{displayUnit}]</label>
        <div className="input-row">
          <input type="number" step="0.5" className="input-field" 
                 value={toDisplay(selectedComponent.position[0])} 
                 onChange={e => handleChange('position', 0, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.5" className="input-field" 
                 value={toDisplay(selectedComponent.position[1])} 
                 onChange={e => handleChange('position', 1, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="0.5" className="input-field" 
                 value={toDisplay(selectedComponent.position[2])} 
                 onChange={e => handleChange('position', 2, e.target.value)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>

      <div className="form-group">
        <label>Rotation (X, Y, Z) - [degrees]</label>
        <div className="input-row">
          <input type="number" step="15" className="input-field" 
                 value={selectedComponent.rotation[0]} 
                 onChange={e => handleChange('rotation', 0, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="15" className="input-field" 
                 value={selectedComponent.rotation[1]} 
                 onChange={e => handleChange('rotation', 1, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
          <input type="number" step="15" className="input-field" 
                 value={selectedComponent.rotation[2]} 
                 onChange={e => handleChange('rotation', 2, e.target.value, false)}
                 onFocus={() => useStore.getState().saveState()} />
        </div>
      </div>
      
      <div className="form-group" style={{ marginTop: 'auto' }}>
        <button 
          className="btn" 
          style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          onClick={() => removeComponent(selectedComponent.id)}
        >
          <Trash2 size={16} />
          Delete Component
        </button>
      </div>
    </div>
  );
};

export default Controls;
