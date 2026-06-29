import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ContextMenu({ x, y, node, onClose, onEdit, onDelete, onCreateConnection }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="context-menu"
      style={{ position: 'fixed', left: x, top: y, zIndex: 1100 }}
      onClick={e => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={() => { onEdit(); onClose(); }}>
        ✏️ 编辑
      </button>
      <button className="context-menu-item" onClick={() => { onCreateConnection(); onClose(); }}>
        🔗 创建连接
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" onClick={() => {
        navigator.clipboard.writeText(JSON.stringify({ title: node.title, subtitle: node.subtitle, type: node.type }));
        onClose();
      }}>
        📋 复制
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item danger" onClick={() => { onDelete(); onClose(); }}>
        🗑 删除
      </button>
    </motion.div>
  );
}
