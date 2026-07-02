import React from 'react';
import { motion } from 'framer-motion';

const TYPE_CONFIG = {
  character: { color: '#E0E7FF', border: '#A5B4FC', accent: '#6366F1', icon: '👤', label: '人物' },
  chapter: { color: '#EDE9FE', border: '#C4B5FD', accent: '#8B5CF6', icon: '📖', label: '章节' },
  location: { color: '#D1FAE5', border: '#6EE7B7', accent: '#10B981', icon: '📍', label: '地点' },
  event: { color: '#FFF7ED', border: '#FDBA74', accent: '#F97316', icon: '⚡', label: '事件' },
  foreshadow: { color: '#FEE2E2', border: '#FCA5A5', accent: '#EF4444', icon: '🔮', label: '伏笔' },
};

export function CanvasNode({ node, isSelected, onClick, onDoubleClick, onContextMenu, onDragStart, onDragEnd, isNew }) {
  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.event;
  const isAI = node.aiGenerated;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, scale: 0.8 } : false}
      animate={{
        opacity: 1,
        scale: 1,
        x: node.x,
        y: node.y,
        boxShadow: isSelected
          ? '0 0 0 2px #6366F1, 0 4px 16px rgba(99,102,241,0.18)'
          : isAI
            ? '0 0 0 2px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.15)'
            : 'var(--shadow-md)',
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onDoubleClick={(e) => { e.stopPropagation(); if (onDoubleClick) onDoubleClick(); }}
      onContextMenu={(e) => { if (onContextMenu) onContextMenu(e, node); }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(); }}
      onMouseUp={onDragEnd}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 220,
        minHeight: 110,
        padding: '14px 16px',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-card)',
        border: `1px solid ${config.border}`,
        borderLeft: `4px solid ${config.accent}`,
        cursor: 'pointer',
        ...(isAI && {
          borderColor: 'rgba(99,102,241,0.4)',
          background: 'linear-gradient(135deg, #FFFFFF, #F5F3FF)',
        }),
      }}
    >
      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: '0.7em' }}>{config.icon}</span>
        <span style={{ fontSize: '0.65em', color: config.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{config.label}</span>
        {isAI && (
          <span style={{ fontSize: '0.6em', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', padding: '1px 6px', borderRadius: 4, marginLeft: 'auto' }}>AI</span>
        )}
        {node.status === 'done' && (
          <span style={{ fontSize: '0.6em', color: 'var(--success)', marginLeft: 'auto' }}>✓</span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: '0.88em', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
        {node.title}
      </div>

      {/* Subtitle */}
      {node.subtitle && (
        <div style={{ fontSize: '0.75em', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 4 }}>
          {node.subtitle}
        </div>
      )}

      {/* Meta */}
      {node.meta && (
        <div style={{ fontSize: '0.7em', color: '#aaa', marginTop: 4 }}>
          {node.meta}
        </div>
      )}

      {/* Avatar for character nodes */}
      {node.type === 'character' && node.avatar && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: config.accent,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75em',
          fontWeight: 700,
        }}>
          {node.avatar}
        </div>
      )}
    </motion.div>
  );
}
