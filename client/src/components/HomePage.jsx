import { api } from '../api.js';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function HomePage({ projects, onCreate, onSelect, user, onLoginClick, onLogout }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('悬疑惊悚无限流');
  const [synopsis, setSynopsis] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const existing = projects.find(p => p.name === name.trim());
    if (existing) {
      api.get(`/api/projects/${existing.id}`).then(onSelect);
    } else {
      onCreate(name, { genre, totalChapters: 65, synopsis });
    }
    setShowCreate(false);
    setShowWizard(false);
    setWizardStep(0);
    setName('');
    setSynopsis('');
  };

  const loadOrCreate = (projectName, config) => {
    const existing = projects.find(p => p.name === projectName);
    if (existing) {
      api.get(`/api/projects/${existing.id}`).then(onSelect);
    } else {
      onCreate(projectName, config);
    }
  };

  const startWizard = () => {
    setShowCreate(false);
    setShowWizard(true);
    setWizardStep(0);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const templates = [
    { title: '悬疑无限流', desc: '罪孽具现的副本世界', icon: '🔮', color: '#8B5CF6' },
    { title: '奇幻修真', desc: '灵气复苏的东方大陆', icon: '⚔️', color: '#F59E0B' },
    { title: '科幻末世', desc: 'AI觉醒后的地球', icon: '🚀', color: '#06B6D4' },
    { title: '都市异闻', desc: '隐藏在都市下的魔法世界', icon: '🏙️', color: '#EC4899' },
  ];

  const handleExport = async (project) => {
    const res = await api.getRaw(`/api/projects/${project.id}/export`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('导出失败');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={styles.hero}>
          <div style={styles.logo}>✧</div>
          <h1 style={styles.title}>InkVerse</h1>
          <p style={styles.slogan}>Where Stories Become Universes.</p>
          <div style={{ marginTop: 16 }}>
            {user ? (
              <span style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                👋 {user.username} · <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit' }}>退出</button>
              </span>
            ) : (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onLoginClick}
                style={{ padding: '8px 24px', borderRadius: 10, border: '1px solid var(--accent)', background: 'var(--bg-card)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em' }}>
                👤 登录 / 注册
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={styles.actions}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setShowCreate(true); setShowWizard(false); }} style={styles.createBtn}>
            ✨ 创建新项目
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => loadOrCreate('深渊回响', { genre: '悬疑惊悚无限流+BL', totalChapters: 65 })} style={styles.continueBtn}>
            📖 继续「深渊回响」
          </motion.button>
        </motion.div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="glass-overlay" style={styles.overlay}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="glass-heavy" style={styles.modal}>
                <h2 style={styles.modalTitle}>创建新项目</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="项目名称" style={styles.modalInput} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                <select value={genre} onChange={e => setGenre(e.target.value)} style={styles.modalSelect}>
                  <option>悬疑惊悚无限流</option><option>悬疑惊悚无限流+BL</option><option>奇幻玄幻</option><option>科幻未来</option><option>都市现实</option><option>历史架空</option>
                </select>
                <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="一句话简介（可选）" style={{ ...styles.modalInput, minHeight: 60, resize: 'vertical' }} rows={2} />
                <div style={styles.modalActions}>
                  <button onClick={() => setShowCreate(false)} style={styles.cancelBtn}>取消</button>
                  <button onClick={startWizard} style={styles.wizardBtn}>💡 AI辅助创建</button>
                  <button onClick={handleCreate} style={styles.confirmBtn}>创建</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Wizard */}
        <AnimatePresence>
          {showWizard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWizard(false)} className="glass-overlay" style={styles.overlay}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="glass-heavy" style={{ ...styles.modal, width: 520 }}>
                <h2 style={styles.modalTitle}>🤖 AI 辅助创建向导</h2>
                {wizardStep === 0 && (
                  <>
                    <p style={styles.wizardHint}>告诉我你想写一个什么样的故事，AI会帮你生成世界观、人物和大纲。</p>
                    <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="例如：一个关于刑警和心理学研究生在无限流副本中重逢并共同揭开系统真相的故事..." style={{ ...styles.modalInput, minHeight: 100, resize: 'vertical' }} rows={4} autoFocus />
                    <div style={styles.modalActions}>
                      <button onClick={() => setShowWizard(false)} style={styles.cancelBtn}>跳过</button>
                      <button onClick={() => setWizardStep(1)} style={styles.confirmBtn}>下一步</button>
                    </div>
                  </>
                )}
                {wizardStep === 1 && (
                  <>
                    <p style={styles.wizardHint}>🎨 选择题材和目标规模</p>
                    <select value={genre} onChange={e => setGenre(e.target.value)} style={styles.modalSelect}>
                      <option>悬疑惊悚无限流</option><option>悬疑惊悚无限流+BL</option><option>奇幻玄幻</option><option>科幻未来</option><option>都市现实</option><option>历史架空</option>
                    </select>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="项目名称（如：深渊回响）" style={styles.modalInput} />
                    <div style={styles.modalActions}>
                      <button onClick={() => setWizardStep(0)} style={styles.cancelBtn}>上一步</button>
                      <button onClick={handleCreate} style={styles.confirmBtn}>✨ 创建并让AI帮你规划</button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Templates */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={styles.section}>
          <h3 style={styles.sectionTitle}>快速开始</h3>
          <div style={styles.grid}>
            {templates.map((item, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }} style={styles.templateCard}
                onClick={() => {
                  setName(item.title);
                  setGenre(item.title);
                  setSynopsis('');
                  setShowCreate(true);
                }}>
                <div style={{ fontSize: '1.5em', marginBottom: 8 }}>{item.icon}</div>
                <div style={styles.templateTitle}>{item.title}</div>
                <div style={styles.templateDesc}>{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Projects */}
        {filteredProjects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>最近创作</h3>
              <input placeholder="🔍 搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
            </div>
            <div style={styles.grid}>
              {filteredProjects.map(p => (
                <motion.div key={p.id} whileHover={{ scale: 1.02 }} style={styles.projectCard}>
                  <div onClick={() => { api.get(`/api/projects/${p.id}`).then(onSelect); }} style={{ cursor: 'pointer', flex: 1 }}>
                    <div style={styles.projectName}>{p.name}</div>
                    <div style={styles.projectMeta}>第{p.currentChapter}章 · {p.config?.genre || ''} · {new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleExport(p); }} style={styles.actionBtn} title="导出">📥</button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('确定删除？')) { api.del(`/api/projects/${p.id}`).then(() => window.location.reload()); } }} style={styles.dangerBtn} title="删除">🗑</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'auto' },
  container: { maxWidth: 960, margin: '0 auto', padding: '48px 24px' },
  hero: { textAlign: 'center', marginBottom: 28 },
  logo: { width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5em', fontWeight: 700, marginBottom: 16 },
  title: { fontSize: '2.2em', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' },
  slogan: { fontSize: '0.95em', color: 'var(--text-secondary)', margin: 0 },
  actions: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40 },
  createBtn: { padding: '12px 28px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95em' },
  continueBtn: { padding: '12px 28px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95em' },
  section: { marginBottom: 36 },
  sectionTitle: { fontSize: '1.05em', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 },
  searchInput: { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8em', width: 180, outline: 'none', background: 'var(--bg-card)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  projectCard: { padding: '16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 8 },
  projectName: { fontSize: '0.88em', fontWeight: 600, color: 'var(--text-primary)' },
  projectMeta: { fontSize: '0.72em', color: 'var(--text-secondary)', marginTop: 3 },
  actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9em', padding: '2px 4px' },
  dangerBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9em', padding: '2px 4px', opacity: 0.5 },
  templateCard: { padding: '20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' },
  templateTitle: { fontSize: '0.9em', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 },
  templateDesc: { fontSize: '0.78em', color: 'var(--text-secondary)' },
  overlay: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { borderRadius: 16, padding: '28px', width: 440, maxHeight: '80vh', overflow: 'auto' },
  modalTitle: { fontSize: '1.1em', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' },
  modalInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9em', marginBottom: 10, outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-primary)' },
  modalSelect: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9em', marginBottom: 10, background: 'var(--bg-card)', outline: 'none', color: 'var(--text-primary)' },
  wizardHint: { fontSize: '0.85em', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
  confirmBtn: { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
  wizardBtn: { padding: '8px 18px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-hover)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
};
