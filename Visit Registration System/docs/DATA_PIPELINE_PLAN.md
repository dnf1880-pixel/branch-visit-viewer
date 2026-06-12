# 本地后端支持 — 完整实施计划

> **版本**: v1.0 | **日期**: 2026-06-12 | **作者**: 波哥团队  
> **目标**: 数据文件本地存储 → Git 推送到远程仓库 → 线上网页拉取数据 → 渲染静态看板

---

## 一、架构全景图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          五层数据管线架构                                    │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│  第1层      │  【浏览器 App】  网点拜访登记系统                                │
│  数据采集    │  IndexedDB → getAllRecords() → POST JSON                   │
│            │                                      │                      │
├────────────┼──────────────────────────────────────┼──────────────────────┤
│            │                                      ▼                      │
│  第2层      │  【本地 Node.js 服务】  localhost:3456                        │
│  本地后端    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│            │  │ POST /publish│  │ 文件写入     │  │ Git 操作     │         │
│            │  │ 接收JSON数据 │→│ data/*.json  │→│ commit+push │         │
│            │  └─────────────┘  └─────────────┘  └──────┬──────┘         │
│            │                                           │                 │
├────────────┼───────────────────────────────────────────┼─────────────────┤
│            │                                           ▼                 │
│  第3层      │  【GitHub 远程仓库】  github.com/波哥/branch-visit-viewer      │
│  数据仓库    │  ┌─────────────────┐  ┌─────────────────┐                  │
│            │  │ data/records.json│  │ viewer/index.html│                 │
│            │  │ data/branches.json│  │ (静态看板页面)    │                 │
│            │  │ data/summary.json │  │                  │                 │
│            │  └─────────────────┘  └────────┬─────────┘                  │
│            │                                 │                            │
├────────────┼─────────────────────────────────┼───────────────────────────┤
│            │                                 ▼                            │
│  第4层      │  【GitHub Pages】  https://波哥.github.io/branch-visit-viewer │
│  CDN分发    │  自动部署 → 全球 CDN 加速 → HTTPS → 零成本                     │
│            │                                 │                            │
├────────────┼─────────────────────────────────┼───────────────────────────┤
│            │                                 ▼                            │
│  第5层      │  【线上看板】  纯静态 HTML，fetch 同域 JSON 数据                  │
│  渲染展示    │  网点地图 · 统计图表 · 拜访记录 · 标签分布 · 趋势分析              │
│            │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 本地服务语言 | Node.js 22 (内置 http 模块) | 零第三方依赖，JavaScript 全栈统一 |
| 数据格式 | JSON 文件 | 人类可读、Git diff 友好、浏览器原生解析 |
| 远程仓库 | GitHub | 免费私有仓库 + GitHub Pages + Actions |
| 静态托管 | GitHub Pages | 零成本、自动 HTTPS、全球 CDN |
| 数据拉取 | `fetch('/data/records.json')` | 同域请求，无 CORS 问题 |
| 自动推送 | Node.js child_process 执行 git 命令 | 简单可控，无需额外依赖 |

### 明确不做

- ❌ 不引入数据库（MySQL/PostgreSQL）→ JSON 文件已满足需求
- ❌ 不引入构建工具（Webpack/Vite）→ 纯静态，浏览器原生执行
- ❌ 不做用户认证 → GitHub Pages 公开访问，数据无敏感信息
- ❌ 不做实时同步 → 手动触发发布，确保数据质量可控
- ❌ 不购买服务器 → GitHub Pages 完全免费

---

## 二、技术栈锁定

```
语言:       JavaScript ES2022（前后端统一）
运行时:     浏览器端 ES Modules + Node.js 22 CJS
数据存储:   本地 JSON 文件 + GitHub 仓库
版本控制:   Git（simple 命令行操作）
部署:       GitHub Pages（自动 HTTPS + CDN）
可视化:     Chart.js（CDN 加载）
地图:       腾讯地图 JavaScript API（已有）
```

**依赖清单**（全部零安装或 CDN）：

| 组件 | 来源 | 备注 |
|------|------|------|
| Node.js http 模块 | 内置 | 本地服务器 |
| Node.js fs/path/child_process | 内置 | 文件操作 + Git |
| Chart.js 4.x | CDN | 统计图表 |
| 腾讯地图 API | CDN（已有） | 网点地图 |
| SheetJS | CDN（已有） | 数据导出 |

---

## 三、分阶段实施

### Phase 1 — 本地后端服务（本次重点）

**目标**: 浏览器端一键导出数据 → 本地 Node.js 服务接收 → 写入 JSON 文件 → Git 自动提交推送

```
时间估算: 1-2 小时
新增文件: 6 个
修改文件: 2 个
```

#### 新增目录结构

```
Visit Registration System/
├── server/                          # ← 新增：本地后端
│   ├── server.js                    # Node.js HTTP 服务入口
│   ├── git-push.js                  # Git commit + push 封装
│   └── package.json                 # Node.js 项目配置（仅 type: module）
├── data/                            # ← 新增：JSON 数据目录
│   ├── records.json                 # 拜访记录（git 跟踪）
│   ├── branches.json                # 网点数据（git 跟踪）
│   └── summary.json                 # 统计摘要（git 跟踪）
├── src/
│   └── services/
│       └── publish.js               # ← 新增：浏览器端发布服务
├── .gitignore                       # ← 新增
└── public/
    └── index.html                   # ← 修改：添加"发布"按钮
```

#### 服务器 API 设计

```
POST /publish
  Content-Type: application/json
  Body: {
    records: VisitRecord[],    // 所有拜访记录
    branches: Branch[],        // 网点列表（静态，附带推送）
    summary: {                 // 统计摘要
      totalRecords: number,
      branchCount: number,
      tagDistribution: {...},
      lastUpdated: string
    }
  }
  Response: {
    success: true,
    data: {
      savedPath: "/data/records.json",
      gitPushed: true,
      commitHash: "a1b2c3d"
    }
  }
```

#### 实施步骤

1. **创建 `server/package.json`** — 声明 ES Module 类型
2. **创建 `server/server.js`** — HTTP 服务，监听 3456 端口
   - POST /publish → 接收 JSON → 写入 `data/*.json`
   - GET /health → `{ status: "ok" }`
   - 静态文件服务（可选，用于本地调试）
3. **创建 `server/git-push.js`** — 封装 git 操作
   - `git add data/`
   - `git commit -m "update: 拜访数据更新 $(date)"`
   - `git push origin main`
4. **创建 `src/services/publish.js`** — 浏览器端发布逻辑
   - `publishData()` → 从 IndexedDB 读取全部记录 → 组装 JSON → fetch POST
5. **修改 `public/index.html`** — 添加"📤 发布到线上"按钮
6. **初始化 Git 仓库** — `git init` + 创建 GitHub 仓库 + 关联远程

---

### Phase 2 — 线上看板页面

**目标**: 一个独立的静态 HTML 页面，部署到 GitHub Pages，从仓库拉取 JSON 数据并渲染交互式看板

```
时间估算: 2-3 小时
新增文件: 1 个
```

#### 看板功能模块

| 模块 | 功能 | 数据来源 |
|------|------|----------|
| 📊 概览卡片 | 总记录数、覆盖网点、最新更新 | summary.json |
| 🗺️ 网点地图 | 腾讯地图标注 42 个网点 | branches.json |
| 📈 趋势图 | 按月/按城市拜访量柱状图 | records.json |
| 🏷️ 标签分布 | 饼图展示标签占比 | records.json（实时计算） |
| 📋 记录列表 | 可搜索、筛选的拜访记录表 | records.json |
| 🔴 风险网点 | 标注石首/武德路/宣恩等风险点 | summary.json |

#### 技术实现

```
viewer/index.html
├── CSS Variables（与主项目一致的主题色）
├── Chart.js CDN → 柱状图 + 饼图
├── 腾讯地图 CDN → 网点标注
├── fetch('/data/records.json')  → 同域加载数据
└── 响应式布局 → 移动端可用
```

#### 部署流程

1. 将 `viewer/index.html` 推送到 GitHub 仓库
2. 在 GitHub 仓库 Settings → Pages → Source 选择 `main` 分支
3. 访问 `https://{用户名}.github.io/{仓库名}/viewer/`
4. 数据自动通过相对路径 `/data/*.json` 加载

---

### Phase 3 — 自动化增强（可选）

| 增强项 | 方案 | 价值 |
|--------|------|------|
| GitHub Actions 自动部署 | push 后自动刷新 Pages | 省去手动操作 |
| 数据差分展示 | Git diff 生成变更摘要 | 知道谁改了哪些网点 |
| 定时自动发布 | Cron 定时触发导出+推送 | 每日自动同步 |
| 多仓库分权限 | 不同片区推不同仓库 | 数据隔离 |

---

## 四、数据流详解

```
┌─────────────────────────────────────────────────────────────────┐
│                       完整数据流                                  │
│                                                                 │
│  波哥操作                   系统自动              在线访问         │
│  ────────                  ────────              ────────         │
│                                                                 │
│  [点击"发布到线上"]                                             │
│       │                                                         │
│       ▼                                                         │
│  IndexedDB.getAll()                                              │
│       │                                                         │
│       ▼                                                         │
│  组装 JSON Body                                                  │
│       │                                                         │
│       ▼                                                         │
│  fetch POST localhost:3456/publish                               │
│       │                                                         │
│       ├──────────────────────────────────────┐                   │
│       ▼                                      ▼                   │
│  ✅ 写入 data/records.json            ❌ 返回错误               │
│  ✅ 写入 data/branches.json            Toast 提示               │
│  ✅ 写入 data/summary.json                                     │
│       │                                                         │
│       ▼                                                         │
│  git add data/                                                   │
│  git commit -m "update: ..."                                     │
│  git push origin main                                            │
│       │                                                         │
│       ├──────────────────────────────────────┐                   │
│       ▼                                      ▼                   │
│  ✅ 推送成功                            ❌ 推送失败              │
│  Toast "发布成功 + commit hash"         Toast "推送失败 + 原因"  │
│       │                                                         │
│       ▼                                                         │
│  GitHub Pages 自动更新                                          │
│  (约 1-2 分钟后生效)                                            │
│       │                                                         │
│       ▼                                                         │
│  任何人访问 https://...github.io/.../viewer/                     │
│       │                                                         │
│       ▼                                                         │
│  fetch('/data/records.json') → 渲染看板                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、GitHub 仓库规划

### 仓库名称: `branch-visit-viewer`

### 分支策略
```
main              ← 唯一分支，直接推送
├── data/         ← JSON 数据文件
├── viewer/       ← 静态看板页面
└── README.md     ← 仓库说明
```

### .gitignore
```gitignore
# Node
node_modules/

# 环境变量
.env

# 临时文件
*.tmp
.DS_Store

# 本地数据（由服务器生成，但需要提交到仓库，所以不忽略 data/）
```

> **注意**: `data/` 目录需要提交到 Git（这是整个管线的核心），同时本地服务器也会写入该目录。

### GitHub Pages 配置
```
Settings → Pages
  Source:        Deploy from a branch
  Branch:        main
  Folder:        / (root)
  Custom domain: (可选)
```

---

## 六、安全考量

| 风险 | 措施 |
|------|------|
| API Key 泄露 | 腾讯地图 Key 仅在前端使用，不写入 data/ JSON |
| 数据公开 | GitHub 仓库设为私有（免费），Pages 设为公开 |
| 误操作推送 | 每次推送前确认；Git 历史可回滚 |
| 并发写入 | 本地单用户，不存在并发问题 |
| 敏感信息 | 联系人电话只保留工作号码，不存储身份证等 |

---

## 七、文件清单

### 本次 Phase 1 需要创建/修改的文件

```
新增 (6个):
  server/server.js          — HTTP 服务主程序 (~80行)
  server/git-push.js        — Git 操作封装 (~50行)  
  server/package.json       — Node 项目配置
  src/services/publish.js   — 浏览器端发布服务 (~40行)
  data/.gitkeep             — 占位文件
  .gitignore                — Git 忽略规则

修改 (2个):
  public/index.html         — 添加"发布"按钮 + 引入 publish.js
  src/main.js               — 初始化发布模块

Phase 2 新增 (1个):
  viewer/index.html         — 线上看板页面 (~400行)
```

---

## 八、启动命令

```bash
# 1. 启动本地后端服务
cd "Visit Registration System"
node server/server.js
# → 输出: Server running at http://localhost:3456

# 2. 浏览器打开应用
# 打开 public/index.html（或通过服务器静态托管）

# 3. 点击"发布到线上"按钮
# → 数据导出 → Git 推送 → 完成

# 4. 访问线上看板
# https://{你的用户名}.github.io/branch-visit-viewer/viewer/
```

---

## 九、下一步行动

1. ✅ 请确认以上计划
2. 确认 GitHub 仓库名称（建议: `branch-visit-viewer`）
3. 确认是否需要私有仓库（推荐私有，Pages 公开即可）
4. 开始 Phase 1 实施
