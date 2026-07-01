import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

export function TopBar() {
  const { activeView, setActiveView, user, logout, setNodeFilter } = useStore();

  const items = [
    { id: 'canvas', icon: '🎨', label: '画布' },
    { id: 'editor', icon: '✍️', label: '编辑器' },
  ];

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <div style={styles.logo}>✧</div>
        <div style={styles.brand}>InkVerse</div>
        <div style={styles.divider} />
        {items.map(item => (
          <motion.button key={item.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setNodeFilter(null); setActiveView(item.id); }}
            style={{ ...styles.btn, background: activeView === item.id ? 'var(--accent-hover)' : 'transparent', color: activeView === item.id ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: activeView === item.id ? 600 : 400 }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </motion.button>
        ))}
      </div>
      <div style={styles.right}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={styles.avatar}>{user.username?.charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: '0.82em', color: 'var(--text-primary)' }}>{user.username}</span>
            <button onClick={logout} style={styles.logoutBtn}>退出</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  bar: { position: 'absolute', top: 12, left: 220, right: 332, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderRadius: 14, background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', zIndex: 100, margin: '0 12px' },
  left: { display: 'flex', alignItems: 'center', gap: 6 },
  logo: { width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85em', fontWeight: 700 },
  brand: { fontSize: '0.85em', fontWeight: 700, color: 'var(--text-primary)' },
  divider: { width: 1, height: 20, background: 'var(--border)', margin: '0 8px' },
  btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8em', transition: 'all 0.15s', background: 'transparent' },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75em', fontWeight: 700 },
  logoutBtn: { padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.72em' },
};
