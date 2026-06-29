/**
 * ① IntentAgent - 意图理解
 * 判断用户输入属于创作/修改/讨论哪一种
 */

export class IntentAgent {
  constructor(llm) {
    this.llm = llm;
  }

  async analyze(userInput, context) {
    const prompt = `你是一个意图分类器。分析用户输入，判断其意图类型。

当前上下文：
- 模式：${context.mode || 'copilot'}
- 项目进度：第${context.currentChapter || 0}/65章
- 最近对话：${context.recentMessages?.slice(-3).map(m => m.content).join('\n') || '无'}

用户输入："${userInput}"

请判断意图类型，仅返回JSON：
{
  "type": "create" | "revise" | "discuss",
  "subtype": "章节写作" | "大纲调整" | "人物设定" | "世界观" | "修改文本" | "讨论想法" | "询问建议",
  "confidence": 0.0-1.0,
  "targetChapter": null | 章节号,
  "keyInfo": "从用户输入中提取的关键信息，10字以内"
}`;

    const response = await this.llm.chat(prompt);
    try {
      return JSON.parse(response.trim());
    } catch {
      return { type: 'discuss', subtype: '询问建议', confidence: 0.5, keyInfo: userInput.slice(0, 10) };
    }
  }
}
