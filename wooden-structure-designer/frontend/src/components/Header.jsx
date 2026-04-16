import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Save, Download, FolderOpen, Loader2, Undo2, Redo2, LogOut, User, ExternalLink, FileText, Shapes } from 'lucide-react';
import axios from 'axios';

const Header = () => {
  const { components, currentDesignId, setCurrentDesign, setDesigns, undo, redo, history, future, user, token, logout } = useStore();
  const [loading, setLoading] = useState(false);

  // Helper for authorized requests
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Handle unauthorized/expired token
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  const handleSave = async () => {
    if (components.length === 0) return alert('Add components before saving.');
    
    setLoading(true);
    try {
      const designData = {
        name: `Design ${new Date().toLocaleDateString()}`,
        structure_data: components
      };

      if (currentDesignId) {
        await api.put(`/designs/${currentDesignId}`, designData);
        alert('Design updated successfully!');
      } else {
        const res = await api.post('/designs', designData);
        setCurrentDesign(res.data.data.id, components);
        alert('Design saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await api.get('/designs');
      const latest = res.data.data[0];
      if (latest) {
        useStore.getState().saveState();
        setCurrentDesign(latest.id, latest.structure_data);
      } else {
        alert('No saved designs found.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="header glass">
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
          <span className="username">{user.username}</span>
          <button className="btn" onClick={logout} title="Logout" style={{ padding: '0.4rem', borderRadius: '50%', background: 'transparent', border: 'none' }}>
            <LogOut size={16} color="#f87171" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;

