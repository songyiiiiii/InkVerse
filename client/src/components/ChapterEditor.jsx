import { api } from '../api.js';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';

export function ChapterEditor() {
  const { project, setProject } = useStore();
  const [selectedChapter, setSelectedChapter] = useState(project?.currentChapter || 1);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const textareaRef = useRef(null);

  // Inline AI bubble state
  const [aiBubble, setAiBubble] = useState(null); // { x, y, selectedText, input, loading, response }

  useEffect(() => {
    const ch = project?.chapters?.[selectedChapter];
    setContent(ch?.content || '');
  }, [selectedChapter, project]);

  const save = useCallback(async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const res = await api.put('/api/projects/' + project.id + '/chapters/' + selectedChapter, { content });
      if (res.success) { setSaveMsg('已保存'); const updated = await api.get('/api/projects/' + project.id); setProject(updated); }
      else setSaveMsg('保存失败');
    } catch { setSaveMsg('网络错误'); }
    setIsSaving(false);
    setTimeout(() => setSaveMsg(''), 2000);
  }, [content, selectedChapter, project, setProject]);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  // ─── Inline AI Bubble ─────────────────

  const handleTextSelect = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    if (start === end || !ta.value.slice(start, end).trim()) { setAiBubble(null); return; }
    const selectedText = ta.value.slice(start, end);
    // Position bubble near selection
    const rect = ta.getBoundingClientRect();
    // Approximate position based on selection ratio
    const ratio = start / Math.max(ta.value.length, 1);
    const y = rect.top + rect.height * ratio;
    setAiBubble({ x: rect.right + 20, y: Math.min(y, window.innerHeight - 200), selectedText, input: '', loading: false, response: '' });
  };

  const sendInlineAI = async () => {
    if (!aiBubble || !aiBubble.input.trim() || aiBubble.loading || !project) return;
    const userMsg = aiBubble.input.trim();
    setAiBubble(prev => ({ ...prev, loading: true, input: '' }));

    const prompt = '用户选中了以下文本：\n\n"' + aiBubble.selectedText + '"\n\n修改需求：' + userMsg + '\n\n请只输出修改后的文本，不要加任何解释。直接输出替换内容。';
    try {
      const ctx = { projectName: project?.name || '', genre: project?.config?.genre || '' };
      const res = await api.getRaw('/api/projects/' + project.id + '/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, mode: 'copilot', context: ctx }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', aiContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { const data = JSON.parse(line.slice(6)); if (data.type === 'final') aiContent = data.response || aiContent; } catch {}
        }
      }
      // Replace selected text in editor
      if (aiContent && aiBubble) {
        const ta = textareaRef.current;
        const start = ta.selectionStart, end = ta.selectionEnd;
        if (start !== end) {
          const newContent = content.slice(0, start) + aiContent.trim() + content.slice(end);
          setContent(newContent);
        }
        setAiBubble({ ...aiBubble, response: aiContent.trim(), loading: false, input: '' });
        setTimeout(() => setAiBubble(null), 3000);
      }
    } catch { setAiBubble(prev => ({ ...prev, loading: false })); }
  };

  const totalChapters = project?.config?.totalChapters || 65;
  const chapterList = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const wordCount = content.replace(/\s/g, '').length;

  const handleContentChange = (e) => {
    setContent(e.target.value);
    // Clear AI bubble if user starts typing
    if (aiBubble && !aiBubble.loading) setAiBubble(null);
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}><div style={styles.sidebarTitle}>📖 章节列表</div><div style={styles.sidebarCount}>{Object.keys(project?.chapters || {}).length}/{totalChapters}</div></div>
        <div style={styles.chapterList}>
          {chapterList.map(num => {
            const ch = project?.chapters?.[num], isActive = num === selectedChapter, hasContent = ch?.content && ch.content.length > 100;
            return (
              <motion.button key={num} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedChapter(num)}
                style={{ ...styles.chapterItem, background: isActive ? 'var(--accent-hover)' : 'transparent', color: isActive ? 'var(--accent)' : hasContent ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>
                <span style={styles.chapterNum}>Ch{num}</span><span style={styles.chapterName}>{ch?.title || '第' + num + '章'}</span>
                {hasContent && <span style={styles.chapterDot}>●</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div style={styles.editor}>
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}><span style={styles.chapterTitle}>第{selectedChapter}章</span><span style={styles.wordCount}>{wordCount} 字</span></div>
          <div style={styles.toolbarRight}>
            {saveMsg && <span style={{ color: saveMsg === '已保存' ? 'var(--success)' : 'var(--danger)', fontSize: '0.82em', marginRight: 12 }}>{saveMsg}</span>}
            <span style={styles.shortcutHint}>CTRL+S 保存</span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={save} style={styles.saveBtn} disabled={isSaving}>{isSaving ? '...' : '保存'}</motion.button>
          </div>
        </div>
        <textarea ref={textareaRef} value={content} onChange={handleContentChange}
          onMouseUp={handleTextSelect} onKeyUp={handleTextSelect}
          placeholder="开始写作... 选中文本后点击旁边的AI气泡进行修改" style={styles.textarea} spellCheck={false} />
      </div>

      {/* Inline AI Bubble */}
      <AnimatePresence>
        {aiBubble && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'fixed', left: aiBubble.x, top: aiBubble.y, zIndex: 1100, background: 'var(--bg-card)', borderRadius: 14, padding: 14, width: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--accent)' }}>
            {aiBubble.response ? (
              <div>
                <div style={{ fontSize: '0.72em', fontWeight: 600, color: 'var(--success)', marginBottom: 6 }}>✅ 已替换选中文本</div>
                <div style={{ fontSize: '0.75em', color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: 120, overflow: 'auto' }}>{aiBubble.response.slice(0, 200)}{aiBubble.response.length > 200 ? '...' : ''}</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.7em', color: 'var(--text-secondary)', marginBottom: 6 }}>选中文字 · 输入修改需求</div>
                <div style={{ fontSize: '0.72em', color: '#aaa', marginBottom: 8, padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: 6, maxHeight: 60, overflow: 'hidden' }}>
                  "{aiBubble.selectedText.slice(0, 80)}{aiBubble.selectedText.length > 80 ? '...' : ''}"
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={aiBubble.input} onChange={e => setAiBubble(prev => ({ ...prev, input: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') sendInlineAI(); if (e.key === 'Escape') setAiBubble(null); }}
                    placeholder="如：改得更简洁" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.78em', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} autoFocus />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={sendInlineAI}
                    disabled={aiBubble.loading} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.75em', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {aiBubble.loading ? '...' : '修改'}
                  </motion.button>
                </div>
              </>
            )}
            <button onClick={() => setAiBubble(null)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.7em' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', flex: 1, height: '100%', overflow: 'hidden', position: 'relative' },
  sidebar: { width: 220, minWidth: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' },
  sidebarTitle: { fontSize: '0.88em', fontWeight: 700 }, sidebarCount: { fontSize: '0.7em', color: 'var(--text-secondary)' },
  chapterList: { flex: 1, overflow: 'auto', padding: '8px' },
  chapterItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.82em', width: '100%', textAlign: 'left', transition: 'all 0.12s' },
  chapterNum: { fontSize: '0.75em', color: 'var(--text-secondary)', minWidth: 32 },
  chapterName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, chapterDot: { color: 'var(--success)', fontSize: '0.5em' },
  editor: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 16 }, chapterTitle: { fontSize: '1em', fontWeight: 700, color: 'var(--text-primary)' },
  wordCount: { fontSize: '0.78em', color: 'var(--text-secondary)' }, toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  shortcutHint: { fontSize: '0.68em', color: '#bbb' },
  saveBtn: { padding: '6px 18px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82em' },
  textarea: { flex: 1, padding: '24px 32px', border: 'none', outline: 'none', fontSize: '1em', lineHeight: 1.9, color: 'var(--text-primary)', background: 'var(--bg-primary)', resize: 'none', fontFamily: 'Inter, HarmonyOS Sans, MiSans, serif' },
};
