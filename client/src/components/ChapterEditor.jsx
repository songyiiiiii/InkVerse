import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

export function ChapterEditor() {
  const store = useStore();
  const {
    project, setProject, setActiveView,
    aiStreaming, aiStreamingContent, aiStreamingChapter,
    aiLastGeneratedChapter, clearAiContent, setAiStreamingChapter,
  } = store;

  const [selectedChapter, setSelectedChapter] = useState(project?.currentChapter || 1);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const contentRef = useRef(content);
  contentRef.current = content;

  // Load chapter content
  useEffect(() => {
    const ch = project?.chapters?.[selectedChapter];
    setContent(ch?.content || '');
  }, [selectedChapter, project]);

  // AI streaming: live update editor
  useEffect(() => {
    if (aiStreaming && aiStreamingChapter === selectedChapter) {
      setContent(aiStreamingContent);
    }
  }, [aiStreamingContent, aiStreaming, aiStreamingChapter, selectedChapter]);

  // Save function
  const doSave = useCallback(async (text) => {
    if (!project) return;
    setIsSaving(true);
    const toSave = text || content;
    try {
      const res = await fetch(`/api/projects/${project.id}/chapters/${selectedChapter}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: toSave }),
      });
      if (res.ok) {
        setSaveMsg('✅ 已保存');
        const pRes = await fetch(`/api/projects/${project.id}`);
        const updated = await pRes.json();
        setProject(updated);
      } else {
        setSaveMsg('保存失败');
      }
    } catch {
      setSaveMsg('网络错误');
    }
    setIsSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  }, [content, selectedChapter, project, setProject]);

  // AI generation complete: auto-save
  useEffect(() => {
    if (aiLastGeneratedChapter && aiLastGeneratedChapter === selectedChapter && contentRef.current.length > 100) {
      const timer = setTimeout(() => doSave(contentRef.current), 500);
      return () => clearTimeout(timer);
    }
  }, [aiLastGeneratedChapter, selectedChapter]);

  // CTRL+S shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        doSave();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doSave]);

  const totalChapters = project?.config?.totalChapters || 65;
  const chapterList = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const wordCount = (content || '').replace(/\s/g, '').length;

  const handleAIWrite = () => {
    setAiStreamingChapter(selectedChapter);
    clearAiContent();
    setActiveView('canvas');
  };

  const isStreamingThis = aiStreaming && aiStreamingChapter === selectedChapter;

  return (
    <div style={styles.layout}>
      {/* Chapter list sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>📖 章节列表</div>
          <div style={styles.sidebarCount}>{Object.keys(project?.chapters || {}).length}/{totalChapters}</div>
        </div>
        <div style={styles.chapterList}>
          {chapterList.map(num => {
            const ch = project?.chapters?.[num];
            const isActive = num === selectedChapter;
            const hasContent = ch?.content && ch.content.length > 100;
            return (
              <motion.button
                key={num}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChapter(num)}
                style={{
                  ...styles.chapterItem,
                  background: isActive ? 'var(--accent-hover)' : 'transparent',
                  color: isActive ? 'var(--accent)' : hasContent ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={styles.chapterNum}>Ch{num}</span>
                <span style={styles.chapterName}>
                  {ch?.title || `第${num}章`}
                </span>
                {hasContent && <span style={styles.chapterDot}>●</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Editor area */}
      <div style={styles.editor}>
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <span style={styles.chapterTitle}>第{selectedChapter}章</span>
            <span style={styles.wordCount}>{wordCount} 字</span>
          </div>
          <div style={styles.toolbarRight}>
            {isStreamingThis && (
              <span style={{ color: 'var(--accent)', fontSize: '0.78em', marginRight: 12, animation: 'pulse 1.5s ease-in-out infinite' }}>
                ✨ AI 写作中...
              </span>
            )}
            {saveMsg && (
              <span style={{ color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)', fontSize: '0.82em', marginRight: 12 }}>
                {saveMsg}
              </span>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleAIWrite}
              style={styles.aiBtn}
            >
              🤖 AI 写这章
            </motion.button>
            <span style={styles.shortcutHint}>CTRL+S</span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => doSave()} style={styles.saveBtn} disabled={isSaving}>
              {isSaving ? '...' : '保存'}
            </motion.button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={isStreamingThis ? 'AI 正在生成中...' : '开始写作... 先点 🤖 AI写这章，去AI面板说"帮我写这章"'}
          style={styles.textarea}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', flex: 1, height: '100%', overflow: 'hidden' },
  sidebar: {
    width: 220, minWidth: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 16px 12px', borderBottom: '1px solid var(--border)',
  },
  sidebarTitle: { fontSize: '0.88em', fontWeight: 700 },
  sidebarCount: { fontSize: '0.7em', color: 'var(--text-secondary)' },
  chapterList: { flex: 1, overflow: 'auto', padding: '8px' },
  chapterItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.82em',
    width: '100%', textAlign: 'left', transition: 'all 0.12s',
  },
  chapterNum: { fontSize: '0.75em', color: 'var(--text-secondary)', minWidth: 32 },
  chapterName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chapterDot: { color: 'var(--success)', fontSize: '0.5em' },
  editor: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg-card)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  chapterTitle: { fontSize: '1em', fontWeight: 700, color: 'var(--text-primary)' },
  wordCount: { fontSize: '0.78em', color: 'var(--text-secondary)' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  shortcutHint: { fontSize: '0.68em', color: '#bbb' },
  aiBtn: {
    padding: '6px 14px', borderRadius: 6, border: '1px solid var(--accent)',
    background: 'var(--accent-hover)', color: 'var(--accent)',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.78em',
  },
  saveBtn: {
    padding: '6px 18px', borderRadius: 6, border: 'none', background: 'var(--accent)',
    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82em',
  },
  textarea: {
    flex: 1, padding: '24px 32px', border: 'none', outline: 'none',
    fontSize: '1em', lineHeight: 1.9, color: 'var(--text-primary)',
    background: 'var(--bg-primary)', resize: 'none',
    fontFamily: 'Inter, HarmonyOS Sans, MiSans, serif',
  },
};
