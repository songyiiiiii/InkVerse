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
    const body = isLogin 
      ? { username, password }
      : { username, password, email };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '操作失败，请重试');
        setLoading(false);
        return;
      }

      // 保存认证信息
      localStorage.setItem('inkverse_token', data.token);
      localStorage.setItem('inkverse_user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError('网络错误，请检查服务器连接');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[1000] p-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-[var(--bg-card)] rounded-2xl p-8 w-full max-w-[400px] border border-[var(--border)] shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
                {isLogin ? '👋 欢迎回来' : '🚀 加入 InkVerse'}
              </h2>
              <button
                onClick={onClose}
                className="bg-transparent border-none text-[var(--text-secondary)] text-xl cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-[var(--bg-hover)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-[0.8rem] font-medium text-[var(--text-secondary)] mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] outline-none transition-colors focus:border-[#6366F1]"
                  required
                  minLength={3}
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="block text-[0.8rem] font-medium text-[var(--text-secondary)] mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] outline-none transition-colors focus:border-[#6366F1]"
                  required
                  minLength={6}
                />
              </div>

              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-[0.8rem] font-medium text-[var(--text-secondary)] mb-1">
                    邮箱（可选）
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.95rem] outline-none transition-colors focus:border-[#6366F1]"
                  />
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[0.85rem]">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl border-none text-white font-semibold text-[0.95rem] cursor-pointer transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={switchMode}
                className="bg-transparent border-none text-[var(--text-secondary)] text-[0.85rem] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                {isLogin ? '还没有账号？立即注册 →' : '已有账号？去登录 →'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}