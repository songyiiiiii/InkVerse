import { create } from 'zustand';

// Helper: deep clone canvas state
const cloneCanvas = (cv) => JSON.parse(JSON.stringify({ nodes: cv.nodes, connections: cv.connections }));

export const useStore = create((set, get) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('inkverse_user') || 'null'),
  token: localStorage.getItem('inkverse_token') || null,
  login: (user, token) => { localStorage.setItem('inkverse_user', JSON.stringify(user)); localStorage.setItem('inkverse_token', token); set({ user, token }); },
  logout: () => { localStorage.removeItem('inkverse_user'); localStorage.removeItem('inkverse_token'); set({ user: null, token: null, project: null }); },

  project: null,
  projects: [],
  activeView: 'canvas',
  messages: [],
  mode: 'copilot',
  isGenerating: false,
  thinkingSteps: [],

  // ─── AI 写作联动 ─────────────────
  aiStreaming: false,          // AI 正在流式写正文
  aiStreamingChapter: null,    // 当前正在写的章节号
  aiStreamingContent: '',      // 流式内容缓冲
  aiLastGeneratedChapter: null,// 最后生成的章节号（触发编辑器保存）

  // ─── Undo history ─────────────────

  _history: [],
  _historyIndex: -1,
  _maxHistory: 50,

  _pushHistory: () => {
    const { canvas, _history, _historyIndex } = get();
    const snapshot = cloneCanvas(canvas);
    const newHistory = _history.slice(0, _historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > get()._maxHistory) newHistory.shift();
    set({ _history: newHistory, _historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { _history, _historyIndex } = get();
    if (_historyIndex <= 0) return;
    const newIndex = _historyIndex - 1;
    const snapshot = _history[newIndex];
    set(state => ({
      _historyIndex: newIndex,
      canvas: { ...state.canvas, nodes: snapshot.nodes, connections: snapshot.connections }
    }));
  },

  redo: () => {
    const { _history, _historyIndex } = get();
    if (_historyIndex >= _history.length - 1) return;
    const newIndex = _historyIndex + 1;
    const snapshot = _history[newIndex];
    set(state => ({
      _historyIndex: newIndex,
      canvas: { ...state.canvas, nodes: snapshot.nodes, connections: snapshot.connections }
    }));
  },

  // ─── Canvas State ─────────────────

  // Which canvas: 'main' or 'chapter-N'
  currentCanvas: 'main',
  subCanvasChapter: null,

  // Main canvas — starts empty, AI fills it
  canvas: {
    x: 0, y: 0, scale: 0.75,
    nodes: [],
    connections: [],
  },

  // Chapter sub-canvases (populated on demand)
  chapterCanvases: {},

  // Filters & selection
  nodeFilter: null,
  selectedNodeIds: [],

  // ─── Actions ───────────────────────

  setProject: (project) => set({ project }),
  setProjects: (projects) => set({ projects }),
  setActiveView: (view) => set({ activeView: view }),
  setMode: (mode) => set({ mode }),
  setNodeFilter: (filter) => set({ nodeFilter: filter }),

  setCurrentCanvas: (canvasId, chapterNum = null) => set({
    currentCanvas: canvasId,
    subCanvasChapter: chapterNum,
    nodeFilter: null,
    selectedNodeIds: [],
  }),

  goToMainCanvas: () => set({
    currentCanvas: 'main',
    subCanvasChapter: null,
    nodeFilter: null,
    selectedNodeIds: [],
  }),

  getCurrentCanvasData: () => {
    const state = get();
    if (state.currentCanvas === 'main') return state.canvas;
    const key = `chapter-${state.subCanvasChapter}`;
    return state.chapterCanvases[key] || { nodes: [], connections: [] };
  },

  setCanvasTransform: (x, y, scale) => {
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({ canvas: { ...state.canvas, x, y, scale } }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: {
          ...state.chapterCanvases,
          [key]: { ...(state.chapterCanvases[key] || { nodes: [], connections: [] }), x, y, scale }
        }
      }));
    }
  },

  moveNode: (id, x, y) => {
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({ canvas: { ...state.canvas, nodes: state.canvas.nodes.map(n => n.id === id ? { ...n, x, y } : n) } }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: { ...state.chapterCanvases, [key]: {
          ...(state.chapterCanvases[key] || { nodes: [], connections: [] }),
          nodes: (state.chapterCanvases[key]?.nodes || []).map(n => n.id === id ? { ...n, x, y } : n)
        }}
      }));
    }
  },

  moveNodeEnd: (id, x, y) => { get()._pushHistory(); },

  updateNode: (id, updates) => {
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({ canvas: { ...state.canvas, nodes: state.canvas.nodes.map(n => n.id === id ? { ...n, ...updates } : n) } }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: { ...state.chapterCanvases, [key]: {
          ...(state.chapterCanvases[key] || { nodes: [], connections: [] }),
          nodes: (state.chapterCanvases[key]?.nodes || []).map(n => n.id === id ? { ...n, ...updates } : n)
        }}
      }));
    }
    get()._pushHistory();
  },

  addNode: (node) => {
    get()._pushHistory();
    const id = `n${Date.now()}`;
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({ canvas: { ...state.canvas, nodes: [...state.canvas.nodes, { ...node, id, _new: true }] } }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: { ...state.chapterCanvases, [key]: {
          ...(state.chapterCanvases[key] || { nodes: [], connections: [] }),
          nodes: [...(state.chapterCanvases[key]?.nodes || []), { ...node, id, _new: true }]
        }}
      }));
    }
  },

  deleteNode: (id) => {
    get()._pushHistory();
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({
        canvas: {
          ...state.canvas,
          nodes: state.canvas.nodes.filter(n => n.id !== id),
          connections: state.canvas.connections.filter(c => c.from !== id && c.to !== id)
        }
      }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: { ...state.chapterCanvases, [key]: {
          ...(state.chapterCanvases[key] || { nodes: [], connections: [] }),
          nodes: (state.chapterCanvases[key]?.nodes || []).filter(n => n.id !== id),
          connections: (state.chapterCanvases[key]?.connections || []).filter(c => c.from !== id && c.to !== id)
        }}
      }));
    }
    // Clear selection
    set(state => ({ selectedNodeIds: state.selectedNodeIds.filter(sid => sid !== id) }));
  },

  deleteSelectedNodes: () => {
    get()._pushHistory();
    const ids = get().selectedNodeIds;
    const { currentCanvas } = get();
    if (currentCanvas === 'main') {
      set(state => ({
        canvas: {
          ...state.canvas,
          nodes: state.canvas.nodes.filter(n => !ids.includes(n.id)),
          connections: state.canvas.connections.filter(c => !ids.includes(c.from) && !ids.includes(c.to))
        },
        selectedNodeIds: [],
      }));
    } else {
      const key = `chapter-${get().subCanvasChapter}`;
      set(state => ({
        chapterCanvases: { ...state.chapterCanvases, [key]: {
          ...(state.chapterCanvases[key] || { nodes: [], connections: [] }),
          nodes: (state.chapterCanvases[key]?.nodes || []).filter(n => !ids.includes(n.id)),
          connections: (state.chapterCanvases[key]?.connections || []).filter(c => !ids.includes(c.from) && !ids.includes(c.to))
        }},
        selectedNodeIds: [],
      }));
    }
  },

  toggleNodeSelection: (id) => set(state => ({
    selectedNodeIds: state.selectedNodeIds.includes(id)
      ? state.selectedNodeIds.filter(sid => sid !== id)
      : [...state.selectedNodeIds, id]
  })),

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
  clearSelection: () => set({ selectedNodeIds: [] }),

  addMessage: (msg) => set(state => ({
    messages: [...state.messages, { ...msg, id: Date.now() }]
  })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  addThinkingStep: (step) => set(state => ({
    thinkingSteps: [...state.thinkingSteps, step]
  })),
  clearThinkingSteps: () => set({ thinkingSteps: [] }),

  // AI 写作联动 actions
  setAiStreaming: (streaming) => set({ aiStreaming: streaming }),
  setAiStreamingChapter: (ch) => set({ aiStreamingChapter: ch }),
  appendAiContent: (chunk) => set(state => ({ aiStreamingContent: state.aiStreamingContent + chunk })),
  clearAiContent: () => set({ aiStreamingContent: '' }),
  triggerChapterSave: (chapterNum) => set({ aiLastGeneratedChapter: chapterNum }),
}));
