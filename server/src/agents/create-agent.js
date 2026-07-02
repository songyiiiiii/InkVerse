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

    // 检查是否是用户确认
    const confirmWords = /(开始|好的|写吧|行|ok|yes|可以|go|start|写|快写|生成|继续|嗯|对|是的|okay|sure|please|确认|搞|弄|来吧)/i;
    const isConfirm = confirmWords.test(userInput.trim());
    console.log('[CreateAgent] _writeChapter called, isConfirm:', isConfirm, 'mode:', mode, 'userInput:', userInput.trim());

    // Step 2: 展示思路（copilot模式需要，但确认后跳过）
    if (mode !== 'manual' && !isConfirm) {
      console.log('[CreateAgent] 进入思路展示+确认流程');
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

    console.log('[CreateAgent] ✅ 跳过确认，直接进入写作');
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
    const projectName = context.projectName || '未命名作品';
    const genre = context.genre || '小说';
    const totalChapters = context.totalChapters || 65;
    const preferredPOV = context.preferredPOV || '主角';
    const synopsis = context.synopsis || '';

    return `你是专业小说创作者。正在创作长篇小说《${projectName}》（${genre}）。

## 项目设定
- 总章节数：${totalChapters}章
- 故事简介：${synopsis || '由用户提供'}
- 当前进度：第${chapterNum}章 / 共${totalChapters}章

## 前一章信息
- 前一章结尾：${context.lastChapterEnding || '这是故事的开头'}

## 本章大纲
${outline || '（用户未提供本章大纲，请基于故事简介和前一章结尾自由发挥，保持连贯）'}

## 人物档案
${context.characters || '（暂无详细人物设定，请在写作中自然引入角色）'}

## 写作要求
- 字数：2000-3500字（根据内容需要灵活调整）
- 类型：${genre}
- POV视角：${context.preferredPOV ? `以${preferredPOV}的视角展开` : '选择最合适的视角'}
- 章末设置悬念或情感钩子，吸引读者继续阅读
- 用动作和细节表达情感，不要直接陈述
- 对话自然，符合角色性格
- 避免"此外""然而""值得注意的是"等AI写作痕迹

## 重要
- 根据项目设定和用户之前的讨论来写，不要编造与设定不符的内容
- 如果用户指定了具体方向，严格遵循
- 保持与前文的一致性

请直接开始写第${chapterNum}章正文。`;
  }

  async _createCharacter(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'creating', message: '正在构思人物...' });

    const prompt = `你是小说人物设计专家。根据用户需求创建人物档案。

项目背景：${context.genre || '小说'}
已有角色：${context.characters || '无'}
用户需求：${userInput}

⚠️ 名字必须使用用户原文中提到的名字，绝对不能自己编造！

请用JSON格式返回（只返回JSON）：
{
  "name": "角色姓名（必须来自用户原文）",
  "role": "角色定位",
  "traits": "性格特征（20字内）",
  "background": "背景故事（50字内）",
  "relation": "与其他角色的关系"
}`;

    const response = await this.llm.chat(prompt);
    let charData;
    try { charData = JSON.parse(response.trim()); } catch {
      charData = { name: '新角色', role: '待定', traits: response.slice(0, 50), background: '', relation: '' };
    }

    this._emit(onStep, { type: 'character_created', charData });
    return {
      response: `✅ 已创建角色「${charData.name}」：${charData.traits}`,
      actions: [{ type: 'character_updated', data: charData }]
    };
  }

  async _updateOutline(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'outline', message: '正在调整大纲...' });

    const currentOutline = JSON.stringify(context.outline || {});
    const prompt = `你是小说大纲规划专家。根据用户需求调整章节大纲。
当前大纲：${currentOutline.slice(0, 500) || '（暂无）'}
总章节数：${context.totalChapters || 65}
用户需求：${userInput}

请用JSON格式返回更新后的大纲（章节号→内容描述）：
{
  "第1章": "章节内容描述",
  "第2章": "..."
}
只返回JSON，至少返回前5章。`;

    const response = await this.llm.chat(prompt);
    let outline;
    try { outline = JSON.parse(response.trim()); } catch {
      outline = { [`第${context.currentChapter}章`]: response.slice(0, 100) };
    }

    return {
      response: `✅ 大纲已更新（${Object.keys(outline).length}章）`,
      actions: [{ type: 'outline_updated', data: outline }]
    };
  }

  async _generalCreate(userInput, context, mode, onStep) {
    // 综合创作：分析用户需求，可能同时涉及人物+章节+大纲
    const prompt = `你是一个创作助手。用户说："${userInput}"
项目：${context.projectName || '未命名'}（${context.genre || '小说'}）
当前进度：第${context.currentChapter}章

请回复：
1. 理解用户想创作什么
2. 给出建议或直接开始创作
保持回复简洁有用（200字以内）。`;

    const response = await this.llm.chat(prompt);
    return { response, actions: [] };
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
