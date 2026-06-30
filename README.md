# ✧ InkVerse

> **Where Stories Become Universes.**
>
> AI 驱动的沉浸式小说创作平台 —— 不是聊天机器人，是你的故事宇宙工作台。

---

## 🎯 产品定位

InkVerse 是一个人机交互（HCI）课程项目，探索**自然语言对话式交互如何降低 AI 辅助创意写作的认知门槛**。

与传统 AI 写作工具不同，InkVerse 的核心交互不是聊天窗口，而是一个**可无限拖拽、缩放、节点连接的 Story Canvas**——将小说结构从线性文本转化为空间化节点网络。

---

## ✨ 核心特性

### 🗺 Story Canvas
- **无限画布**：滚轮缩放（15%～300%），空格+拖拽平移
- **节点系统**：人物 / 章节 / 地点 / 事件 / 伏笔 五种类型，分色标识
- **节点连接**：可视化人物关系网、章节大纲链、伏笔生命周期
- **双层画布**：总画布（全局大纲）+ 章节子画布（双击章节节点进入）

### 🎨 交互设计
- **短按选中 · 长按拖拽**：<200ms 点击 = 选中编辑，≥200ms = 移动节点
- **Shift 框选**：批量选中，Delete 一键删除
- **CTRL+Z 撤回**：50 步历史栈，操作无忧
- **右键菜单**：编辑 / 连接 / 复制 / 删除
- **双击创建**：画布空白处双击即建新节点

### ✍️ 章节编辑器
- 65章列表侧栏，已写章节绿点标识
- 沉浸式写作区，实时字数统计
- **CTRL+S** 保存，项目数据持久化
- 支持导出为 **TXT 格式**（兼容主流小说平台上传）

### 🤖 AI 创作工作台
- 5 个 Tab：剧情 / 人物 / 章节 / 伏笔 / 世界观
- **真实 API 交互**：SSE 流式响应，AI 实时生成建议
- AI 生成节点带紫色 Glow，一键插入画布

### 🏠 项目管理
- **AI 辅助创建向导**：2 步引导，自动生成世界观+大纲
- 模板快速开始，同名校验防重复
- 项目删除 + **TXT 导出**，支持上传主流创作平台

### 🎪 三种交互模式
| 模式 | 说明 |
|------|------|
| 🤖 AI 主导 | AI 自动推进创作，用户随时叫停 |
| 🤝 协同讨论 | AI 给建议+提问，每一步等用户确认 |
| ✋ 用户主导 | 用户下指令，AI 精准执行 |

---

## 🖥 技术栈

| 层 | 技术 |
|------|------|
| **前端** | React 18 · Vite 5 · Tailwind CSS 3.4 · Framer Motion 12 · Zustand 4 |
| **后端** | Node.js · Express 4 · OpenAI SDK (DeepSeek API) |
| **存储** | JSON 文件（本地，零数据库依赖） |
| **LLM** | DeepSeek Chat API |
| **设计** | Apple · Linear · Notion · Figma 风格，玻璃拟态 UI |

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/songyiiiiii/InkVerse.git
cd InkVerse

# 2. 后端
cd server
cp .env.example .env          # 编辑 .env，填入 DEEPSEEK_API_KEY
npm install
npm run dev                    # → http://localhost:3001

# 3. 前端（新终端）
cd client
npm install
npm run dev                    # → http://localhost:5173
```

---

## 📁 项目结构

```
InkVerse/
├── DESIGN.md                     # HCI 设计文档（论文参考）
├── server/                       # 后端
│   └── src/
│       ├── index.js              # Express 主程序 + SSE 流式
│       ├── agents/
│       │   ├── orchestrator.js   # Agent 工作流编排引擎 ★核心
│       │   ├── intent-agent.js   # ① 意图理解
│       │   ├── create-agent.js   # ② 创作（含章节写作）
│       │   ├── revise-agent.js   # ③ 修改
│       │   ├── discuss-agent.js  # ④ Socratic 讨论
│       │   └── quality-agent.js  # ⑤ 质量检查
│       └── utils/
│           ├── llm-adapter.js    # DeepSeek API 适配
│           └── project-manager.js# 项目管理（JSON 存储）
└── client/                       # 前端
    └── src/
        ├── App.jsx               # 主布局（三栏）
        ├── stores/useStore.js    # Zustand 全局状态
        └── components/
            ├── Navbar.jsx        # 左栏导航 + 筛选
            ├── Canvas.jsx        # ★ Story Canvas 无限画布
            ├── CanvasNode.jsx    # 节点卡片
            ├── CanvasConnection.jsx # 节点连线
            ├── AIAssistant.jsx   # 右栏 AI 工作台
            ├── NodeDetail.jsx    # 节点详情弹窗（玻璃拟态）
            ├── ContextMenu.jsx   # 右键菜单
            └── HomePage.jsx      # 首页
```

---

## 🔬 HCI 研究

### 研究问题
自然语言对话式交互能否降低 AI 辅助创意写作的认知门槛？

### 创新点
1. **Story Canvas** —— 空间化节点网络降低长文本认知负荷
2. **混合主动交互** —— 三种模式动态切换，用户控制粒度可变
3. **Agent 思考过程可见** —— SSE 流式 + 分步展示，AI 不再是黑盒
4. **玻璃拟态 + 微交互** —— 现代设计语言让创意工具不再冰冷
5. **撤回 + 历史** —— 50 步历史栈降低"怕出错"焦虑

### 评估指标
- NASA-TLX 认知负荷量表
- SUS 系统可用性量表
- 创意自我效能对比问卷
- 交互模式使用频率分析

---

## 📄 License

MIT

---

> **InkVerse** — 砚台沉默如石，研磨一切，记录一切。而你看见了砚石上每一道细微的磨痕。
