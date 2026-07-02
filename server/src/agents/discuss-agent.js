/**
 * DiscussAgent - 讨论 + 结构化提取
 */
export class DiscussAgent {
  constructor(llm, project) {
    this.llm = llm;
    this.project = project;
  }

  async execute(userInput, context, mode, onStep) {
    this._emit(onStep, { type: 'thinking', phase: 'reflecting', message: '思考中...' });

    const prompt = `你是小说创作讨论伙伴。用户说："${userInput.slice(0, 500)}"

当前项目：${context.projectName || '未命名'}（${context.genre || '未设定类型'}），进度第${context.currentChapter || 1}/${context.totalChapters || 65}章，已有角色：${context.characters || '暂无'}

请完成两件事，用以下JSON格式回复（只返回JSON，不要其他内容）：
{
  "response": "你的讨论回复（复述用户想法+引导问题，200字内）",
  "characters": [{"name":"角色名","traits":"特征","role":"定位"}],
  "locations": [{"name":"地点名","desc":"描述"}],
  "events": [{"name":"事件名","desc":"描述"}]
}

⚠️ 极其重要：characters/locations/events中的name必须使用用户原文中出现的名字，绝对不能自己编造或修改名字。用户说"林夜"就写"林夜"，不要改成"林深"或其他名字。如果用户没有明确提到名字，对应的数组留空。`;

    try {
      const response = await this.llm.chat(prompt);
      const data = JSON.parse(response.trim());

      const actions = [];
      for (const c of data.characters || []) {
        if (c.name) actions.push({ type: 'character_updated', data: c });
      }
      for (const l of data.locations || []) {
        if (l.name) actions.push({ type: 'location_created', data: l });
      }
      for (const e of data.events || []) {
        if (e.name) actions.push({ type: 'event_created', data: e });
      }

      return { response: data.response || '请继续描述你的想法...', actions };
    } catch (e) {
      // JSON解析失败：纯文本回复
      const fallback = await this.llm.chat(`用户说："${userInput.slice(0, 300)}"。简洁回应（100字内），可作为小说创作参考。`);
      return { response: fallback, actions: [] };
    }
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
