import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useStore from '../store/useStore';
import { Save, FolderOpen, Loader2, Undo2, Redo2, LogOut, User, ExternalLink, FileText, Shapes, Trash2, X, Copy, CheckSquare, Layers } from 'lucide-react';
import { supabase } from '../supabase';

const Header = () => {
  const { components, currentDesignId, setCurrentDesign, undo, redo, history, future, user, logout } = useStore();
  const [loading, setLoading] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [designs, setDesignsLocal] = useState([]);
  const [selectedDesignIds, setSelectedDesignIds] = useState([]);



  const handleAssemble = async () => {
    if (selectedDesignIds.length === 0) {
      alert('Select designs to assemble');
      return;
    }

    const result = await useStore.getState().assembleDesigns(selectedDesignIds);
    if (result.success) {
      alert(`Assembled ${result.assembledCount} parts (total: ${result.total})`);
      setShowLoadModal(false);
      setSelectedDesignIds([]);
    } else {
      alert(`Assemble failed: ${result.error}`);
    }
  };
  const structureCountLabel = `${components.length} ${components.length === 1 ? 'part' : 'parts'}`;
  const accountName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Workspace';

  const handleSave = async () => {
    if (components.length === 0) return alert('Add components before saving.');

    const designName = prompt('Enter a name for your design:', currentDesignId ? '' : `Design ${new Date().toLocaleDateString()}`);
    if (designName === null) return;

    setLoading(true);
    const result = await useStore.getState().saveDesign(designName);

    if (result.success) {
      alert('Design saved successfully!');
    } else {
      alert(`Failed to save: ${result.error}`);
    }
    setLoading(false);
  };

  const handleLoad = async () => {
    setLoading(true);
    const result = await useStore.getState().fetchDesigns();
    if (result.success) {
      setDesignsLocal(result.data);
      setShowLoadModal(true);
    } else {
      alert('Failed to fetch designs');
    }
    setLoading(false);
  };

  const selectDesign = (design) => {
    useStore.getState().saveState();
    setCurrentDesign(design.id, design.structure_data);
    setShowLoadModal(false);
  };

  const deleteDesign = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this design?')) return;

    try {
      const { error } = await supabase.from('designs').delete().eq('id', id);
      if (error) throw error;

      setDesignsLocal(designs.filter(d => d.id !== id));
      if (currentDesignId === id) {
        setCurrentDesign(null, []);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete design');
    }
  };

  const loadModal = showLoadModal ? createPortal(
    <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
      <div className="modal-content load-modal glass" onClick={e => e.stopPropagation()}>
        <div className="load-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="panel-header" style={{ border: 'none', margin: 0, padding: 0 }}>Open & Assemble Designs</h2>
            <p className="load-modal-subtitle" style={{ margin: 0 }}>Click to load (replace), checkbox + Assemble for multi-merge.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {selectedDesignIds.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleAssemble}
                style={{ padding: '0.4rem 0.8rem' }}
              >
                <Layers size={16} />
                Assemble ({selectedDesignIds.length})
              </button>
            )}
            <button
              className="btn"
              onClick={() => setShowLoadModal(false)}
              style={{ padding: '0.4rem' }}
              aria-label="Close saved designs"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="design-list thin-scrollbar">
          {designs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No saved designs found.
            </p>
          ) : (
            designs.map((design) => {
              const savedAt = new Date(design.updated_at || design.created_at).toLocaleString();
              const partCount = Array.isArray(design.structure_data) ? design.structure_data.length : 0;

              return (
                <div key={design.id} className="design-item" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={selectedDesignIds.includes(design.id)}
                      onChange={() => {
                        if (selectedDesignIds.includes(design.id)) {
                          setSelectedDesignIds(prev => prev.filter(id => id !== design.id));
                        } else {
                          setSelectedDesignIds(prev => [...prev, design.id]);
                        }
                      }}

                      onClick={(event) => event.stopPropagation()}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />

                  </div>
                  <div className="design-info" onClick={() => selectDesign(design)} style={{ flex: 1 }}>
                    <h4>{design.name || 'Untitled Design'}</h4>
                    <p>Saved {savedAt}</p>
                  </div>
                  <div className="design-item-meta">
                    <span className="design-badge">{partCount} {partCount === 1 ? 'part' : 'parts'}</span>
                    <button
                      className="btn"
                      onClick={(e) => deleteDesign(e, design.id)}
                      style={{ padding: '0.4rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      aria-label={`Delete ${design.name || 'saved design'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="btn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const result = await useStore.getState().duplicateDesign(design.id);
                        if (result.success) {
                          alert('Design duplicated successfully!');
                          // List auto-refreshes via store
                        } else {
                          alert(`Duplicate failed: ${result.error}`);
                        }
                      }}
                      style={{ padding: '0.4rem', color: 'var(--accent-color)' }}
                      title="Duplicate this design"
                    >
                      <Copy size={16} />
                    </button>
                    <FolderOpen size={18} color="var(--accent-color)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div className="header glass">
        <button className="btn" onClick={undo} disabled={history.length === 0} title="Undo">
          <Undo2 size={16} />
        </button>
        <button className="btn" onClick={redo} disabled={future.length === 0} title="Redo">
          <Redo2 size={16} />
        </button>

        <div className="header-divider"></div>

        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="loader" size={16} /> : <Save size={16} />}
          <span className="btn-label">Save</span>
        </button>
        <button className="btn" onClick={handleLoad} disabled={loading}>
          <FolderOpen size={16} />
          <span className="btn-label">Load</span>
        </button>
        <button className="btn" onClick={() => useStore.getState().triggerExport('pdf')} title="Export Technical PDF Report">
          <FileText size={16} />
          <span className="btn-label">PDF</span>
        </button>
        <button className="btn" onClick={() => useStore.getState().triggerExport('3d')} title="Export 3D Model (GLTF)">
          <Shapes size={16} />
          <span className="btn-label">3D</span>
        </button>

        <button className="btn" onClick={() => {
          localStorage.setItem('preview_state', JSON.stringify(components));
          window.open('/preview', '_blank');
        }} title="Open read-only preview in new tab">
          <ExternalLink size={16} />
          <span className="btn-label">Preview</span>
        </button>

        <div className="header-spacer"></div>

        <div className="header-status" aria-label={`Canvas contains ${structureCountLabel}`}>
          <span className="header-status-label">Canvas</span>
          <span className="header-status-value">{structureCountLabel}</span>
        </div>

        {user && (
          <div className="header-account">
            <div className="header-account-icon">
              <User size={18} />
            </div>
            <div className="header-account-copy">
              <span className="header-account-label">Workspace</span>
              <span className="username">{accountName}</span>
            </div>
            <button className="btn logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
      {loadModal}
    </>
  );
};

export default Header;
