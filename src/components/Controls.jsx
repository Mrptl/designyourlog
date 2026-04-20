import React from 'react';
import useStore from '../store/useStore';
import { SlidersHorizontal, Trash2, Lock, Unlock, Copy, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight } from 'lucide-react';

const Controls = () => {
  const { components, selectedComponentIds, updateComponent, updateMultiple, removeComponent, removeMultiple, duplicateComponent, duplicateMultiple, displayUnit, setDisplayUnit, nudgeSelected } = useStore();

  if (selectedComponentIds.length === 0) {
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

  const selectedComponents = components.filter(c => selectedComponentIds.includes(c.id));
  const isMulti = selectedComponents.length > 1;
  const firstComp = selectedComponents[0];
  const formatTypeLabel = (type) => type.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  const toDisplay = (val) => displayUnit === 'mm' ? (val * 25.4).toFixed(1) : val.toString();
  const fromDisplay = (val) => displayUnit === 'mm' ? (parseFloat(val) || 0) / 25.4 : parseFloat(val) || 0;

  const handleChange = (field, index, value, convertUnit = true) => {
    const numValue = convertUnit ? fromDisplay(value) : (parseFloat(value) || 0);

    if (isMulti) {
      const unlockedIds = selectedComponents.filter(c => !c.locked).map(c => c.id);
      if (unlockedIds.length === 0) return;

      if (field === 'position') {
        // Relative offset for multi position
        nudgeSelected(numValue, 0, 0);
      } else {
        // Absolute for dims/rot
        selectedComponents.forEach(comp => {
          if (!comp.locked) {
            const newArray = [...comp[field]];
            newArray[index] = numValue;
            updateComponent(comp.id, { [field]: newArray });
          }
        });
      }
    } else {
      if (firstComp.locked) return;
      const newArray = [...firstComp[field]];
      newArray[index] = numValue;
      updateComponent(firstComp.id, { [field]: newArray });
    }
  };

  const getAveragePosition = () => {
    const unlockedSelected = selectedComponents.filter(c => !c.locked);
    if (unlockedSelected.length === 0) return [0, 0, 0];
    const sumX = unlockedSelected.reduce((sum, c) => sum + c.position[0], 0);
    const sumY = unlockedSelected.reduce((sum, c) => sum + c.position[1], 0);
    const sumZ = unlockedSelected.reduce((sum, c) => sum + c.position[2], 0);
    return [
      (sumX / unlockedSelected.length),
      (sumY / unlockedSelected.length),
      (sumZ / unlockedSelected.length)
    ];
  };

  const avgPos = getAveragePosition();

  const isAllLocked = selectedComponents.every(c => c.locked);

  return (
    <div className="sidebar-right glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="panel-header" style={{ margin: 0, padding: 0, border: 'none' }}>
          {isMulti ? `${selectedComponents.length} Selected` : `Edit ${formatTypeLabel(firstComp.type)}`}
        </h2>

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
        {isAllLocked && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#d97706'
          }}>
            🔒 All selected components are locked. <strong>Click "Unlock All" below to edit.</strong>
          </div>
        )}
        <div className="form-group" style={{ opacity: isAllLocked ? 0.5 : 1, marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Dimensions [{displayUnit}]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="0.1" className="input-field" disabled={isAllLocked} value={toDisplay(firstComp.dimensions[0])} onChange={e => handleChange('dimensions', 0, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.1" className="input-field" disabled={isAllLocked} value={toDisplay(firstComp.dimensions[1])} onChange={e => handleChange('dimensions', 1, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.1" className="input-field" disabled={isAllLocked} value={toDisplay(firstComp.dimensions[2])} onChange={e => handleChange('dimensions', 2, e.target.value)} onFocus={() => useStore.getState().saveState()} />
          </div>
        </div>

        <div className="form-group" style={{ opacity: isAllLocked ? 0.5 : 1, marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Position [{displayUnit}]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="0.5" className="input-field" disabled={isAllLocked} placeholder={isMulti ? "Avg" : ""} value={isMulti ? toDisplay(avgPos[0]) : toDisplay(firstComp.position[0])} onChange={e => handleChange('position', 0, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.5" className="input-field" disabled={isAllLocked} placeholder={isMulti ? "Avg" : ""} value={isMulti ? toDisplay(avgPos[1]) : toDisplay(firstComp.position[1])} onChange={e => handleChange('position', 1, e.target.value)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="0.5" className="input-field" disabled={isAllLocked} placeholder={isMulti ? "Avg" : ""} value={isMulti ? toDisplay(avgPos[2]) : toDisplay(firstComp.position[2])} onChange={e => handleChange('position', 2, e.target.value)} onFocus={() => useStore.getState().saveState()} />
          </div>
          {isMulti && <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>* Avg pos (relative offset for group move)</p>}
        </div>

        <div className="form-group" style={{ opacity: isAllLocked ? 0.5 : 1, marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Rotation [deg]</label>
          <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" step="15" className="input-field" disabled={isAllLocked} value={firstComp.rotation[0]} onChange={e => handleChange('rotation', 0, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="15" className="input-field" disabled={isAllLocked} value={firstComp.rotation[1]} onChange={e => handleChange('rotation', 1, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
            <input type="number" step="15" className="input-field" disabled={isAllLocked} value={firstComp.rotation[2]} onChange={e => handleChange('rotation', 2, e.target.value, false)} onFocus={() => useStore.getState().saveState()} />
          </div>
        </div>

        {/* Nudge Buttons for Multi */}
        {isMulti && (
          <div className="form-group" style={{ opacity: isAllLocked ? 0.5 : 1, marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Nudge Group [{displayUnit}]</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(0, fromDisplay(1), 0)} title="Up (+Y)" disabled={isAllLocked}>
                  <ArrowUp size={12} />
                </button>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(0, fromDisplay(-1), 0)} title="Down (-Y)" disabled={isAllLocked}>
                  <ArrowDown size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(fromDisplay(1), 0, 0)} title="Right (+X)" disabled={isAllLocked}>
                  <ArrowRight size={12} />
                </button>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(fromDisplay(-1), 0, 0)} title="Left (-X)" disabled={isAllLocked}>
                  <ArrowLeft size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(0, 0, fromDisplay(1))} title="Back (+Z)" disabled={isAllLocked}>
                  <CornerUpRight size={12} />
                </button>
                <button className="btn" style={{ padding: '0.25rem' }} onClick={() => nudgeSelected(0, 0, fromDisplay(-1))} title="Front (-Z)" disabled={isAllLocked}>
                  <CornerUpLeft size={12} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: 'center' }}>±1 {displayUnit}</p>
          </div>
        )}

        <div className="control-actions">
          <button
            className={`btn ${isAllLocked ? 'btn-primary' : ''}`}
            style={{ minWidth: 0 }}
            onClick={() => {
              useStore.getState().saveState();
              updateMultiple(selectedComponentIds, { locked: !isAllLocked });
            }}
          >
            {isAllLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isAllLocked ? 'Unlock All' : 'Lock All'}
          </button>

          <button
            className="btn"
            style={{ minWidth: 0 }}
            onClick={() => isMulti ? duplicateMultiple(selectedComponentIds) : duplicateComponent(firstComp.id)}
          >
            <Copy size={16} />
            {isMulti ? 'Dup All' : 'Duplicate'}
          </button>

          <button
            className="btn control-delete-btn"
            style={{ color: '#ef4444' }}
            onClick={() => isMulti ? removeMultiple(selectedComponentIds) : removeComponent(firstComp.id)}
          >
            <Trash2 size={16} />
            {isMulti ? 'Delete All' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
