import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-[var(--border)] hover:border-[#6366F1] transition-colors cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
      >
        {initials}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="font-semibold text-[var(--text-primary)]">{user?.username}</div>
              <div className="text-[0.75rem] text-[var(--text-secondary)]">{user?.email || '未设置邮箱'}</div>
            </div>

            <div className="p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // 可以添加个人设置页面导航
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[0.85rem] text-[var(--text-primary)] rounded-md hover:bg-[var(--accent-hover)] transition-colors cursor-pointer bg-transparent border-none"
              >
                <span>👤</span> 个人设置
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[0.85rem] text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none"
              >
                <span>🚪</span> 退出登录
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}