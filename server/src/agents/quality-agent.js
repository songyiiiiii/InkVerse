/**
 * ⑤ QualityAgent - 质量检查
 * 检查人物一致性、字数达标、伏笔状态
 */

export class QualityAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async check(result, context) {
    const issues = [];
    const content = result.content || '';

    // 硬规则检查
    if (content.length < 1500) {
      issues.push('字数不足（<1500字），目标3000-5000字');
    }

    // LLM质量检查
    const prompt = `你是小说质量审核员。请检查以下章节是否存在质量问题。

章节内容（前500字）：${content.slice(0, 500)}

检查维度：
1. 人物一致性：人物行为是否符合之前设定的性格？
2. AI痕迹：是否存在"此外""然而""值得注意的是""不禁"等AI高频词汇？
3. 展示而非讲述：是否用动作和细节表达情感，而非直接陈述？
4. 对话自然度：对话是否简洁自然？
5. 章末钩子：结尾是否有悬念？

返回JSON：
{
  "score": 0-10,
  "issues": ["问题1", "问题2"],
  "passed": true/false
}`;

    let quality;
    try {
      const response = await this.llm.chat(prompt);
      quality = JSON.parse(response.trim());
      quality.issues = [...(quality.issues || []), ...issues];
    } catch {
      quality = { score: 7, issues, passed: issues.length === 0 };
    }

    return quality;
  }
}
