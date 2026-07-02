import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';
import { VRMAvatar } from './VRMAvatar';

const TABS = [
  { id: 'plot', label: '剧情', icon: '📝' },
  { id: 'character', label: '人物', icon: '👤' },
  { id: 'chapter', label: '章节', icon: '📖' },
  { id: 'foreshadow', label: '伏笔', icon: '🔮' },
  { id: 'world', label: '世界观', icon: '🌍' },
];

export function AIAssistant({ projectId }) {
  const [activeTab, setActiveTab] = useState('plot');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const { project, addNode, canvas, setAiStreaming, setAiStreamingChapter, appendAiContent, clearAiContent, triggerChapterSave } = useStore();

  // AI 生成的内容自动添加到画布
  const addAiNodeToCanvas = (type, title, subtitle, meta) => {
    const types = { character: 'character', event: 'event', location: 'location', chapter: 'chapter' };
    const count = canvas.nodes.filter(n => n.type === (types[type] || 'event')).length;
    addNode({
      type: types[type] || 'event',
      x: 100 + (count % 4) * 250,
      y: type === 'chapter' ? 40 : type === 'character' ? 520 : type === 'location' ? 720 : 280,
      title: title || '',
      subtitle: subtitle || '',
      meta: meta || 'AI生成',
      aiGenerated: true,
    });
  };
  const msgRef = useRef(null);

  // 项目级聊天历史：切换项目时重新加载
  useEffect(() => {
    if (project?.context?.recentMessages) {
      setMessages(project.context.recentMessages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.slice(0, 500) : '',
      })));
    } else {
      setMessages([]);
    }
  }, [project?.id]);

  useEffect(() => { if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight; }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, mode: 'copilot' }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';

      setSpeaking(true); // AI 开始"说话"

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'writing_chunk') {
              // AI 正在流式写正文 → 推送到编辑器
              appendAiContent(data.content || '');
            } else if (data.type === 'create_start') {
              setAiStreamingChapter(data.chapter || null);
              clearAiContent();
              setAiStreaming(true);
              setSpeaking(true);
            } else if (data.type === 'final') {
              aiContent = data.response || aiContent;
              setSpeaking(false);
              setAiStreaming(false);
              const items = parseSuggestions(aiContent, activeTab);
              setSuggestions(items);
              // 处理所有 action
              console.log('[AI] final actions:', JSON.stringify(data.actions));
              if (data.actions?.length > 0) {
                for (const action of data.actions) {
                  console.log('[AI] processing action:', action.type, action.data?.name || '');
                  if (action.type === 'chapter_generated' && action.chapter) {
                    triggerChapterSave(action.chapter); clearAiContent();
                    if (!canvas.nodes.find(n => n.chapterNum === action.chapter)) {
                      addAiNodeToCanvas('chapter', `第${action.chapter}章`, '已生成', `${(action.content||'').length}字`);
                    }
                  }
                  if (action.type === 'character_updated' && action.data?.name) {
                    if (!canvas.nodes.find(n => n.type==='character' && n.title===action.data.name)) {
                      addAiNodeToCanvas('character', action.data.name, action.data.role||action.data.traits||'', action.data.background?.slice(0,60)||'');
                    }
                  }
                  if (action.type === 'location_created' && action.data?.name) {
                    if (!canvas.nodes.find(n => n.type==='location' && n.title===action.data.name)) {
                      addAiNodeToCanvas('location', action.data.name, action.data.desc?.slice(0,60)||'', 'AI生成');
                    }
                  }
                  if (action.type === 'event_created' && action.data?.name) {
                    if (!canvas.nodes.find(n => n.type==='event' && n.title===action.data.name)) {
                      addAiNodeToCanvas('event', action.data.name, action.data.desc?.slice(0,60)||'', 'AI生成');
                    }
                  }
                  if (action.type === 'outline_updated' && action.data) {
                    for (const [chName,desc] of Object.entries(action.data)) {
                      const n = parseInt(String(chName).match(/\d+/)?.[0]); if (n && !canvas.nodes.find(cn=>cn.chapterNum===n)) {
                        addAiNodeToCanvas('chapter', chName, String(desc).slice(0,60), 'AI大纲');
                      }
                    }
                  }
                }
              }
            } else if (data.type === 'character_created') {
              const cd = data.charData;
              if (cd?.name) {
                addAiNodeToCanvas('character', cd.name, `${cd.role || ''} | ${cd.traits || ''}`, cd.background?.slice(0, 60) || 'AI生成');
              }
            } else if (data.type === 'error') {
              aiContent = '❌ ' + (data.message || '未知错误');
              setSpeaking(false);
              setLoading(false);
            } else if (data.type === 'intent_done') {
              setSpeaking(true);
            }
          } catch {}
        }
      }
      if (aiContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 连接失败，请检查后端服务是否运行。' }]);
      setSpeaking(false);
    }
    setLoading(false);
    setSpeaking(false);
  };

  const insertToCanvas = (s) => {
    const types = { plot: 'event', character: 'character', chapter: 'chapter', foreshadow: 'foreshadow', world: 'location' };
    addNode({
      type: types[activeTab] || 'event',
      x: 100 + (canvas.nodes.length % 4) * 250,
      y: 600 + Math.floor(canvas.nodes.length / 4) * 180,
      title: s.title,
      subtitle: s.desc.slice(0, 80),
      meta: 'AI生成',
      aiGenerated: true,
    });
  };

  return (
    <aside style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>✨ AI 创作工作台</div>
        <div style={styles.headerSub}>输入创作想法，AI实时响应</div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(tab => (
          <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tab, background: activeTab === tab.id ? 'var(--accent)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)' }}>
            <span>{tab.icon}</span><span style={{ fontSize: '0.7em' }}>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Messages + Suggestions */}
      <div style={styles.content} ref={msgRef}>
        {messages.length === 0 && suggestions.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginBottom: 4 }}>告诉我你的创作想法</div>
            <div style={{ fontSize: '0.7em', color: '#aaa' }}>例如："帮我构思第3章的开场"</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.msg, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'var(--accent-hover)' : 'var(--bg-primary)', color: m.role === 'user' ? 'var(--accent)' : 'var(--text-primary)' }}>
            {m.content.length > 300 ? m.content.slice(0, 300) + '...' : m.content}
          </div>
        ))}
        {suggestions.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={styles.card}>
            <div style={styles.cardTitle}>{s.title}</div>
            <div style={styles.cardDesc}>{s.desc}</div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => insertToCanvas(s)} style={styles.insertBtn}>+ 插入画布</motion.button>
          </motion.div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8em', padding: 12 }}>✨ AI思考中...</div>}
      </div>

      {/* 聊天输入 */}
      <div style={styles.chatArea}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
          placeholder="输入创作想法..." style={styles.chatInput} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendMessage} disabled={loading}
          style={{ ...styles.chatSend, opacity: loading ? 0.5 : 1 }}>发送</motion.button>
      </div>

      <div style={styles.avatarFloat}>
        <VRMAvatar mode="project" isThinking={loading} isSpeaking={speaking} height={400} />
      </div>
    </aside>
  );
}

function parseSuggestions(text, tab) {
  const items = [];
  const lines = text.split(/\d+\.\s+/).filter(Boolean);
  for (const line of lines) {
    const colon = line.indexOf('：') >= 0 ? '：' : line.indexOf(':') >= 0 ? ':' : null;
    if (colon) {
      items.push({ title: line.slice(0, colon).trim().slice(0, 30), desc: line.slice(colon + 1).trim().slice(0, 120) });
    } else if (line.trim().length > 10) {
      items.push({ title: line.trim().slice(0, 30), desc: line.trim().slice(0, 120) });
    }
  }
  return items.slice(0, 5);
}

const styles = {
  panel: { width: 320, minWidth: 320, height: '100vh', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'visible', position: 'relative' },
  avatarFloat: {
    position: 'absolute', left: -250, bottom: 20,
    width: 250, height: 400, borderRadius: 14,
    overflow: 'hidden', zIndex: 1,
  },
  header: { padding: '16px 18px 10px', borderBottom: '1px solid var(--border)' },
  headerTitle: { fontSize: '0.9em', fontWeight: 700, color: 'var(--text-primary)' },
  headerSub: { fontSize: '0.68em', color: 'var(--text-secondary)', marginTop: 2 },
  tabs: { display: 'flex', gap: 3, padding: '8px 10px', overflow: 'auto' },
  tab: { display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontSize: '0.78em' },
  content: { flex: 1, overflow: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  empty: { textAlign: 'center', padding: '30px 0' },
  msg: { padding: '8px 12px', borderRadius: 10, fontSize: '0.78em', lineHeight: 1.5, maxWidth: '90%' },
  card: { padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)' },
  cardTitle: { fontSize: '0.8em', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 },
  cardDesc: { fontSize: '0.73em', color: 'var(--text-secondary)', lineHeight: 1.5 },
  insertBtn: { marginTop: 6, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.68em', fontWeight: 600 },
  chatArea: { padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 },
  chatInput: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8em', color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none' },
  chatSend: { padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.75em', fontWeight: 600 },
};
