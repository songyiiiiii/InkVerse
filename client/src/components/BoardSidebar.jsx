import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';

export function BoardSidebar() {
  const { activeView, setActiveView, setNodeFilter, canvas, goToMainCanvas, setProject, user, currentCanvas, subCanvasChapter } = useStore();
  const [boards, setBoards] = useState([
    { id: 'main', name: '📖 总画布', type: 'canvas' },
  ]);
  const [editingBoard, setEditingBoard] = useState(null);
  const [editName, setEditName] = useState('');

  const addBoard = () => {
    const name = `画板 ${boards.length}`;
    setBoards([...boards, { id: `board-${Date.now()}`, name, type: 'canvas' }]);
  };

  const startRename = (board) => {
    setEditingBoard(board.id);
    setEditName(board.name);
  };

  const finishRename = () => {
    if (editName.trim()) {
      setBoards(boards.map(b => b.id === editingBoard ? { ...b, name: editName.trim() } : b));
    }
    setEditingBoard(null);
  };

  const counts = {};
  canvas.nodes?.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });

  const filterItems = [
    { id: 'characters', icon: '👤', label: '人物', filter: 'character', count: counts.character || 0 },
    { id: 'chapters', icon: '📖', label: '章节', filter: 'chapter', count: counts.chapter || 0 },
    { id: 'locations', icon: '📍', label: '地点', filter: 'location', count: counts.location || 0 },
    { id: 'events', icon: '⚡', label: '事件', filter: 'event', count: counts.event || 0 },
    { id: 'foreshadows', icon: '🔮', label: '伏笔', filter: 'foreshadow', count: counts.foreshadow || 0 },
  ];

  return (
    <div style={styles.sidebar}>
      {/* Brand */}
      <div style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => { setProject(null); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={styles.logo}>✧</div>
          <div>
            <div style={styles.brand}>InkVerse</div>
            <div style={styles.brandSub}>Stories Become Universes</div>
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78em', color: 'var(--text-secondary)' }}>
            <div style={styles.avatar}>{user.username?.charAt(0)}</div>
            <span>{user.username}</span>
          </div>
        </div>
      )}

      {/* Boards */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, padding: '0 6px' }}>
          <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>画板</span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={addBoard}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'var(--accent-hover)', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
        </div>
        {boards.map(board => (
          <div key={board.id} style={{ position: 'relative' }}>
            {editingBoard === board.id ? (
              <input value={editName} onChange={e => setEditName(e.target.value)} onBlur={finishRename}
                onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setEditingBoard(null); }}
                style={styles.editInput} autoFocus />
            ) : (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => { board.id === 'main' ? goToMainCanvas() : setActiveView('canvas'); }}
                onDoubleClick={() => startRename(board)}
                style={{ ...styles.boardItem, background: (board.id === 'main' && currentCanvas === 'main') ? 'var(--accent-hover)' : 'transparent', color: 'var(--text-primary)' }}>
                <span>{board.name}</span>
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '0 10px', marginTop: 4 }}>
        <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 6px' }}>筛选</span>
      </div>
      <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filterItems.map(item => (
          <motion.button key={item.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setNodeFilter(item.filter); setActiveView('canvas'); }}
            style={{ ...styles.filterItem, color: 'var(--text-secondary)' }}>
            <span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count > 0 && <span style={{ fontSize: '0.65em', color: '#aaa', background: 'var(--accent-hover)', padding: '1px 5px', borderRadius: 6 }}>{item.count}</span>}
          </motion.button>
        ))}
      </div>

      {/* Home button */}
      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setProject(null)} style={{ ...styles.filterItem, color: 'var(--text-secondary)', width: '100%', background: 'transparent' }}>
          <span style={{ width: 20, textAlign: 'center' }}>🏠</span><span>首页</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: 220, minWidth: 220, height: '100vh', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  logo: { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9em', fontWeight: 700 },
  brand: { fontSize: '0.85em', fontWeight: 700, color: 'var(--text-primary)' },
  brandSub: { fontSize: '0.6em', color: 'var(--text-secondary)' },
  avatar: { width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7em', fontWeight: 700 },
  boardItem: { display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82em', width: '100%', textAlign: 'left', background: 'transparent', transition: 'all 0.12s' },
  filterItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78em', background: 'transparent', transition: 'all 0.12s', textAlign: 'left' },
  editInput: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--accent)', fontSize: '0.82em', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
};
