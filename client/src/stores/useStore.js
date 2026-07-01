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

  // Main canvas — overview: chapter nodes + character web + key events
  canvas: {
    x: 0, y: 0, scale: 0.75,
    nodes: [
      // ── Chapter timeline (top row) ──
      { id: 'ch1', type: 'chapter', x: 80, y: 40, title: '第1章·第四年', subtitle: '图书馆·裂缝·录音·邀请', meta: '3200字 ✓', status: 'done', chapterNum: 1 },
      { id: 'ch2', type: 'chapter', x: 340, y: 40, title: '第2章·裂缝', subtitle: '三天等待·异常加剧·推门', meta: '3200字 ✓', status: 'done', chapterNum: 2 },
      { id: 'ch3', type: 'chapter', x: 600, y: 40, title: '第3章·白色大厅', subtitle: '重逢·两声认出彼此', meta: '待创作', status: 'pending', chapterNum: 3 },
      { id: 'ch4', type: 'chapter', x: 860, y: 40, title: '第4章·规则与重逢', subtitle: '系统规则·第一段对话', meta: '待创作', status: 'pending', chapterNum: 4 },
      { id: 'ch5', type: 'chapter', x: 1120, y: 40, title: '第5章·第一扇门', subtitle: '副本①教学楼开启', meta: '待创作', status: 'pending', chapterNum: 5 },

      // ── Key events (middle row, connecting chapters) ──
      { id: 'ev1', type: 'event', x: 180, y: 280, title: '4分37秒', subtitle: '那通电话。统计题底下的求救。', meta: 'Ch1-Ch2 核心悬念', status: 'active' },
      { id: 'ev2', type: 'event', x: 460, y: 280, title: '白色大厅邀请', subtitle: '论文草稿上的黑体字。三天后。', meta: 'Ch1→Ch3 过渡', status: 'active' },
      { id: 'ev3', type: 'event', x: 760, y: 280, title: '重逢·声音', subtitle: '笔转动的声音 + 擦眼镜的手', meta: 'Ch3 情感核心', status: 'pending' },

      // ── Characters (bottom row) ──
      { id: 'c1', type: 'character', x: 80, y: 520, title: '宋见微', subtitle: '心理学研究生·见微知著·感知与众不同', meta: '关联：陆砚·周砚秋·赵老六', status: 'active', avatar: '宋' },
      { id: 'c2', type: 'character', x: 320, y: 520, title: '陆砚', subtitle: '刑警·34岁·黑框眼镜·禁欲高智', meta: '关联：宋见微·师父女儿', status: 'active', avatar: '陆' },
      { id: 'c3', type: 'character', x: 560, y: 520, title: '周砚秋', subtitle: '化学系研三·跳楼身亡·已故', meta: '关联：宋见微·副本①原型', status: 'active', avatar: '周' },
      { id: 'c4', type: 'character', x: 800, y: 520, title: '师父的女儿', subtitle: '失踪时19岁·拨出最后一通电话', meta: '关联：陆砚·宋见微', status: 'active', avatar: '她' },

      // ── Locations ──
      { id: 'l1', type: 'location', x: 200, y: 720, title: 'S大教学楼', subtitle: '副本①场景·13层空置三年', meta: '个人之罪·Ch5-12', status: 'active' },
      { id: 'l2', type: 'location', x: 500, y: 720, title: '白色大厅', subtitle: '系统中转空间·纯白·无限走廊', meta: 'Ch3首次出现', status: 'active' },
    ],
    connections: [
      // Chapter timeline
      { from: 'ch1', to: 'ch2' }, { from: 'ch2', to: 'ch3' }, { from: 'ch3', to: 'ch4' }, { from: 'ch4', to: 'ch5' },
      // Events → chapters
      { from: 'ev1', to: 'ch1' }, { from: 'ev1', to: 'ch2' },
      { from: 'ev2', to: 'ch1' }, { from: 'ev2', to: 'ch3' },
      { from: 'ev3', to: 'ch3' },
      // Characters
      { from: 'c1', to: 'c2' }, { from: 'c1', to: 'c3' }, { from: 'c1', to: 'c4' },
      { from: 'c2', to: 'c4' },
      // Characters → events
      { from: 'c1', to: 'ev1' }, { from: 'c4', to: 'ev1' },
      { from: 'c1', to: 'ev3' }, { from: 'c2', to: 'ev3' },
      // Locations
      { from: 'l1', to: 'c3' }, { from: 'l1', to: 'ch5' },
      { from: 'l2', to: 'ch3' },
    ],
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
}));
