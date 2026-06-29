/**
 * ④ DiscussAgent - 讨论模式
 * Socratic问答法 —— 不给答案，引导用户澄清自己的想法
 * 这是HCI的亮点：AI是"会提问的助手"，不是替你做决定的人
 */

export class DiscussAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async execute(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'reflecting', message: '思考中...' });

    const prompt = `你是小说创作讨论伙伴，不直接生成内容。用苏格拉底式提问法引导创作者自己想清楚。

用户说："${userInput}"
当前项目上下文：${JSON.stringify({
  题材: '悬疑惊悚无限流+BL',
  进度: `第${context.currentChapter || 1}/65章`,
  人物: context.characters?.split('\n')?.slice(0, 3)?.join(', ') || '已设定',
})}

你的任务：
1. 先复述你理解到的用户想法（1句）
2. 问2-3个引导性问题，帮助用户更清晰地定义自己的想法
3. 给出1个建设性建议（可选，用"如果你想要..."开头）

风格：冷幽默但真诚。不要用教育学口吻。"`;

    const response = await this.llm.chat(prompt);

    return {
      response,
      actions: [{ type: 'discussion_generated', topic: userInput.slice(0, 30) }]
    };
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
