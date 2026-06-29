/**
 * ② CreateAgent - 创作模式
 * 负责生成大纲、人物、章节等新内容
 *
 * HCI核心设计：生成过程分三步展示
 *   Step 1: 理解 → "我理解你想要..."
 *   Step 2: 思路 → "我的创作思路是..."
 *   Step 3: 正文 → 逐段生成
 */

export class CreateAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async execute(userInput, context, mode, onStep) {
    const subtype = context.lastIntent?.subtype;

    if (subtype === '章节写作') {
      return this._writeChapter(userInput, context, mode, onStep);
    } else if (subtype === '人物设定') {
      return this._createCharacter(userInput, context, mode, onStep);
    } else if (subtype === '大纲调整') {
      return this._updateOutline(userInput, context, mode, onStep);
    } else {
      return this._generalCreate(userInput, context, mode, onStep);
    }
  }

  /**
   * 写章节 - 核心创作功能
   * 三种模式下的不同行为
   */
  async _writeChapter(userInput, context, mode, onStep) {
    const chapterNum = context.currentChapter || 1;
    const chapterOutline = context.outline?.[`第${chapterNum}章`] || '';

    // Step 1: 理解确认
    const understanding = `📖 开始创作第${chapterNum}章。基于大纲：${chapterOutline?.slice(0, 100) || '（未找到该章大纲，将基于上下文自由创作）'}...`;
    this._emit(onStep, { type: 'thinking', phase: 'understanding', message: understanding });

    // Step 2: 展示思路（copilot模式必须，manual模式跳过）
    if (mode !== 'manual') {
      const approachPrompt = `你是一个小说创作顾问。对于第${chapterNum}章，大纲是：
${chapterOutline || '无'}

请提供你的创作思路（100字以内，用要点列出）：
- POV选择及理由
- 本章核心情感节拍
- 与前一章的衔接方式`;

      const approach = await this.llm.chat(approachPrompt);
      this._emit(onStep, { type: 'thinking', phase: 'approach', message: `💡 创作思路：\n${approach}` });

      // copilot模式：等用户确认
      if (mode === 'copilot') {
        return {
          response: `我建议这样写：\n\n${approach}\n\n要开始吗？回复"开始"我就写。或者你有别的想法？`,
          actions: [{ type: 'approach_proposed', chapter: chapterNum, approach }],
          needsConfirmation: true
        };
      }
    }

    // Step 3: 生成正文
    this._emit(onStep, { type: 'writing', phase: 'drafting', message: '正在写作中...' });

    const chapterPrompt = this._buildChapterPrompt(chapterNum, chapterOutline, context);
    const content = await this.llm.chatStream(chapterPrompt, (chunk) => {
      this._emit(onStep, { type: 'writing_chunk', content: chunk });
    });

    return {
      response: mode === 'autopilot'
        ? `✅ 第${chapterNum}章已完成。继续下一章？`
        : `✅ 第${chapterNum}章初稿完成。要修改还是继续？`,
      content,
      actions: [{ type: 'chapter_generated', chapter: chapterNum, content }]
    };
  }

  _buildChapterPrompt(chapterNum, outline, context) {
    return `你是专业小说创作者。正在创作长篇小说《深渊回响》（悬疑惊悚无限流+BL）。

## 当前进度
- 这是第${chapterNum}章
- 前一章结尾：${context.lastChapterEnding || '故事开始'}
- 本章大纲：${outline || '基于上下文创作'}

## 人物档案
${context.characters || '参见项目设定'}

## 写作要求
- 字数：3000-4500字
- POV：第三人称限制视角（${context.preferredPOV || '宋见微'}）
- 基调：紧张悬疑，带有冷幽默底色
- 章末必须设置悬念钩子
- 避免AI写作痕迹：不使用"此外""然而""值得注意的是"等词汇
- 用动作和细节表达情感，不要直接陈述

## 特别提醒
- 宋见微：认知特质为散点扫描式注意力，习惯转笔（转=正常，停=情绪波动），金属细框眼镜从不摘
- 陆砚（如果出场）：戴黑框眼镜，擦眼镜=压抑情绪，禁欲高智气质

请直接开始写第${chapterNum}章正文。`;
  }

  async _createCharacter(userInput, context, mode, onStep) {
    // 人物创建逻辑 - 与_写章节类似的思考→草拟→确认三阶段
    return { response: '人物创建功能开发中...', actions: [] };
  }

  async _updateOutline(userInput, context, mode, onStep) {
    return { response: '大纲调整功能开发中...', actions: [] };
  }

  async _generalCreate(userInput, context, mode, onStep) {
    return { response: '请具体说明你想创作什么：新章节？人物设定？还是调整大纲？', actions: [] };
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
