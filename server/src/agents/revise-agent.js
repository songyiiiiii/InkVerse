/**
 * ③ ReviseAgent - 修改模式
 * 定位目标段落，执行修改，标注改动
 */

export class ReviseAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async execute(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'analyzing', message: '正在定位需要修改的内容...' });

    const prompt = `你是小说编辑。用户希望修改已写内容。

当前章节：第${context.currentChapter || '?'}章
章节内容摘要：${context.lastChapterSummary || '无'}
用户修改要求：${userInput}

请给出修改方案（JSON格式）：
{
  "target": "被修改的段落（前20字）",
  "changeType": "扩写 | 删减 | 改写 | 调整语气",
  "newText": "修改后的文本",
  "diff": "改动说明（20字以内）"
}`;

    const response = await this.llm.chat(prompt);
    let plan;
    try {
      plan = JSON.parse(response.trim());
    } catch {
      return { response: '我无法定位需要修改的内容。可以具体指出是哪一段吗？', actions: [] };
    }

    this._emit(onStep, { type: 'thinking', phase: 'revising', message: `修改方案：${plan.diff}` });

    return {
      response: `已修改：${plan.diff}\n\n原文 → 新文：\n> ${plan.target}...\n\n改为：\n> ${plan.newText}`,
      newText: plan.newText,
      actions: [{ type: 'revision_applied', target: plan.target, newText: plan.newText, diff: plan.diff }]
    };
  }

  async fixQualityIssues(result, quality, context, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'fixing', message: '质量未达标，自动修正中...' });
    const prompt = `这段文本存在以下质量问题：${quality.issues.join('；')}。请修改：\n${result.content}`;
    const fixed = await this.llm.chat(prompt);
    return { content: fixed, actions: [{ type: 'auto_fix_applied' }] };
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
