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
import { UserManager } from './utils/user-manager.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { authMiddleware, optionalAuth } from './middleware/auth.js';

config();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// 初始化核心组件
const llm = new LLMAdapter({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
  model: process.env.DEEPSEEK_MODEL,
});
const projects = new ProjectManager(process.env.DATA_DIR || './data');
const users = new UserManager(process.env.DATA_DIR || './data');
const orchestrator = new AgentOrchestrator(llm, projects);

// ─── 认证路由 ───────────────────────────────────

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: '用户名至少3个字符' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6个字符' });
  }

  const result = users.register(username, password, email || '');
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    user: result.user,
    token: result.token,
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }

  const result = users.login(username, password);
  
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({
    success: true,
    user: result.user,
    token: result.token,
  });
});

// 验证Token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  const token = authHeader.substring(7);
  const decoded = users.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token无效' });
  }

  const user = users.getUser(decoded.username);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  res.json({ success: true, user });
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.getUser(req.username);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// ─── REST API ───────────────────────────────────

// 项目列表（仅返回当前用户的项目）
app.get('/api/projects', authMiddleware, (req, res) => {
  const userProjects = users.getUserProjects(req.username);
  const allProjects = projects.listProjects();
  const filtered = allProjects.filter(p => userProjects.includes(p.id));
  res.json(filtered);
});

// 创建项目（自动关联到当前用户）
app.post('/api/projects', authMiddleware, (req, res) => {
  const { name, config } = req.body;
  const project = projects.createProject(name, config);
  
  // 关联项目到用户
  users.addProject(req.username, project.id);
  
  res.json(project);
});

// 获取项目详情（验证用户是否有权限）
app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  // 验证用户是否有权限访问此项目
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }
  
  res.json(project);
});

// 获取章节内容
app.get('/api/projects/:id/chapters/:num', authMiddleware, (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }
  
  const chapter = project?.chapters?.[req.params.num];
  if (!chapter) return res.status(404).json({ error: '章节不存在' });
  res.json(chapter);
});

// 保存章节内容
app.put('/api/projects/:id/chapters/:num', authMiddleware, (req, res) => {
  const { content } = req.body;
  
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }
  
  const project = projects.saveChapter(req.params.id, parseInt(req.params.num), content);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json({ success: true, chapter: project.chapters[req.params.num] });
});

// 导出项目为TXT
app.get('/api/projects/:id/export', authMiddleware, (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }

  let output = `《${project.name}》\n`;
  output += `题材：${project.config?.genre || ''}\n`;
  output += `创建时间：${project.createdAt}\n`;
  output += `${'='.repeat(50)}\n\n`;

  const total = project.config?.totalChapters || 65;
  for (let i = 1; i <= total; i++) {
    const ch = project.chapters?.[i];
    if (ch?.content && ch.content.length > 100) {
      output += `第${i}章\n\n${ch.content}\n\n`;
      output += `${'-'.repeat(30)}\n\n`;
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(project.name)}.txt"`);
  res.send(output);
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }
  
  const success = projects.deleteProject(req.params.id);
  if (!success) return res.status(404).json({ error: '项目不存在' });
  
  // 从用户中移除项目关联
  users.removeProject(req.username, req.params.id);
  
  res.json({ success: true });
});

// ─── 核心：Agent交互接口 (SSE流式) ──────────────

app.post('/api/projects/:id/chat', authMiddleware, async (req, res) => {
  const { message, mode } = req.body;
  const projectId = req.params.id;
  const project = projects.getProject(projectId);

  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(projectId)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }

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
app.patch('/api/projects/:id/mode', authMiddleware, (req, res) => {
  const project = projects.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  
  const userProjects = users.getUserProjects(req.username);
  if (!userProjects.includes(req.params.id)) {
    return res.status(403).json({ error: '无权访问此项目' });
  }

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