/**
 * ① IntentAgent - 意图理解
 * 高准确率判断用户创作意图
 */
export class IntentAgent {
  constructor(llm) { this.llm = llm; }

  async analyze(userInput, context) {
    // 快速关键词检测（避免调用 LLM 做简单判断）
    const input = userInput.trim();
    const lower = input.toLowerCase();

    // 确认回复检测
    if (/^(开始|好的|写吧|行|ok|yes|可以|go|start|写|快写|生成|继续|嗯|对|是的|okay|sure|please|确认|搞|弄|来吧)$/i.test(input)) {
      return { type: 'create', subtype: '章节写作', confidence: 1.0, targetChapter: context.currentChapter, keyInfo: '用户确认' };
    }

    // 关键词快速路由
    const createPatterns = [
      { words: ['创建', '新增', '添加', '加一个', '新建', '增加', '加个', '造一个', '建一个', '设定'], subtype: '人物设定' },
      { words: ['写', '生成', '创作', '写第', '帮我写', '写一下', '写一章', '写这章', '开始写', '往下写', '继续写'], subtype: '章节写作' },
      { words: ['人物', '角色', '主角', '反派', '配角', '人设', '性格', '主角叫', '反派叫', '角色叫', '主人公', '有个'], subtype: '人物设定' },
      { words: ['大纲', '剧情', '情节', '故事线', '章节规划', '故事结构', '分章', '章纲'], subtype: '大纲调整' },
      { words: ['世界观', '世界设定', '背景', '设定', '魔法体系', '科技树', '架空', '世界观设定'], subtype: '世界观' },
      { words: ['地点', '场景', '地图', '城镇', '城市', '建筑', '学校', '基地', '在哪', '发生在', '地点在'], subtype: '世界观' },
      { words: ['事件', '冲突', '转折', '悬念', '伏笔', '发生了', '关键情节'], subtype: '大纲调整' },
    ];

    for (const pattern of createPatterns) {
      if (pattern.words.some(w => lower.includes(w))) {
        const chapterMatch = input.match(/第\s*(\d+)\s*章/);
        return {
          type: 'create',
          subtype: pattern.subtype,
          confidence: 0.85,
          targetChapter: chapterMatch ? parseInt(chapterMatch[1]) : (context.currentChapter || null),
          keyInfo: input.slice(0, 15),
        };
      }
    }

    // 修改检测
    if (/^(改|修改|调整|换成|不要|删|去掉|重写|修订)/i.test(input) || lower.includes('改一下')) {
      return { type: 'revise', subtype: '修改文本', confidence: 0.8, targetChapter: context.currentChapter, keyInfo: input.slice(0, 15) };
    }

    // 剩下的用 LLM 判断（兜底）
    const prompt = `判断用户意图类型。
上下文：项目进度章${context.currentChapter || 0}，最近对话：${(context.recentMessages || []).slice(-2).map(m => (m.content||'').slice(0,30)).join(' / ') || '无'}
用户输入："${input.slice(0, 200)}"
返回JSON：{"type":"create|revise|discuss","subtype":"章节写作|大纲调整|人物设定|世界观|修改文本|讨论想法|询问建议","confidence":0.0-1.0,"targetChapter":null}`;

    try {
      const response = await this.llm.chat(prompt);
      return JSON.parse(response.trim());
    } catch {
      return { type: 'create', subtype: '章节写作', confidence: 0.5, targetChapter: context.currentChapter, keyInfo: input.slice(0, 10) };
    }
  }
}
