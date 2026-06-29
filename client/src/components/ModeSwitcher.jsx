import React from 'react';
import { useStore } from '../stores/useStore';

export function ModeSwitcher() {
  const { mode, setMode } = useStore();

  const modes = {
    autopilot: { label: '🤖 AI主导', desc: '自动推进' },
    copilot: { label: '🤝 协同', desc: 'AI建议·你决定' },
    manual: { label: '✋ 手动', desc: '你指挥·AI执行' },
  };

  return (
    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
      {Object.entries(modes).map(([key, val]) => (
        <button
          key={key}
          onClick={() => setMode(key)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: mode === key ? '1px solid #6366f1' : '1px solid #333',
            background: mode === key ? '#1a1a3e' : 'transparent',
            color: mode === key ? '#a5b4fc' : '#666',
            cursor: 'pointer',
            fontSize: '0.8em',
            transition: 'all 0.2s',
          }}
          title={val.desc}
        >
          {val.label}
        </button>
      ))}
    </div>
  );
}
