import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const useStore = create((set, get) => ({
  components: [],
  selectedComponentId: null,
  designs: [],
  currentDesignId: null,
  displayUnit: 'inch', // 'inch' or 'mm'
  showLabels: true,
  
  // Auth State
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  // History
  history: [],
  future: [],

  // Export
  exportTrigger: null,
  triggerExport: (type) => set({ exportTrigger: { type, timestamp: Date.now() } }),
  clearExportTrigger: () => set({ exportTrigger: null }),

  setShowLabels: (show) => set({ showLabels: show }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),
  saveState: () => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))].slice(-30), // keep last 30 states
    future: []
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    return {
      components: previous,
      history: newHistory,
      future: [JSON.parse(JSON.stringify(state.components)), ...state.future],
      selectedComponentId: null
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      components: next,
      history: [...state.history, JSON.parse(JSON.stringify(state.components))],
      future: newFuture,
      selectedComponentId: null
    };
  }),
  
  // Auth Actions
  login: async (email, password) => {
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      const { user, token } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  },

  signup: async (username, email, password) => {
    try {
      const res = await axios.post('http://localhost:3001/api/auth/signup', { username, email, password });
      const { user, token } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Signup failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, components: [], designs: [], currentDesignId: null });
  },

  // Actions
  setShowLabels: (show) => set({ showLabels: show }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),
  addComponent: (type, position) => set((state) => {
    const defaultDims = type === 'plank' ? [10, 1, 2] : [2, 2, 2];
    const newComponent = {
      id: uuidv4(),
      type,
      position: position || [0, 0, 0],
      rotation: [0, 0, 0],
      dimensions: defaultDims,
      color: '#c2976b'
    };
    return { 
      history: [...state.history, JSON.parse(JSON.stringify(state.components))], future: [],
      components: [...state.components, newComponent], 
      selectedComponentId: newComponent.id 
    };
  }),
  
  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  
  removeComponent: (id) => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))], future: [],
    components: state.components.filter(c => c.id !== id),
    selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId
  })),
  
  selectComponent: (id) => set({ selectedComponentId: id }),
  
  // Database actions placeholder
  setDesigns: (designs) => set({ designs }),
  setCurrentDesign: (id, components) => set({ currentDesignId: id, components, selectedComponentId: null }),
  
  loadTemplate: (templateName) => set((state) => {
    const historyEntry = [...state.history, JSON.parse(JSON.stringify(state.components))];
    let newComponents = [];
    if (templateName === 'pallet') {
      // Basic 40x48 Pallet (units: inches roughly)
      const c = '#c2976b';
      newComponents = [
        // 3 Bottom Stringers (48x1x4)
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, -18], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, 0], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, 18], rotation: [0,0,0], color: c },
        // Top deck boards (40x1x4) across the stringers
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [-22, 4.5, 0], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [-11, 4.5, 0], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [0, 4.5, 0], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [11, 4.5, 0], rotation: [0,0,0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [22, 4.5, 0], rotation: [0,0,0], color: c }
      ];
    } else if (templateName === 'box') {
      const c = '#d1a87b';
      const w=20, h=20, d=20, t=1;
      newComponents = [
        { id: uuidv4(), type: 'plank', dimensions: [w, t, d], position: [0, t/2, 0], rotation: [0,0,0], color: c }, // Bottom
        { id: uuidv4(), type: 'plank', dimensions: [w, h, t], position: [0, h/2, -d/2+t/2], rotation: [0,0,0], color: c }, // Back
        { id: uuidv4(), type: 'plank', dimensions: [w, h, t], position: [0, h/2, d/2-t/2], rotation: [0,0,0], color: c }, // Front
        { id: uuidv4(), type: 'plank', dimensions: [t, h, d-t*2], position: [-w/2+t/2, h/2, 0], rotation: [0,0,0], color: c }, // Left
        { id: uuidv4(), type: 'plank', dimensions: [t, h, d-t*2], position: [w/2-t/2, h/2, 0], rotation: [0,0,0], color: c } // Right
      ];
    } else if (templateName === 'crate') {
      const c = '#cba37b';
      const w=30, h=24, d=20, t=0.5;
      newComponents = [
        { id: uuidv4(), type: 'plank', dimensions: [w, t, d], position: [0, t/2, 0], rotation: [0,0,0], color: c }, // Bottom Base
        // Sides made of slats
        ...[0,1,2,3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [w, 3, t], position: [0, 3 + i*6, -d/2+t/2], rotation: [0,0,0], color: c })), // Back Slats
        ...[0,1,2,3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [w, 3, t], position: [0, 3 + i*6, d/2-t/2], rotation: [0,0,0], color: c })), // Front Slats
        ...[0,1,2,3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [t, 3, d-t*2], position: [-w/2+t/2, 3 + i*6, 0], rotation: [0,0,0], color: c })), // Left Slats
        ...[0,1,2,3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [t, 3, d-t*2], position: [w/2-t/2, 3 + i*6, 0], rotation: [0,0,0], color: c })) // Right Slats
      ];
    }
    return { 
      history: historyEntry, future: [],
      components: newComponents, selectedComponentId: null, currentDesignId: null 
    };
  }),
  
  clearScene: () => set((state) => ({ 
    history: [...state.history, JSON.parse(JSON.stringify(state.components))], future: [],
    components: [], selectedComponentId: null 
  }))
}));

export default useStore;

