import React from 'react';

export function Sidebar({ project, activeTab, onTabChange }) {
  const tabs = [
    { key: 'outline', label: '📋 大纲', count: project.totalChapters },
    { key: 'characters', label: '🧑 人物', count: project.characters?.length || 0 },
    { key: 'chapters', label: '📖 章节', count: Object.keys(project.chapters || {}).length },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.title}>📚 知识库</div>
      </div>

      <div style={styles.tabs}>
        {tabs.map(tab => (
          <div
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              ...styles.tab,
              background: activeTab === tab.key ? '#1e1e2e' : 'transparent',
              color: activeTab === tab.key ? '#e0e0e0' : '#888',
            }}
          >
            {tab.label} ({tab.count})
          </div>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'outline' && (
          <div>
            {Object.entries(project.outline || {}).length === 0 ? (
              <p style={styles.empty}>大纲尚未生成。在对话中让AI帮你生成大纲。</p>
            ) : (
              Object.entries(project.outline || {}).map(([ch, title]) => (
                <div key={ch} style={styles.item}>
                  <span style={styles.chapterNum}>{ch}</span> {title}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <div>
            {(project.characters || []).length === 0 ? (
              <p style={styles.empty}>人物档案为空。在对话中让AI帮你创建人物。</p>
            ) : (
              project.characters.map((c, i) => (
                <div key={i} style={styles.item}>
                  <strong>{c.name}</strong>
                  <span style={{ color: '#888', marginLeft: 8 }}>{c.role}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chapters' && (
          <div>
            {Object.keys(project.chapters || {}).length === 0 ? (
              <p style={styles.empty}>尚未创作任何章节。</p>
            ) : (
              Object.entries(project.chapters || {}).map(([num, ch]) => (
                <div key={num} style={styles.item}>
                  <span style={styles.chapterNum}>第{num}章</span>
                  {ch.wordCount && <span style={{ color: '#888', marginLeft: 8 }}>{ch.wordCount}字</span>}
                  {ch.content ? ' ✅' : ' ⏳'}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 280,
    minWidth: 280,
    background: '#0a0a0a',
    borderRight: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid #1e1e1e',
  },
  title: { fontSize: '0.95em', fontWeight: 600 },
  tabs: {
    display: 'flex',
    padding: '8px 12px',
    gap: 4,
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    padding: '6px 4px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.8em',
    transition: 'all 0.2s',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 16px',
  },
  item: {
    padding: '6px 0',
    fontSize: '0.85em',
    borderBottom: '1px solid #111',
  },
  chapterNum: { color: '#6366f1', fontWeight: 600 },
  empty: { color: '#666', fontSize: '0.85em', marginTop: 12 },
};
