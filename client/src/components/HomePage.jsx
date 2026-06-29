import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function HomePage({ projects, onCreate, onSelect }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('悬疑惊悚无限流');

  const handleCreate = () => {
    if (!name.trim()) return;
    // Check if project with same name already exists
    const existing = projects.find(p => p.name === name.trim());
    if (existing) {
      // Load existing instead of duplicating
      fetch(`/api/projects/${existing.id}`).then(r => r.json()).then(onSelect);
    } else {
      onCreate(name, { genre, totalChapters: 65 });
    }
    setShowCreate(false);
    setName('');
  };

  const loadOrCreate = (projectName, config) => {
    const existing = projects.find(p => p.name === projectName);
    if (existing) {
      fetch(`/api/projects/${existing.id}`).then(r => r.json()).then(onSelect);
    } else {
      onCreate(projectName, config);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Hero */}
        <div style={styles.hero}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={styles.logo}>✧</div>
            <h1 style={styles.title}>InkVerse</h1>
            <p style={styles.slogan}>Where Stories Become Universes.</p>
            <p style={styles.desc}>AI 驱动的沉浸式小说创作平台。不是聊天机器人——是你的故事宇宙工作台。</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={styles.actions}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            style={styles.createBtn}
          >
            ✨ 创建新项目
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={styles.templateBtn}
            onClick={() => loadOrCreate('深渊回响', { genre: '悬疑惊悚无限流+BL', totalChapters: 65, preferredPOV: '宋见微' })}
          >
            📖 继续「深渊回响」
          </motion.button>
        </motion.div>

        {/* Create Modal */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCreate(false)}
            style={styles.overlay}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
              style={styles.modal}
            >
              <h2 style={styles.modalTitle}>创建新项目</h2>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="项目名称"
                style={styles.modalInput}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <select value={genre} onChange={e => setGenre(e.target.value)} style={styles.modalSelect}>
                <option>悬疑惊悚无限流</option>
                <option>悬疑惊悚无限流+BL</option>
                <option>奇幻玄幻</option>
                <option>科幻未来</option>
                <option>都市现实</option>
                <option>历史架空</option>
              </select>
              <div style={styles.modalActions}>
                <button onClick={() => setShowCreate(false)} style={styles.cancelBtn}>取消</button>
                <button onClick={handleCreate} style={styles.confirmBtn}>创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Recent Projects */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={styles.section}
          >
            <h3 style={styles.sectionTitle}>最近创作</h3>
            <div style={styles.grid}>
              {projects.map(p => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
                  onClick={() => onSelect(p)}
                  style={styles.projectCard}
                >
                  <div style={styles.projectName}>{p.name}</div>
                  <div style={styles.projectMeta}>第{p.currentChapter}章 · {new Date(p.createdAt).toLocaleDateString()}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Inspiration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={styles.section}
        >
          <h3 style={styles.sectionTitle}>热门世界观</h3>
          <div style={styles.grid}>
            {[
              { title: '悬疑无限流', desc: '罪孽具现的副本世界' },
              { title: '奇幻修真', desc: '灵气复苏的东方大陆' },
              { title: '科幻末世', desc: 'AI觉醒后的地球' },
              { title: '都市异闻', desc: '隐藏在都市下的魔法世界' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
                style={styles.templateCard}
                onClick={() => loadOrCreate(item.title, { genre: item.title })}
              >
                <div style={styles.templateTitle}>{item.title}</div>
                <div style={styles.templateDesc}>{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'auto' },
  container: { maxWidth: 960, margin: '0 auto', padding: '48px 24px' },
  hero: { textAlign: 'center', marginBottom: 32 },
  logo: {
    width: 56, height: 56, borderRadius: 16,
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '1.5em', fontWeight: 700, marginBottom: 20,
  },
  title: { fontSize: '2.4em', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' },
  slogan: { fontSize: '1em', color: 'var(--text-secondary)', margin: '0 0 4px' },
  desc: { fontSize: '0.9em', color: '#aaa', margin: 0 },
  actions: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 48 },
  createBtn: {
    padding: '12px 28px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.95em',
  },
  templateBtn: {
    padding: '12px 28px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95em',
  },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: '1.1em', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  projectCard: {
    padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--bg-card)', cursor: 'pointer',
  },
  projectName: { fontSize: '0.9em', fontWeight: 600, color: 'var(--text-primary)' },
  projectMeta: { fontSize: '0.75em', color: 'var(--text-secondary)', marginTop: 4 },
  templateCard: {
    padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--bg-card)', cursor: 'pointer',
  },
  templateTitle: { fontSize: '0.9em', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  templateDesc: { fontSize: '0.78em', color: 'var(--text-secondary)' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '28px', width: 400,
    boxShadow: 'var(--shadow-lg)',
  },
  modalTitle: { fontSize: '1.1em', fontWeight: 700, marginBottom: 16 },
  modalInput: {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', fontSize: '0.9em', marginBottom: 12, outline: 'none',
  },
  modalSelect: {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', fontSize: '0.9em', marginBottom: 20,
    background: 'var(--bg-card)', outline: 'none',
  },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
  },
  confirmBtn: {
    padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
};
