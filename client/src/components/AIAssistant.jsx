import { api } from '../api.js';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';

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
  const [suggestions, setSuggestions] = useState([]);
  const { addNode, canvas } = useStore();
  const msgRef = useRef(null);

  useEffect(() => { if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight; }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await api.getRaw(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, mode: 'copilot' }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';

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
            if (data.type === 'final') {
              aiContent = data.response || aiContent;
              // Parse suggestions from AI response
              const items = parseSuggestions(aiContent, activeTab);
              setSuggestions(items);
            } else if (data.type === 'thinking') {
              // Show thinking state
            }
          } catch {}
        }
      }
      if (aiContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 连接失败，请检查后端服务是否运行。' }]);
    }
    setLoading(false);
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
            <div style={{ fontSize: '2em', marginBottom: 8 }}>💬</div>
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

      {/* Chat input */}
      <div style={styles.chatArea}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
          placeholder="输入创作想法..." style={styles.chatInput} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendMessage} disabled={loading}
          style={{ ...styles.chatSend, opacity: loading ? 0.5 : 1 }}>发送</motion.button>
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
  panel: { width: 320, minWidth: 320, height: '100vh', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '16px 18px 10px', borderBottom: '1px solid var(--border)' },
  headerTitle: { fontSize: '0.9em', fontWeight: 700, color: 'var(--text-primary)' },
  headerSub: { fontSize: '0.68em', color: 'var(--text-secondary)', marginTop: 2 },
  tabs: { display: 'flex', gap: 3, padding: '8px 10px', overflow: 'auto' },
  tab: { display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontSize: '0.78em' },
  content: { flex: 1, overflow: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  empty: { textAlign: 'center', padding: '40px 0' },
  msg: { padding: '8px 12px', borderRadius: 10, fontSize: '0.78em', lineHeight: 1.5, maxWidth: '90%' },
  card: { padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)' },
  cardTitle: { fontSize: '0.8em', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 },
  cardDesc: { fontSize: '0.73em', color: 'var(--text-secondary)', lineHeight: 1.5 },
  insertBtn: { marginTop: 6, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.68em', fontWeight: 600 },
  chatArea: { padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 },
  chatInput: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8em', color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none' },
  chatSend: { padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.78em', fontWeight: 600 },
};
