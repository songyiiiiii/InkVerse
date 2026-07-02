/**
 * 项目管理器 — 基于JSON文件的轻量存储
 * 管理人物档案、大纲、章节等数据
 */

import fs from 'fs';
import path from 'path';

export class ProjectManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * 创建新项目
   */
  createProject(name, config = {}) {
    const id = `proj_${Date.now()}`;
    const projectDir = path.join(this.dataDir, id);
    fs.mkdirSync(projectDir, { recursive: true });

    const project = {
      id,
      name,
      createdAt: new Date().toISOString(),
      config: {
        genre: config.genre || '悬疑',
        totalChapters: config.totalChapters || 65,
        targetWordsPerChapter: config.targetWordsPerChapter || 3500,
        ...config,
      },
      characters: [],
      outline: {},
      chapters: {},
      foreshadowing: [],
      currentChapter: 1,
      mode: 'copilot',
      context: {
        recentMessages: [],
        lastChapterEnding: '',
      }
    };

    this._save(id, 'project.json', project);
    return project;
  }

  /**
   * 获取项目
   */
  getProject(id) {
    const file = path.join(this.dataDir, id, 'project.json');
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }

  /**
   * 获取所有项目列表
   */
  listProjects() {
    if (!fs.existsSync(this.dataDir)) return [];
    return fs.readdirSync(this.dataDir)
      .filter(d => fs.existsSync(path.join(this.dataDir, d, 'project.json')))
      .map(d => {
        const p = JSON.parse(fs.readFileSync(path.join(this.dataDir, d, 'project.json'), 'utf-8'));
        return { id: p.id, name: p.name, createdAt: p.createdAt, currentChapter: p.currentChapter };
      });
  }

  /**
   * 保存章节
   */
  saveChapter(projectId, chapterNum, content, metadata = {}) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('项目不存在');

    project.chapters[chapterNum] = {
      content,
      wordCount: content.length,
      createdAt: new Date().toISOString(),
      ...metadata,
    };

    // 更新进度
    project.currentChapter = Math.max(project.currentChapter, chapterNum + 1);
    project.context.lastChapterEnding = content.slice(-100);

    this._save(projectId, 'project.json', project);
    return project;
  }

  /**
   * 删除项目
   */
  deleteProject(projectId) {
    const dir = path.join(this.dataDir, projectId);
    if (!fs.existsSync(dir)) return false;
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }

  /**
   * 更新人物档案
   */
  updateCharacter(projectId, characterData) {
    const project = this.getProject(projectId);
    const idx = project.characters.findIndex(c => c.name === characterData.name);
    if (idx >= 0) {
      project.characters[idx] = { ...project.characters[idx], ...characterData };
    } else {
      project.characters.push(characterData);
    }
    this._save(projectId, 'project.json', project);
    return project;
  }

  /**
   * 更新项目上下文
   */
  updateContext(projectId, actions) {
    const project = this.getProject(projectId);
    if (!project) return;

    for (const action of actions) {
      if (action.type === 'chapter_generated') {
        project.chapters[action.chapter] = project.chapters[action.chapter] || {};
        project.chapters[action.chapter].content = action.content;
        project.currentChapter = Math.max(project.currentChapter, action.chapter + 1);
      }
      if (action.type === 'character_updated') {
        this.updateCharacter(projectId, action.data);
      }
      if (action.type === 'outline_updated') {
        project.outline = { ...project.outline, ...action.data };
      }
      if (action.type === 'location_created' && action.data?.name) {
        project.locations = project.locations || [];
        if (!project.locations.find(l => l.name === action.data.name)) {
          project.locations.push(action.data);
        }
      }
      if (action.type === 'event_created' && action.data?.name) {
        project.events = project.events || [];
        if (!project.events.find(e => e.name === action.data.name)) {
          project.events.push(action.data);
        }
      }
    }

    this._save(projectId, 'project.json', project);
  }

  _save(projectId, filename, data) {
    const dir = path.join(this.dataDir, projectId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), 'utf-8');
  }
}
