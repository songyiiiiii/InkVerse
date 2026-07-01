/**
 * ④ DiscussAgent - 讨论模式
 * Socratic问答法，有完整项目上下文，能读章节内容
 */

export class DiscussAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async execute(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'reflecting', message: '正在分析你的项目...' });

    // Build chapter context from server-saved data (most reliable)
    const chaptersArr = context.chapters || [];
    const chaptersDetail = chaptersArr.map(ch =>
      `## 第${ch.num}章 (${ch.wordCount || 0}字)\n${ch.preview || '(空)'}`
    ).join('\n\n');

    // Canvas context from frontend
    const fctx = context.frontendContext || {};
    const canvasNodes = fctx.canvasNodes || [];

    const prompt = `你是InkVerse的小说创作伙伴。你可以看到用户项目中的所有数据，包括章节原文。

## 项目信息
- 名称：${fctx.projectName || context.projectName || ''}
- 题材：${fctx.genre || ''}
- 进度：第${context.currentChapter || 1}/${65}章
- 人物：${context.characters || '未设定'}

## 章节原文（你可以直接引用和修改）
${chaptersDetail || '（还没有写任何章节）'}

## 画布节点
${canvasNodes.map(n => '[' + n.type + '] ' + n.title + ': ' + (n.subtitle || '')).join('\n') || '（画布为空）'}

## 用户说
"${userInput}"

你的任务：
1. 如果用户要求修改/扩写/润色章节，**请直接输出修改后的完整章节正文**。不要加任何标注、说明、统计——只输出干净的正文。用户会直接复制使用。
2. 如果用户只是想讨论想法，用苏格拉底式提问引导。
3. 不要用【原文】/【修改后】等标记。直接给成品。`;

    const response = await this.llm.chat(prompt);
    return { response, actions: [{ type: 'discussion_generated', topic: userInput.slice(0, 30) }] };
  }

  _emit(callback, data) { if (callback) callback(data); }
}
