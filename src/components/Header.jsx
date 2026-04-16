import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Save, FolderOpen, Loader2, Undo2, Redo2, LogOut, User, ExternalLink, FileText, Shapes, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

const Header = () => {
  const { components, currentDesignId, setCurrentDesign, undo, redo, history, future, user, logout } = useStore();
  const [loading, setLoading] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [designs, setDesignsLocal] = useState([]);

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

  return (
    <div className="header glass">
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="panel-header" style={{ border: 'none', margin: 0 }}>Open Design</h2>
              <button className="btn" onClick={() => setShowLoadModal(false)} style={{ padding: '0.4rem' }}>
                <Undo2 size={16} /> 
              </button>
            </div>
            
            <div className="design-list thin-scrollbar">
              {designs.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No saved designs found.
                </p>
              ) : (
                designs.map(design => (
                  <div key={design.id} className="design-item" onClick={() => selectDesign(design)}>
                    <div className="design-info">
                      <h4>{design.name || 'Untitled Design'}</h4>
                      <p>{new Date(design.created_at).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" onClick={(e) => deleteDesign(e, design.id)} style={{ padding: '0.4rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <Trash2 size={16} />
                      </button>
                      <FolderOpen size={18} color="var(--accent-color)" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <button className="btn" onClick={undo} disabled={history.length === 0} title="Undo">
        <Undo2 size={16} />
      </button>
      <button className="btn" onClick={redo} disabled={future.length === 0} title="Redo">
        <Redo2 size={16} />
      </button>
      
      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

      <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
        {loading ? <Loader2 className="loader" size={16}/> : <Save size={16} />}
        Save
      </button>
      <button className="btn" onClick={handleLoad} disabled={loading}>
        <FolderOpen size={16} />
        Load
      </button>
      <button className="btn" onClick={() => useStore.getState().triggerExport('pdf')} title="Export Technical PDF Report">
        <FileText size={16} />
        PDF
      </button>
      <button className="btn" onClick={() => useStore.getState().triggerExport('3d')} title="Export 3D Model (GLTF)">
        <Shapes size={16} />
        3D
      </button>

      <button className="btn" onClick={() => {
        localStorage.setItem('preview_state', JSON.stringify(components));
        window.open('/preview', '_blank');
      }} title="Open read-only preview in new tab">
        <ExternalLink size={16} />
        Preview
      </button>

      {user && (
        <div className="user-tag">
          <User size={16} />
          <span className="username">{user.user_metadata?.username || user.email.split('@')[0]}</span>
          <button className="btn" onClick={logout} title="Logout" style={{ padding: '0.4rem', borderRadius: '50%', background: 'transparent', border: 'none' }}>
            <LogOut size={16} color="#f87171" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;

