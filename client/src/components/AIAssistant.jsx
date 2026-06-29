import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../stores/useStore';

const TABS = [
  { id: 'plot', label: '剧情建议', icon: '📝' },
  { id: 'character', label: '人物建议', icon: '👤' },
  { id: 'chapter', label: '章节建议', icon: '📖' },
  { id: 'foreshadow', label: '伏笔建议', icon: '🔮' },
  { id: 'world', label: '世界观', icon: '🌍' },
];

const MOCK_SUGGESTIONS = {
  plot: [
    { id: 1, title: '引入新冲突', desc: '在第3章中揭示系统选择玩家的真实标准，让宋见微意识到自己并非随机被选中' },
    { id: 2, title: '情感转折', desc: '陆砚在矿道中看到宋见微摘下眼镜——这是全书中他第一次看到真实的宋见微' },
    { id: 3, title: '副本设计', desc: '下一副本可基于\"黑水矿难\"历史事件，强调体制层面的罪孽' },
  ],
  character: [
    { id: 4, title: '宋见微的过去', desc: '扩展童年两个家庭切换的经历——这是伪装能力的情感根源' },
    { id: 5, title: '陆砚的执念', desc: '加强师父女儿的线索——她在矿难副本中留下的\"陆哥，别找了\"' },
  ],
  chapter: [
    { id: 6, title: '第3章建议', desc: '从白色大厅开场，两人通过声音认出彼此——笔转动的节奏 + 擦眼镜的手' },
    { id: 7, title: '第4章建议', desc: '系统发布规则，随机组队——两人分到同一组，第一次在无限流中对话' },
  ],
  foreshadow: [
    { id: 8, title: '回收\"4分37秒\"', desc: '在第3章揭示：宋见微也保留了那段录音——他在听的时候发现了同样的恐惧' },
    { id: 9, title: '回收\"眼镜停顿\"', desc: '宋见微在审讯中注意到的细节——陆砚擦眼镜时手停了一瞬。在白色大厅再次触发' },
  ],
  world: [
    { id: 10, title: '系统规则深化', desc: '系统是集体潜意识的具现——副本基于真实历史事件扭曲而成' },
    { id: 11, title: '安全区设计', desc: '白色走廊、积分商店、排名系统——三个核心机制的详细规则' },
  ],
};

export function AIAssistant({ projectId }) {
  const [activeTab, setActiveTab] = useState('plot');
  const { addNode, canvas } = useStore();

  const suggestions = MOCK_SUGGESTIONS[activeTab] || [];

  const insertToCanvas = (suggestion) => {
    // Calculate position away from existing nodes
    const offsetX = (canvas.nodes.length % 4) * 250 + 100;
    const offsetY = Math.floor(canvas.nodes.length / 4) * 180 + 400;
    addNode({
      type: activeTab === 'foreshadow' ? 'foreshadow' :
            activeTab === 'character' ? 'character' :
            activeTab === 'world' ? 'location' : 'event',
      x: offsetX,
      y: offsetY,
      title: suggestion.title,
      subtitle: suggestion.desc.slice(0, 60) + '...',
      meta: 'AI生成',
      aiGenerated: true,
    });
  };

  return (
    <aside style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>✨ AI 创作工作台</div>
        <div style={styles.headerSub}>协同创作 · 持续更新</div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <span style={{ fontSize: '0.8em' }}>{tab.icon}</span>
            <span style={{ fontSize: '0.72em' }}>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Suggestions */}
      <div style={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={styles.card}
                whileHover={{ boxShadow: 'var(--shadow-md)' }}
              >
                <div style={styles.cardTitle}>{s.title}</div>
                <div style={styles.cardDesc}>{s.desc}</div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => insertToCanvas(s)}
                  style={styles.insertBtn}
                >
                  + 插入画布
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Chat bottom */}
      <div style={styles.chatArea}>
        <textarea
          placeholder="对AI说你的想法..."
          style={styles.chatInput}
          rows={2}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={styles.chatSend}
        >
          发送
        </motion.button>
      </div>
    </aside>
  );
}

const styles = {
  panel: {
    width: 320,
    minWidth: 320,
    height: '100vh',
    background: 'var(--bg-card)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 20px 12px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitle: { fontSize: '0.95em', fontWeight: 700, color: 'var(--text-primary)' },
  headerSub: { fontSize: '0.7em', color: 'var(--text-secondary)', marginTop: 2 },
  tabs: {
    display: 'flex',
    gap: 4,
    padding: '10px 12px',
    overflow: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 14px',
  },
  card: {
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    marginBottom: 8,
    background: 'var(--bg-primary)',
    cursor: 'default',
  },
  cardTitle: { fontSize: '0.82em', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  cardDesc: { fontSize: '0.75em', color: 'var(--text-secondary)', lineHeight: 1.5 },
  insertBtn: {
    marginTop: 8,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid var(--accent)',
    background: 'transparent',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '0.7em',
    fontWeight: 600,
  },
  chatArea: {
    padding: '12px 14px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '0.8em',
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
    resize: 'none',
    outline: 'none',
  },
  chatSend: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.78em',
    fontWeight: 600,
    alignSelf: 'flex-end',
  },
};
