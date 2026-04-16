import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';

const useStore = create((set, get) => ({
  components: [],
  selectedComponentId: null,
  designs: [],
  currentDesignId: null,
  displayUnit: 'inch', // 'inch' or 'mm'
  showLabels: true,
  
  // Auth State
  user: null,
  session: null,
  isAuthReady: false,

  // Initialize session
  initAuth: async () => {
    // 1. Check current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // 2. Load draft from localStorage if it exists
    const savedDraft = localStorage.getItem('wooden_structure_draft');
    const components = savedDraft ? JSON.parse(savedDraft) : [];
    
    set({ 
      session, 
      user: session?.user || null, 
      isAuthReady: true,
      components: components.length > 0 ? components : get().components
    });

    // 3. Listen for session changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null, isAuthReady: true });
    });

    // 4. Persistence: Save components to localStorage whenever they change
    useStore.subscribe(
      (state) => state.components,
      (components) => {
        if (components) {
          localStorage.setItem('wooden_structure_draft', JSON.stringify(components));
        }
      }
    );
  },

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  signup: async (username, email, password) => {
    // Note: Supabase uses email for login. Handle username in metadata.
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { username } }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, components: [], designs: [], currentDesignId: null });
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
      color: '#c2976b',
      locked: false
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
  
  // Database actions
  setDesigns: (designs) => set({ designs }),
  setCurrentDesign: (id, components) => set({ 
    currentDesignId: id, 
    components: components || [], 
    selectedComponentId: null 
  }),

  fetchDesigns: async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Fetch error:", error);
      return { success: false, error: error.message };
    }
    set({ designs: data || [] });
    return { success: true, data };
  },

  saveDesign: async (name) => {
    const { user, components, currentDesignId } = get();
    if (!user) return { success: false, error: 'User not logged in' };
    if (!components || components.length === 0) return { success: false, error: 'No components to save' };

    const designData = {
      name: name || `Design ${new Date().toLocaleDateString()}`,
      structure_data: components,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    try {
      if (currentDesignId) {
        const { error } = await supabase
          .from('designs')
          .update(designData)
          .eq('id', currentDesignId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('designs')
          .insert(designData)
          .select()
          .single();
        if (error) throw error;
        set({ currentDesignId: data.id });
      }
      return { success: true };
    } catch (err) {
      console.error("Save error:", err);
      return { success: false, error: err.message };
    }
  },
  
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

