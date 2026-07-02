/**
 * LLM适配器 — 封装DeepSeek API调用
 * 支持普通对话和流式输出
 */

import OpenAI from 'openai';

export class LLMAdapter {
  constructor(config) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: config.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    });
    this.model = config.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  /**
   * 普通对话
   */
  async chat(prompt, systemPrompt = '') {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt || '你是一个专业的小说创作助手。回答简洁精确。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4096,
    });
    return response.choices[0].message.content;
  }

  /**
   * 流式对话 — 用于逐字展示AI写作过程
   */
  async chatStream(prompt, onChunk) {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: '你是一个专业的小说创作助手。直接输出小说正文，不要加任何前言后语。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4096,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
    }
    return fullContent;
  }
}
