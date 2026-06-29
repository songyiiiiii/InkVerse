import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';
import { CanvasNode } from './CanvasNode';
import { CanvasConnection } from './CanvasConnection';
import { ContextMenu } from './ContextMenu';

export function Canvas({ onNodeClick }) {
  const store = useStore();
  const {
    canvas, chapterCanvases, currentCanvas, subCanvasChapter,
    setCanvasTransform, moveNode, moveNodeEnd, addNode, deleteNode,
    deleteSelectedNodes, updateNode,
    nodeFilter, setNodeFilter,
    selectedNodeIds, toggleNodeSelection, clearSelection, setSelectedNodeIds,
    setCurrentCanvas, goToMainCanvas,
    getCurrentCanvasData,
  } = store;

  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragId, setDragId] = useState(null);
  const [dragStartTime, setDragStartTime] = useState(0);

  // Box selection
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0 });
  const [boxEnd, setBoxEnd] = useState({ x: 0, y: 0 });

  // Context menu
  const [contextMenu, setContextMenu] = useState(null);

  // Get current canvas data
  const currentData = getCurrentCanvasData();
  const cvX = currentData.x || 0;
  const cvY = currentData.y || 0;
  const cvScale = currentData.scale || 1;
  const nodes = currentData.nodes || [];
  const connections = currentData.connections || [];

  // Space = pan mode
  useEffect(() => {
    const down = (e) => { if (e.code === 'Space' && !e.target.closest('input,textarea')) { e.preventDefault(); setSpaceDown(true); } };
    const up = (e) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Delete key for selected nodes
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0 && !e.target.closest('input,textarea')) {
        e.preventDefault();
        deleteSelectedNodes();
      }
      if (e.key === 'Escape') { clearSelection(); setContextMenu(null); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedNodeIds, deleteSelectedNodes, clearSelection]);

  // Scroll zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.15, Math.min(3, cvScale * delta));
      setCanvasTransform(cvX, cvY, newScale);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [cvX, cvY, cvScale, setCanvasTransform]);

  // Filter
  const visibleNodes = nodeFilter
    ? nodes.filter(n => n.type === nodeFilter)
    : nodes;

  // ─── Mouse handlers ─────────────────

  const getCanvasCoords = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - cvX) / cvScale,
      y: (clientY - rect.top - cvY) / cvScale,
    };
  };

  const onMouseDown = useCallback((e) => {
    if (e.button === 2) return; // right-click handled separately

    // Shift+drag = box select
    if (e.shiftKey && !spaceDown && e.target === containerRef.current) {
      const pos = getCanvasCoords(e.clientX, e.clientY);
      setIsBoxSelecting(true);
      setBoxStart(pos);
      setBoxEnd(pos);
      return;
    }

    // Pan with space or middle mouse
    if (spaceDown || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - cvX, y: e.clientY - cvY });
      return;
    }

    // Click on empty area = clear selection
    if (e.target === containerRef.current || e.target.classList.contains('canvas-bg')) {
      clearSelection();
      setContextMenu(null);
    }
    // Click on transformed layer bg
    if (e.target.closest('[data-canvas-layer]') && e.target === e.target.closest('[data-canvas-layer]')) {
      clearSelection();
      setContextMenu(null);
    }
  }, [spaceDown, cvX, cvY, clearSelection, containerRef]);

  const onMouseMove = useCallback((e) => {
    if (isPanning) {
      setCanvasTransform(e.clientX - panStart.x, e.clientY - panStart.y, cvScale);
    }
    if (isBoxSelecting) {
      setBoxEnd(getCanvasCoords(e.clientX, e.clientY));
    }
    if (dragId && !isPanning) {
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left - cvX) / cvScale;
      const ny = (e.clientY - rect.top - cvY) / cvScale;
      moveNode(dragId, nx - 110, ny - 40);
    }
  }, [isPanning, isBoxSelecting, dragId, panStart, cvX, cvY, cvScale, setCanvasTransform, moveNode]);

  const onMouseUp = useCallback(() => {
    if (isBoxSelecting) {
      // Find nodes inside the selection box
      const minX = Math.min(boxStart.x, boxEnd.x);
      const maxX = Math.max(boxStart.x, boxEnd.x);
      const minY = Math.min(boxStart.y, boxEnd.y);
      const maxY = Math.max(boxStart.y, boxEnd.y);
      const inside = nodes.filter(n => {
        const cx = n.x + 110, cy = n.y + 55;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      });
      setSelectedNodeIds(inside.map(n => n.id));
      setIsBoxSelecting(false);
    }
    if (dragId) {
      const now = Date.now();
      const duration = now - dragStartTime;
      const node = nodes.find(n => n.id === dragId);
      if (node) {
        // If dragged for <200ms, treat as click → select
        if (duration < 200) {
          toggleNodeSelection(dragId);
          onNodeClick(node);
        } else {
          moveNodeEnd(dragId, node.x, node.y);
        }
      }
    }
    setIsPanning(false);
    setDragId(null);
  }, [isBoxSelecting, boxStart, boxEnd, dragId, dragStartTime, nodes, moveNodeEnd, toggleNodeSelection, onNodeClick, setSelectedNodeIds]);

  // Node drag start
  const handleNodeDragStart = useCallback((id) => {
    setDragId(id);
    setDragStartTime(Date.now());
  }, []);

  // Node right-click
  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedNodeIds.includes(node.id)) {
      setSelectedNodeIds([node.id]);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, [selectedNodeIds, setSelectedNodeIds]);

  // Double-click chapter node = open sub-canvas
  const onNodeDoubleClick = useCallback((node) => {
    if (node.type === 'chapter' && node.chapterNum) {
      setCurrentCanvas(`chapter-${node.chapterNum}`, node.chapterNum);
    }
  }, [setCurrentCanvas]);

  // Close context menu
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // Double-click empty = create node
  const onDoubleClick = useCallback((e) => {
    if (e.target !== containerRef.current && !e.target.classList.contains('canvas-bg')) return;
    const pos = getCanvasCoords(e.clientX, e.clientY);
    addNode({ type: nodeFilter || 'event', x: pos.x - 110, y: pos.y - 40, title: '新节点', subtitle: '双击编辑', meta: '新建' });
  }, [cvX, cvY, cvScale, addNode, nodeFilter]);

  const handleEdit = () => {
    if (contextMenu?.node) onNodeClick(contextMenu.node);
  };
  const handleDelete = () => {
    if (contextMenu?.node) deleteNode(contextMenu.node.id);
    if (selectedNodeIds.length > 0) deleteSelectedNodes();
  };

  // ─── Render ─────────────────────────

  const boxStyle = isBoxSelecting ? {
    position: 'fixed',
    left: Math.min(boxStart.x * cvScale + cvX + (containerRef.current?.getBoundingClientRect().left || 0), boxEnd.x * cvScale + cvX + (containerRef.current?.getBoundingClientRect().left || 0)),
    top: Math.min(boxStart.y * cvScale + cvY + (containerRef.current?.getBoundingClientRect().top || 0), boxEnd.y * cvScale + cvY + (containerRef.current?.getBoundingClientRect().top || 0)),
    width: Math.abs(boxEnd.x - boxStart.x) * cvScale,
    height: Math.abs(boxEnd.y - boxStart.y) * cvScale,
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.3)',
    zIndex: 999,
    pointerEvents: 'none',
  } : null;

  return (
    <div ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      style={{ ...styles.container, cursor: spaceDown ? 'grab' : isPanning ? 'grabbing' : 'default' }}>
      {/* Grid */}
      <div className="canvas-bg" style={{
        ...styles.grid,
        backgroundPosition: `${cvX}px ${cvY}px`,
        backgroundSize: `${30 * cvScale}px ${30 * cvScale}px`,
      }} />

      {/* Transformed Layer */}
      <div data-canvas-layer style={{
        transform: `translate(${cvX}px, ${cvY}px) scale(${cvScale})`,
        transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
      }}>
        <svg style={styles.svg}>
          {connections.map((conn, i) => {
            const from = visibleNodes.find(n => n.id === conn.from);
            const to = visibleNodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return <CanvasConnection key={i} x1={from.x + 110} y1={from.y + 55} x2={to.x + 110} y2={to.y + 55} />;
          })}
        </svg>
        <AnimatePresence>
          {visibleNodes.map(node => (
            <div key={node.id} style={{ pointerEvents: 'auto' }}>
              <CanvasNode node={node} isSelected={selectedNodeIds.includes(node.id)}
                onClick={() => { toggleNodeSelection(node.id); onNodeClick(node); }}
                onDoubleClick={() => onNodeDoubleClick(node)}
                onContextMenu={(e) => onNodeContextMenu(e, node)}
                onDragStart={() => handleNodeDragStart(node.id)}
                onDragEnd={() => setDragId(null)}
                isNew={node._new} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Box selection overlay */}
      {boxStyle && <div style={boxStyle} />}

      {/* Breadcrumb for sub-canvas */}
      {currentCanvas !== 'main' && (
        <div className="glass" style={styles.breadcrumb}>
          <span style={{ color: '#aaa', cursor: 'pointer' }} onClick={goToMainCanvas}>📖 总画布</span>
          <span style={{ color: '#aaa', margin: '0 6px' }}>›</span>
          <span style={{ fontWeight: 600 }}>第{subCanvasChapter}章</span>
        </div>
      )}

      {/* Zoom */}
      <div className="glass" style={styles.zoomBadge}>{Math.round(cvScale * 100)}%</div>

      {/* Filter */}
      {nodeFilter && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={styles.filterBadge}>
          <span>筛选：{{ character:'👤 人物',chapter:'📖 章节',location:'📍 地点',event:'⚡ 事件',foreshadow:'🔮 伏笔' }[nodeFilter]}</span>
          <span style={{ color: '#aaa' }}>（{visibleNodes.length}个）</span>
          <button onClick={() => setNodeFilter(null)} style={styles.clearBtn}>✕</button>
        </motion.div>
      )}

      {/* Selection info */}
      {selectedNodeIds.length > 1 && (
        <div className="glass" style={styles.selectionBadge}>
          已选 {selectedNodeIds.length} 个节点 · Delete删除 · Esc取消
        </div>
      )}

      {/* Shortcuts */}
      <div className="glass" style={styles.shortcuts}>
        🖱 滚轮缩放 · 空格平移 · Shift+框选 · 双击创建 · 右键菜单 · CTRL+Z
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} node={contextMenu.node}
            onClose={() => setContextMenu(null)}
            onEdit={handleEdit} onDelete={handleDelete} onCreateConnection={() => {}} />
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: { flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' },
  grid: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', pointerEvents: 'none' },
  svg: { position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', pointerEvents: 'none', zIndex: 0 },
  zoomBadge: { position: 'absolute', bottom: 40, left: 14, padding: '4px 10px', borderRadius: 6, fontSize: '0.68em', color: 'var(--text-secondary)' },
  filterBadge: { position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--accent)', fontSize: '0.76em', fontWeight: 500, whiteSpace: 'nowrap' },
  clearBtn: { padding: '2px 6px', borderRadius: 3, border: 'none', background: 'var(--accent-hover)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85em' },
  selectionBadge: { position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 6, border: '1px solid var(--danger)', fontSize: '0.76em', color: 'var(--danger)' },
  shortcuts: { position: 'absolute', bottom: 10, right: 14, padding: '3px 10px', borderRadius: 6, fontSize: '0.62em', color: '#aaa' },
  breadcrumb: { position: 'absolute', top: 14, left: 14, padding: '5px 14px', borderRadius: 6, fontSize: '0.82em', display: 'flex', alignItems: 'center', gap: 4 },
};
