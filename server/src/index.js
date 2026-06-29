/**
 * Novel HCI Server — Express主程序
 *
 * 提供 REST API + SSE流式输出
 * 支持三种交互模式的动态切换
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { LLMAdapter } from './utils/llm-adapter.js';
import { ProjectManager } from './utils/project-manager.js';
import { AgentOrchestrator } from './agents/orchestrator.js';

config();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化核心组件
const llm = new LLMAdapter({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
  model: process.env.DEEPSEEK_MODEL,
});
const projects = new ProjectManager(process.env.DATA_DIR || './data');
const orchestrator = new AgentOrchestrator(llm, projects);

// ─── REST API ───────────────────────────────────

// 项目列表
app.get('/api/projects', (req, res) => {
  res.json(projects.listProjects());
});

// 创建项目
app.post('/api/projects', (req, res) => {
  const { name, config } = req.body;
  const project = projects.createProject(name, config);
  res.json(project);
});

// 获取项目详情
app.get('/api/projects/:id', (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json(project);
});

// 获取章节内容
app.get('/api/projects/:id/chapters/:num', (req, res) => {
  const project = projects.getProject(req.params.id);
  const chapter = project?.chapters?.[req.params.num];
  if (!chapter) return res.status(404).json({ error: '章节不存在' });
  res.json(chapter);
});

// ─── 核心：Agent交互接口 (SSE流式) ──────────────

app.post('/api/projects/:id/chat', async (req, res) => {
  const { message, mode } = req.body;
  const projectId = req.params.id;
  const project = projects.getProject(projectId);

  if (!project) return res.status(404).json({ error: '项目不存在' });

  // 设置SSE头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const emit = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 更新上下文
    const context = {
      projectId,
      mode: mode || project.mode || 'copilot',
      currentChapter: project.currentChapter,
      outline: project.outline,
      characters: project.characters.map(c => `${c.name}(${c.role})`).join(', '),
      lastChapterEnding: project.context?.lastChapterEnding || '',
      recentMessages: project.context?.recentMessages || [],
      preferredPOV: project.config?.preferredPOV || '宋见微',
    };

    // 执行Agent链路
    const result = await orchestrator.process(message, context, context.mode, emit);

    // 保存消息到上下文
    project.context.recentMessages = [
      ...(project.context.recentMessages || []).slice(-9),
      { role: 'user', content: message },
      { role: 'assistant', content: result.response },
    ];
    projects._save(projectId, 'project.json', project);

    // 发送最终结果
    emit({ type: 'final', ...result });
  } catch (error) {
    emit({ type: 'error', message: error.message });
  }

  res.end();
});

// 切换交互模式
app.patch('/api/projects/:id/mode', (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  project.mode = req.body.mode;
  projects._save(req.params.id, 'project.json', project);

  res.json({
    mode: project.mode,
    modes: {
      autopilot: 'AI主导：自动推进，你随时叫停',
      copilot: '协同讨论：AI给建议，你做决定',
      manual: '用户主导：你下指令，AI执行',
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'copilot' });
});

// ─── 启动 ───────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📚 Novel HCI Server running at http://localhost:${PORT}`);
  console.log(`   交互模式: 协同讨论(copilot) | 自由切换`);
  console.log(`   Agent链路: Intent → Create/Revise/Discuss → Quality`);
});
