import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: '🏠', filter: null, view: 'home' },
  { id: 'canvas', label: '无限画布', icon: '🎨', filter: null, view: 'canvas' },
  { id: 'editor', label: '编辑器', icon: '✍️', filter: null, view: 'editor' },
  null, // divider
  { id: 'characters', label: '人物', icon: '👤', filter: 'character' },
  { id: 'chapters', label: '章节', icon: '📖', filter: 'chapter' },
  { id: 'locations', label: '地点', icon: '📍', filter: 'location' },
  { id: 'events', label: '事件', icon: '⚡', filter: 'event' },
  { id: 'foreshadows', label: '伏笔', icon: '🔮', filter: 'foreshadow' },
];

export function Navbar() {
  const { activeView, setActiveView, project, setNodeFilter, canvas } = useStore();

  const handleNav = (item) => {
    if (!item) return;
    if (item.view) {
      // View-based navigation (home, canvas, editor)
      if (item.view === 'home') {
        useStore.getState().setProject(null);
        return;
      }
      setNodeFilter(null);
      setActiveView(item.view);
      return;
    }
    if (item.filter) {
      setNodeFilter(item.filter);
      setActiveView('canvas');
    } else {
      setNodeFilter(null);
      setActiveView(item.id);
    }
  };

  // Count nodes by type
  const counts = {};
  canvas.nodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <div style={styles.logo}>✧</div>
        <div>
          <div style={styles.brandName}>InkVerse</div>
          <div style={styles.brandSub}>Stories Become Universes</div>
        </div>
      </div>

      <div style={styles.projectInfo}>
        <div style={styles.projectDot} />
        <div style={styles.projectName}>{project?.name || '深渊回响'}</div>
        <div style={styles.projectChapter}>Ch{project?.currentChapter || 2}/65</div>
      </div>

      <div style={styles.navItems}>
        {NAV_ITEMS.map(item => {
          if (!item) return <div key="div" style={{ height: 1, background: 'var(--border)', margin: '4px 10px' }} />;
          const isActive = item.view ? activeView === item.view : (item.filter && activeView === 'canvas');
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, backgroundColor: 'var(--accent-hover)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNav(item)}
              style={{
                ...styles.navItem,
                background: isActive ? 'var(--accent-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {item.filter && counts[item.filter] > 0 && (
              <span style={styles.badge}>{counts[item.filter]}</span>
            )}
          </motion.button>
        ))}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerText}>InkVerse v1.0</div>
        <div style={styles.footerSub}>CTRL+Z 撤回 · 空格+拖拽 平移画布</div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: 220, minWidth: 220, height: '100vh',
    background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '20px 14px', gap: 1,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 8px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8,
  },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '1.2em', fontWeight: 700,
  },
  brandName: { fontSize: '0.95em', fontWeight: 700, color: 'var(--text-primary)' },
  brandSub: { fontSize: '0.6em', color: 'var(--text-secondary)', marginTop: 1 },
  projectInfo: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 10px', marginBottom: 4,
  },
  projectDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' },
  projectName: { fontSize: '0.82em', fontWeight: 500, color: 'var(--text-primary)', flex: 1 },
  projectChapter: { fontSize: '0.68em', color: 'var(--text-secondary)' },
  navItems: { display: 'flex', flexDirection: 'column', gap: 1, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 'var(--radius-sm)',
    border: 'none', cursor: 'pointer', fontSize: '0.85em',
    transition: 'all 0.15s', textAlign: 'left', background: 'transparent',
    color: 'var(--text-secondary)',
  },
  navIcon: { fontSize: '1em', width: 24, textAlign: 'center' },
  navLabel: { flex: 1 },
  badge: {
    fontSize: '0.65em', fontWeight: 600, color: 'var(--text-secondary)',
    background: 'var(--accent-hover)', padding: '1px 6px', borderRadius: 8,
  },
  footer: {
    marginTop: 'auto', padding: '12px 10px',
    borderTop: '1px solid var(--border)',
  },
  footerText: { fontSize: '0.75em', color: 'var(--text-secondary)' },
  footerSub: { fontSize: '0.6em', color: '#bbb', marginTop: 2 },
};
