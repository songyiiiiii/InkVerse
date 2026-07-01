import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { username, password } : { username, password, email };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '操作失败'); setLoading(false); return; }
      localStorage.setItem('inkverse_token', data.token);
      localStorage.setItem('inkverse_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch { setError('网络错误'); }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.2em', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{isLogin ? '👋 欢迎回来' : '🚀 加入 InkVerse'}</h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2em', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>用户名</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" style={styles.input} required minLength={3} autoFocus />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>密码</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" style={styles.input} required minLength={6} />
              </div>
              {!isLogin && (
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>邮箱（可选）</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" style={styles.input} />
                </div>
              )}
              {error && <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '0.85em' }}>{error}</div>}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 600, fontSize: '0.95em', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '...' : isLogin ? '登录' : '注册'}
              </motion.button>
            </form>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85em', cursor: 'pointer' }}>
                {isLogin ? '还没有账号？立即注册 →' : '已有账号？去登录 →'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  label: { display: 'block', fontSize: '0.8em', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95em', outline: 'none' },
};
