/**
 * Agent工作流引擎 —— 小说创作Agent链路
 *
 * 参考 llm-content-creator 的 LangGraph 思想
 * 简化为小说专用的5阶段Agent链路：
 *   IntentAgent → CreateAgent / ReviseAgent / DiscussAgent → QualityAgent
 */

import { IntentAgent } from './intent-agent.js';
import { CreateAgent } from './create-agent.js';
import { ReviseAgent } from './revise-agent.js';
import { DiscussAgent } from './discuss-agent.js';
import { QualityAgent } from './quality-agent.js';

export class AgentOrchestrator {
  constructor(llmAdapter, projectManager) {
    this.llm = llmAdapter;
    this.project = projectManager;

    this.intentAgent = new IntentAgent(llmAdapter);
    this.createAgent = new CreateAgent(llmAdapter, projectManager);
    this.reviseAgent = new ReviseAgent(llmAdapter, projectManager);
    this.discussAgent = new DiscussAgent(llmAdapter, projectManager);
    this.qualityAgent = new QualityAgent(llmAdapter, projectManager);
  }

  /**
   * 主入口：处理用户输入，执行完整Agent链路
   * @param {string} userInput - 用户输入
   * @param {object} context - 当前项目上下文
   * @param {string} mode - 交互模式: 'autopilot' | 'copilot' | 'manual'
   * @param {function} onStep - 每步回调，用于SSE推送
   * @returns {object} - { response, actions, context }
   */
  async process(userInput, context, mode = 'copilot', onStep = null) {
    const steps = [];

    // ① 意图理解
    this._emit(onStep, { type: 'intent_start', message: '正在理解你的意图...' });
    const intent = await this.intentAgent.analyze(userInput, context);
    this._emit(onStep, { type: 'intent_done', intent });
    steps.push({ agent: 'intent', ...intent });

    let result;

    // ② 根据意图分发
    switch (intent.type) {
      case 'create':
        this._emit(onStep, { type: 'create_start', message: '开始创作...' });
        result = await this.createAgent.execute(userInput, context, mode, onStep);
        break;

      case 'revise':
        this._emit(onStep, { type: 'revise_start', message: '定位修改内容...' });
        result = await this.reviseAgent.execute(userInput, context, mode, onStep);
        break;

      case 'discuss':
        this._emit(onStep, { type: 'discuss_start', message: '思考中...' });
        result = await this.discussAgent.execute(userInput, context, mode, onStep);
        break;

      default:
        result = { response: '我无法确定你的意图。可以换个说法再试一次吗？', actions: [] };
    }

    // ③ 如果生成了内容，触发质量检查
    if (result.actions?.some(a => a.type === 'chapter_generated')) {
      this._emit(onStep, { type: 'quality_start', message: '质量检查中...' });
      const quality = await this.qualityAgent.check(result, context);
      this._emit(onStep, { type: 'quality_done', quality });
      result.quality = quality;

      // 如果质量不达标且模式是自动，自动触发修改
      if (!quality.passed && mode === 'autopilot') {
        const fixResult = await this.reviseAgent.fixQualityIssues(result, quality, context, onStep);
        result = { ...result, ...fixResult };
      }
    }

    // ④ 更新项目上下文
    if (result.actions?.length > 0) {
      this.project.updateContext(context.projectId, result.actions);
    }

    this._emit(onStep, { type: 'done' });
    return { ...result, steps, mode };
  }

  _emit(callback, data) {
    if (callback) callback(data);
  }
}
