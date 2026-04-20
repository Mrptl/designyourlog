import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';

const useStore = create((set, get) => ({
  assembledDesigns: [],
  components: [],
  selectedComponentIds: [],
  designs: [],
  currentDesignId: null,
  displayUnit: 'inch',
  showLabels: true,
  user: null,
  session: null,
  isAuthReady: false,
  history: [],
  future: [],
  exportTrigger: null,
  isDragging: false,

  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const savedDraft = localStorage.getItem('wooden_structure_draft');
    const components = savedDraft ? JSON.parse(savedDraft) : [];
    set({
      session,
      user: session?.user || null,
      isAuthReady: true,
      components: components.length > 0 ? components : get().components,
      selectedComponentIds: []
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null });
    });
    useStore.subscribe(
      (state) => state.components,
      (components) => {
        if (components) {
          localStorage.setItem('wooden_structure_draft', JSON.stringify(components.map(c => useStore.getState().serializeComponents([c])[0])));
        }
      }
    );
  },

  triggerExport: (type) => set({ exportTrigger: { type, timestamp: Date.now() } }),
  clearExportTrigger: () => set({ exportTrigger: null }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setShowLabels: (show) => set({ showLabels: show }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),
  saveState: () => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))].slice(-30),
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
      selectedComponentIds: []
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
      selectedComponentIds: []
    };
  }),
  login: async (email, password) => {
    const { data: _loginData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
  signup: async (username, email, password) => {
    const { data: _signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, components: [], designs: [], currentDesignId: null, selectedComponentIds: [] });
  },
  serializeComponents: (components) => components.map(c => ({
    ...c,
    position: c.position.map(p => Number(p.toFixed(8))),
    rotation: c.rotation.map(r => Number(r.toFixed(8))),
    dimensions: c.dimensions.map(d => Number(d.toFixed(8)))
  })),
  addComponent: (type, position) => set((state) => {
    const defaultDimensions = {
      plank: [10, 1, 2],
      block: [2, 2, 2],
      'vertical-block': [2, 8, 2],
      'horizontal-block': [8, 2, 2]
    };
    const defaultDims = defaultDimensions[type] || defaultDimensions.block;
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
      history: [...state.history, JSON.parse(JSON.stringify(state.components))],
      future: [],
      components: [...state.components, newComponent],
      selectedComponentIds: [newComponent.id]
    };
  }),
  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  updateMultiple: (ids, updates) => set((state) => ({
    components: state.components.map(c => ids.includes(c.id) ? { ...c, ...updates } : c)
  })),
  nudgeSelected: (deltaX, deltaY, deltaZ) => set((state) => {
    const unlockedIds = state.components.filter(c => state.selectedComponentIds.includes(c.id) && !c.locked).map(c => c.id);
    if (unlockedIds.length === 0) return state;

    const delta = [deltaX, deltaY, deltaZ];
    const updatedComponents = state.components.map(c => {
      if (unlockedIds.includes(c.id)) {
        const newPos = [...c.position];
        for (let i = 0; i < 3; i++) {
          newPos[i] += delta[i];
        }
        return { ...c, position: newPos };
      }
      return c;
    });

    return {
      components: updatedComponents,
      history: [...state.history, JSON.parse(JSON.stringify(state.components))],
      future: []
    };
  }),
  removeComponent: (id) => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))],
    future: [],
    components: state.components.filter(c => c.id !== id),
    selectedComponentIds: state.selectedComponentIds.filter(selectedId => selectedId !== id)
  })),
  removeMultiple: (ids) => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))],
    future: [],
    components: state.components.filter(c => !ids.includes(c.id)),
    selectedComponentIds: []
  })),
  duplicateMultiple: (ids) => set((state) => {
    const originals = state.components.filter(c => ids.includes(c.id));
    if (originals.length === 0) return state;
    const newComponents = originals.map(original => ({
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      position: [original.position[0] + 5, original.position[1], original.position[2] + 5],
      locked: false
    }));
    return {
      history: [...state.history, JSON.parse(JSON.stringify(state.components))],
      future: [],
      components: [...state.components, ...newComponents],
      selectedComponentIds: newComponents.map(nc => nc.id)
    };
  }),
  duplicateComponent: (id) => set((state) => {
    const original = state.components.find(c => c.id === id);
    if (!original) return state;
    const newComponent = {
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      position: [original.position[0] + 5, original.position[1], original.position[2] + 5],
      locked: false
    };
    return {
      history: [...state.history, JSON.parse(JSON.stringify(state.components))],
      future: [],
      components: [...state.components, newComponent],
      selectedComponentIds: [newComponent.id]
    };
  }),
  selectComponent: (id, isMultiSelect) => set((state) => {
    if (!id) return { selectedComponentIds: [] };
    if (isMultiSelect) {
      const alreadySelected = state.selectedComponentIds.includes(id);
      return {
        selectedComponentIds: alreadySelected
          ? state.selectedComponentIds.filter(sid => sid !== id)
          : [...state.selectedComponentIds, id]
      };
    }
    return { selectedComponentIds: [id] };
  }),
  setDesigns: (designs) => set({ designs }),
  setCurrentDesign: (id, components) => set({
    currentDesignId: id,
    components: components || [],
    selectedComponentIds: []
  }),
  fetchDesigns: async () => {
    const { user } = get();
    if (!user) return { success: false, error: 'No user logged in' };
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error("Fetch error:", error);
      return { success: false, error: error.message };
    }
    set({ designs: data || [] });
    return { success: true, data };
  },
  duplicateDesign: async (designId) => {
    const { user } = get();
    if (!user) return { success: false, error: 'User not logged in' };
    try {
      const { data, error: fetchError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', designId)
        .eq('user_id', user.id)
        .single();
      const design = data;
      if (fetchError || !design) {
        return { success: false, error: 'Design not found' };
      }
      const newName = prompt('New name for duplicate:', `${design.name} - Copy`);
      if (newName === null || newName.trim() === '') {
        return { success: false, error: 'Name required' };
      }
      const duplicateData = {
        ...design,
        name: newName.trim(),
        id: undefined,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      const { data: newDesign, error: insertError } = await supabase
        .from('designs')
        .insert(duplicateData)
        .select()
        .single();
      if (insertError) throw insertError;
      await get().fetchDesigns();
      return { success: true, data: newDesign };
    } catch (err) {
      console.error('Duplicate error:', err);
      return { success: false, error: err.message };
    }
  },
  saveDesign: async (name) => {
    const { user, components, currentDesignId } = get();
    if (!user) return { success: false, error: 'User not logged in' };
    if (!components || components.length === 0) return { success: false, error: 'No components to save' };
    const designData = {
      name: name || `Design ${new Date().toLocaleDateString()}`,
      structure_data: get().serializeComponents(components),
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
      const c = '#c2976b';
      newComponents = [
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, -18], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [48, 4, 1], position: [0, 2, 18], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [-22, 4.5, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [-11, 4.5, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [0, 4.5, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [11, 4.5, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [4, 1, 40], position: [22, 4.5, 0], rotation: [0, 0, 0], color: c }
      ];
    } else if (templateName === 'box') {
      const c = '#d1a87b';
      const w = 20, h = 20, d = 20, t = 1;
      newComponents = [
        { id: uuidv4(), type: 'plank', dimensions: [w, t, d], position: [0, t / 2, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [w, h, t], position: [0, h / 2, -d / 2 + t / 2], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [w, h, t], position: [0, h / 2, d / 2 - t / 2], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [t, h, d - t * 2], position: [-w / 2 + t / 2, h / 2, 0], rotation: [0, 0, 0], color: c },
        { id: uuidv4(), type: 'plank', dimensions: [t, h, d - t * 2], position: [w / 2 - t / 2, h / 2, 0], rotation: [0, 0, 0], color: c }
      ];
    } else if (templateName === 'crate') {
      const c = '#cba37b';
      const w = 30, _h = 24, d = 20, t = 0.5;
      newComponents = [
        { id: uuidv4(), type: 'plank', dimensions: [w, t, d], position: [0, t / 2, 0], rotation: [0, 0, 0], color: c },
        ...[0, 1, 2, 3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [w, 3, t], position: [0, 3 + i * 6, -d / 2 + t / 2], rotation: [0, 0, 0], color: c })),
        ...[0, 1, 2, 3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [w, 3, t], position: [0, 3 + i * 6, d / 2 - t / 2], rotation: [0, 0, 0], color: c })),
        ...[0, 1, 2, 3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [t, 3, d - t * 2], position: [-w / 2 + t / 2, 3 + i * 6, 0], rotation: [0, 0, 0], color: c })),
        ...[0, 1, 2, 3].map(i => ({ id: uuidv4(), type: 'plank', dimensions: [t, 3, d - t * 2], position: [w / 2 - t / 2, 3 + i * 6, 0], rotation: [0, 0, 0], color: c }))
      ];
    }
    return {
      history: historyEntry,
      future: [],
      components: newComponents,
      selectedComponentIds: [],
      currentDesignId: null
    };
  }),
  clearScene: () => set((state) => ({
    history: [...state.history, JSON.parse(JSON.stringify(state.components))],
    future: [],
    components: [],
    selectedComponentIds: []
  })),
  assembleDesigns: async (designIds) => {
    const { user, components } = get();
    if (!user || designIds.length === 0) return { success: false, error: 'No user or designs' };
    try {
      const { data: designsData, error } = await supabase
        .from('designs')
        .select('id, name, structure_data')
        .in('id', designIds)
        .eq('user_id', user.id);
      if (error || !designsData || designsData.length === 0) {
        return { success: false, error: 'No designs found' };
      }
      const newAssembledDesigns = designsData.map(d => ({
        designId: d.id,
        name: d.name,
        offsetX: 0,
        offsetZ: 0
      }));
      const assembled = designsData.reduce((acc, design, index) => {
        const offsetY = index * 5; // 5 inches vertical stack
        newAssembledDesigns[index].offsetX = 0;
        newAssembledDesigns[index].offsetZ = 0;
        newAssembledDesigns[index].offsetY = offsetY;
        const offsetedComponents = (design.structure_data || []).map(comp => ({
          ...JSON.parse(JSON.stringify(comp)),
          id: uuidv4(),
          assembledFrom: `design-${design.id}`,
          position: [
            comp.position[0],
            comp.position[1] + offsetY,
            comp.position[2]
          ]
        }));
        return [...acc, ...offsetedComponents];
      }, []);
      const newComponents = [...components, ...assembled];
      set({
        components: newComponents,
        assembledDesigns: [...get().assembledDesigns, ...newAssembledDesigns],
        history: [...get().history, JSON.parse(JSON.stringify(components))],
        selectedComponentIds: []
      });
      return { success: true, assembledCount: assembled.length, total: newComponents.length };
    } catch (err) {
      console.error('Assemble error:', err);
      return { success: false, error: err.message };
    }
  },
  disassembleAll: () => set((state) => {
    const nonAssembled = state.components.filter(c => !c.assembledFrom);
    return {
      components: nonAssembled,
      assembledDesigns: [],
      selectedComponentIds: []
    };
  }),
  disassembleDesign: (designId) => set((state) => {
    const nonAssembled = state.components.filter(c => !c.assembledFrom || !c.assembledFrom.startsWith(`design-${designId}`));
    const newAssembled = state.assembledDesigns.filter(d => d.designId !== designId);
    return {
      components: nonAssembled,
      assembledDesigns: newAssembled,
      selectedComponentIds: []
    };
  }),
  clearAssembledDesigns: () => set({ assembledDesigns: [] })
}));

export default useStore;
