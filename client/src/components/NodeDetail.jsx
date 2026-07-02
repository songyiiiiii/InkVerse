import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

const TYPE_LABELS = { character: '人物', chapter: '章节', location: '地点', event: '事件', foreshadow: '伏笔' };

// Full character profiles (embedded for demo)
const CHARACTER_PROFILES = {
  '宋见微': `## 宋见微（受方）

**年龄**：24岁 | **身份**：S大心理学系研二学生
**研究方向**：人类集体潜意识与创伤记忆
**MBTI**：INTP / INFJ面具

### 外貌
身高183cm，瘦高清瘦。金属细框眼镜从不摘——那是他的面具。碎发遮眼，眼角各有一颗不对称泪痣。手指修长，转笔一分钟五种花样。冷白皮，身上是钢笔水和旧书的味道。隐形基础款衣着。

### 认知特质
注意力不是聚光灯，是散点扫描。他能同时关注房间里的每一个人、每一种微表情、每一个不对劲的细节。联想是跳跃式的——A直接跳到F，解释不清。危机时刻反而安静，触发极致专注。

### 性格核心
腹黑伪装。天生高智商，情感表达与常人不同。很小就学会"表演一个正常人"。核心价值观：没有人值得完全信任。最大恐惧：被看透。致命缺陷：无法求助。

### 家庭背景
父母十岁离婚，各自再婚。在父亲家是"省心的大儿子"，在母亲家是"不太合群的孩子"。两套面孔、两套春节、两套人生——伪装从这里开始。

### 关键关系
- 陆砚：三年前审过他的刑警。四年后深渊重逢
- 周砚秋：已故室友。每天浇他的绿植
- 师父的女儿：失踪前最后一通电话打给了他。4分37秒`,

  '陆砚': `## 陆砚（攻方·年上）

**年龄**：34岁 | **职业**：市刑警队重案组
**MBTI**：INTJ

### 外貌
身高187cm，肩宽腰窄。黑色细框眼镜从不摘。俊美型，深眼窝，嘴唇好看但干燥。精瘦爆发型身材。修长骨感的双手——虎口有旧刀疤。冷白皮，淡古龙水。禁欲衬衫系——扣子永远扣到最上面。

### 性格核心
冷静克制。情绪管理是职业训练——审讯时面无表情是基本功。核心价值观：真相高于一切。最大恐惧：再次错过。致命缺陷：过度理性化——用查案的框架理解感情。

### 家庭背景
父亲是警察，八岁那年牺牲。母亲守寡二十年，坚韧要强。从母亲身上学了"扛"和"不哭"。考警校时跟所有人说"不是为了我爸"。没有人信。

### 关键关系
- 宋见微：三年前审过的嫌疑人。放不下的是他的声音
- 师父的女儿：失踪四年。档案在抽屉最上层
- 师父：退休后在阳台上种花`,

  '周砚秋': `## 周砚秋（已故）

**年龄**：25岁（死亡时） | **身份**：S大化学系研三学生
**状态**：已故——从教学楼十三层跳下

### 性格
温和到近乎懦弱。来自小城市，家里条件不好，是导师最便宜也最好用的劳动力。从不敢拒绝。他不是一个"勇敢的人"，也不是一个"懦弱的人"——是一个被结构性权力碾压的普通人。

### 与宋见微的关系
室友。曾向宋见微诉苦。宋见微给了建议——换导师、举报、留证据。他说好。然后什么都没做。跳楼那天是周三，被导师当众羞辱后从十三层跳下。

宋见微在他死后没有掉一滴眼泪。但桌上多了一盆绿植。每天浇水。`,
};

const CHAPTER_CONTENTS = {
  1: `# 第1章 第四年

宋见微坐在三楼靠窗的位置。这个座位他花了大约两周时间选定——从那里可以看到整个楼层...

他在写论文。或者说——他的笔记本电脑上打开着论文文档，光标在第三段末尾闪烁。闪了大概四十分钟。他同时在关注五件事。

借阅台前的女生在续借一本逾期三天的书。楼梯口有人在打电话。窗外一群学生拍毕业照。有个女生笑得很开心——那种笑不是对着镜头的笑，是被人叫了名字转身时的笑，还没收住。

宋见微的笔停了。周砚秋以前也是这么笑的。

[已创作完成，3200字]`,

  2: `# 第2章 裂缝

方教授的统计课排在上午第二节。教室在四楼，窗户朝东，早上九点的阳光刚好打在倒数第三排...

他开始数教室里有多少人在看手机。十三个。

方教授在讲多元回归。宋见微的笔在转。笔记本上的涂鸦从一个几何图形变成了一组渐变的六边形。他在六边形旁边写字：第二天。方教授语速：每分钟约75字。正常人对话：每分钟约160字。

她当时：比正常语速慢。不是紧张——是控制。

[已创作完成，3200字]`,
};

export function NodeDetail({ node, onClose }) {
  const { deleteNode, updateNode, selectedNodeIds, deleteSelectedNodes, goToMainCanvas, setCurrentCanvas } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title || '');
  const [editSubtitle, setEditSubtitle] = useState(node.subtitle || '');

  const handleDelete = () => {
    if (selectedNodeIds.length > 1) { deleteSelectedNodes(); }
    else { deleteNode(node.id); }
    onClose();
  };

  const handleSave = () => { updateNode(node.id, { title: editTitle, subtitle: editSubtitle }); setIsEditing(false); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setIsEditing(false); setEditTitle(node.title || ''); setEditSubtitle(node.subtitle || ''); }
  };

  // Get full content if available
  const fullProfile = CHARACTER_PROFILES[node.title];
  const chapterContent = node.chapterNum ? CHAPTER_CONTENTS[node.chapterNum] : null;
  const hasFullContent = !!(fullProfile || chapterContent);

  const handleOpenChapter = () => {
    if (node.type === 'chapter' && node.chapterNum) {
      setCurrentCanvas(`chapter-${node.chapterNum}`, node.chapterNum);
      onClose();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="glass-overlay" style={styles.overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()} className="glass-heavy" style={{ ...styles.panel, ...(hasFullContent ? styles.panelWide : {}) }}>

        <div style={styles.type}>{TYPE_LABELS[node.type] || '事件'}</div>

        {isEditing ? (
          <>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={handleKeyDown}
              style={styles.editInput} placeholder="标题" autoFocus />
            <textarea value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} onKeyDown={handleKeyDown}
              style={styles.editTextarea} placeholder="描述" rows={3} />
            <div style={styles.editHint}>Enter 保存 · Esc 取消</div>
          </>
        ) : (
          <>
            <h2 style={styles.title} onDoubleClick={() => setIsEditing(true)}>{node.title}</h2>
            <p style={styles.subtitle} onDoubleClick={() => setIsEditing(true)}>{node.subtitle}</p>
            {node.meta && <p style={styles.meta}>{node.meta}</p>}
            {node.aiGenerated && <div style={styles.aiTag}>✨ AI 生成</div>}

            {/* Full content */}
            {fullProfile && (
              <div style={styles.contentBox}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.82em', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                  {fullProfile}
                </div>
              </div>
            )}

            {chapterContent && (
              <div style={styles.contentBox}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.82em', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                  {chapterContent}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {isEditing ? (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} style={styles.editBtn}>保存</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsEditing(false)} style={styles.cancelBtn}>取消</motion.button>
            </>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsEditing(true)} style={styles.editBtn}>编辑</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete} style={styles.deleteBtn}>
                删除{selectedNodeIds.length > 1 ? ` (${selectedNodeIds.length}个)` : ''}
              </motion.button>
            </>
          )}
        </div>

        {node.type === 'chapter' && node.chapterNum && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleOpenChapter} style={styles.openChapterBtn}>
            📖 打开章节子画布
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  panel: { borderRadius: 18, padding: '28px', width: 440, maxHeight: '80vh', overflow: 'auto' },
  panelWide: { width: 580 },
  type: { fontSize: '0.7em', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 8 },
  title: { fontSize: '1.2em', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, cursor: 'text' },
  subtitle: { fontSize: '0.9em', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, cursor: 'text' },
  meta: { fontSize: '0.8em', color: '#aaa', marginBottom: 8 },
  aiTag: { display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 6, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: '0.72em', fontWeight: 600 },
  contentBox: { marginTop: 16, padding: '16px 18px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', maxHeight: 320, overflow: 'auto' },
  editInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--accent)', fontSize: '1.1em', fontWeight: 700, marginBottom: 10, outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-primary)' },
  editTextarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9em', lineHeight: 1.5, marginBottom: 6, outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-primary)', resize: 'vertical', fontFamily: 'inherit' },
  editHint: { fontSize: '0.7em', color: '#aaa', marginBottom: 12 },
  actions: { display: 'flex', gap: 8, marginTop: 16 },
  editBtn: { flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
  deleteBtn: { flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
  cancelBtn: { flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
  openChapterBtn: { width: '100%', marginTop: 10, padding: '8px', borderRadius: 8, border: '1px dashed var(--accent)', background: 'var(--accent-hover)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85em' },
};
