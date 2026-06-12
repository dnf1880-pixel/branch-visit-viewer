# 网点拜访登记系统 — 架构文档

> **版本**: v2.0 | **最后更新**: 2026-06-12 | **维护者**: 波哥团队
> **文档定位**: 系统唯一权威架构参考，所有开发决策以此为准。

---

## 1. 项目基本信息

| 属性 | 值 |
|------|-----|
| 项目名称 | 网点拜访登记系统 (Branch Visit Registration System) |
| 业务领域 | 圆通速递区域网点管理 — 荆州/荆门/宜昌/恩施/潜江片区 |
| 覆盖网点 | 42 个（恩施 10、宜昌 15、荆州 13、荆门 4、潜江 1） |
| 部署形态 | 纯前端单页应用 (SPA)，浏览器端运行，无需后端服务器 |
| 目标用户 | 区域管理人员（片区经理、网点巡检员） |
| 数据存储 | 浏览器端 IndexedDB（按用户隔离） |

---

## 2. 业务边界

### 2.1 核心功能

```
┌─────────────────────────────────────────────────┐
│              网点拜访登记系统                        │
├───────────────┬───────────────┬─────────────────┤
│  身份认证      │  拜访登记      │  数据管理         │
│  · 姓名+工号  │  · 网点选择    │  · 历史查询       │
│  · localStorage│  · 表单填写    │  · Excel导出      │
│               │  · 标签识别    │  · Excel导入      │
│               │  · AI待办生成  │  · 记录编辑/删除   │
│               │  · GPS定位    │                  │
└───────────────┴───────────────┴─────────────────┘
```

### 2.2 明确不做

- ❌ 不做服务端存储 → 数据只存浏览器 IndexedDB，不涉及后端 API
- ❌ 不做多用户协同 → 每用户数据独立，无共享机制
- ❌ 不做实时同步 → 仅支持手动 Excel 导出/导入传输数据
- ❌ 不做复杂权限 → 单一角色（区域管理员），登录仅用于数据隔离
- ❌ 不做移动端原生 App → 保持 Web 形态，响应式适配即可

### 2.3 外部依赖边界

| 依赖 | 用途 | 失败策略 |
|------|------|----------|
| SheetJS (xlsx) | Excel 导入/导出 | 加载失败 → 禁用导入导出按钮，不阻塞核心功能 |
| 腾讯地图 API | 坐标逆地理编码 | 超时/失败 → 降级显示经纬度坐标 |
| 浏览器 IndexedDB | 数据持久化 | 不可用 → 提示用户更换浏览器 |
| 浏览器 Geolocation | GPS 坐标获取 | 用户拒绝/失败 → 提示手动输入地址 |

---

## 3. 技术选型理由

### 3.1 选型决策

| 维度 | 选型 | 理由 | 排除方案 |
|------|------|------|----------|
| **语言** | ES2022 JavaScript (Vanilla) | 零构建依赖，浏览器原生执行 | TypeScript → 增加构建链路，收益抵消不了复杂度 |
| **框架** | 无框架，原生 DOM API | 业务逻辑简单（表单+列表），无复杂状态管理需求 | React/Vue → 重型框架引入额外构建和运行时开销 |
| **样式** | 原生 CSS3（CSS Variables） | 主题变量统一管理，零运行时 | Tailwind/Sass → 不需要 |
| **模块化** | ES Modules (import/export) | 浏览器原生支持，无需打包工具 | CommonJS/AMD → 已过时 |
| **数据存储** | IndexedDB | 浏览器原生大容量存储，支持索引查询 | localStorage → 5MB 限制不够；WebSQL → 已废弃 |
| **外部 CDN** | SheetJS (cdn.sheetjs.com) | Excel 解析唯一选择，CDN 加载无需打包 | 自建 → 体积大，无意义 |
| **地图** | 腾讯地图 JavaScript API (JSONP) | 国内精度最优，与圆通现有系统一致 | 百度/高德 → 腾讯地图生态更匹配 |

### 3.2 不引入的技术（有意识约束）

- **不做构建工具链**：Webpack/Vite/esbuild 均不引入。项目规模不足以支撑构建工具收益。
- **不做 SPA Router**：只有两个 Tab 页面，无需路由库。直接用 `display: none/block` 切换。
- **不做状态管理库**：全局状态仅 `currentUser`、表单状态、筛选条件，用模块级变量管理即可。

---

## 4. 语言规范

### 4.1 JavaScript 编码规范

```js
// ✅ 正确
const BRANCH_LIST = [/* ... */];                    // 常量：UPPER_SNAKE
function fetchRecords(userId) { /* ... */ }         // 函数：camelCase
class BranchSelector { /* ... */ }                  // 类：PascalCase
const recordCount = records.length;                // 变量：camelCase

// ❌ 错误
var branch_list = [/* ... */];                     // 不要 var，不要 snake_case
function FetchRecords() { /* ... */ }              // 函数不用 PascalCase
```

### 4.2 文件命名

```
src/ui/          branch-selector.js   → 组件文件：kebab-case
src/services/    tag-extractor.js     → 服务文件：kebab-case
src/data/        record-store.js      → 数据层文件：kebab-case
src/core/        config.js            → 核心配置：kebab-case
```

### 4.3 CSS 规范

- CSS Variables 统一在 `:root` 定义主题
- 颜色语义化命名：`--bg`、`--text`、`--purple`、`--pink`
- 禁止内联样式（特殊情况如动态坐标绑定除外）
- 响应式断点：`@media (min-width: 600px)`

### 4.4 HTML 规范

- 语义化标签：`<form>`、`<header>`、`<nav>`
- 表单元素必须有 `label` 关联
- `data-*` 属性用于 JS 交互绑定，禁止用 class 选择器做数据绑定

---

## 5. 框架实践

### 5.1 选用原生 API 替代框架能力

| 框架常见能力 | 本项目等价实现 |
|-------------|----------------|
| 组件化 | ES Module + 函数返回 DOM 片段 |
| 响应式更新 | 事件驱动 → 调用 `render*()` 函数重新渲染 |
| 路由 | Tab 切换 `switchTab()` |
| 状态管理 | 模块级变量 + `render*()` 重绘 |
| 表单验证 | HTML5 Constraint Validation API + 自定义校验 |
| HTTP 请求 | `fetch()` + `JSONP`（地图 API） |
| 数据持久化 | IndexedDB Promise 封装 |

### 5.2 事件处理规范

```js
// ✅ 正确：委托 + 语义化命名
container.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (e.target.matches(".btn-delete")) confirmDelete(card.dataset.id);
  if (e.target.matches(".edit-btn"))   loadRecordToForm(card.dataset.id);
});

// ❌ 错误：内联 onclick 在 JS 生成的 HTML 中
// 理由：不利于调试和维护，用事件委托统一管理
```

### 5.3 DOM 渲染规范

```js
// ✅ 正确：模板字符串 + innerHTML（本项目规模适用）
function renderCard(record) {
  return `<div class="card">...</div>`;
}
container.innerHTML = records.map(renderCard).join("");

// ❌ 不适用：document.createElement 逐元素构建
// 理由：代码量翻倍，可读性差，本项目无 XSS 风险（数据来源可信）
```

---

## 6. 目录结构

```
Visit Registration System/
├── docs/
│   └── ARCHITECTURE.md          # 架构文档（本文件）
├── public/
│   └── index.html               # 入口 HTML（最小骨架）
├── src/
│   ├── core/                    # 核心基础设施
│   │   ├── config.js            # 配置常量（网点列表、标签、API Key）
│   │   ├── env.js               # 环境变量读取
│   │   ├── logger.js            # 统一日志工具
│   │   └── errors.js            # 错误码定义 + 统一错误处理
│   ├── data/                    # 数据层（IndexedDB CRUD）
│   │   ├── db.js                # IndexedDB 连接管理
│   │   └── record-store.js      # 记录 CRUD 操作
│   ├── services/                # 业务逻辑层
│   │   ├── auth.js              # 登录/登出/会话管理
│   │   ├── tag-extractor.js     # 标签关键词识别引擎
│   │   ├── todo-generator.js    # AI 待办生成引擎
│   │   ├── geolocation.js       # 定位 + 逆地理编码
│   │   └── export-import.js     # Excel 导入导出
│   ├── ui/                      # 界面层
│   │   ├── components/          # 可复用 UI 组件
│   │   │   ├── toast.js         # Toast 提示
│   │   │   ├── confirm.js       # 确认弹窗
│   │   │   └── card.js          # 记录卡片
│   │   ├── login.js             # 登录面板
│   │   ├── branch-selector.js   # 网点搜索下拉
│   │   ├── visit-form.js        # 拜访登记表单
│   │   ├── tag-panel.js         # 标签展示面板
│   │   ├── todo-panel.js        # 待办面板
│   │   ├── today-records.js     # 今日记录列表
│   │   └── history-panel.js     # 历史记录面板
│   ├── assets/
│   │   └── styles.css           # 全局样式（CSS Variables + 组件样式）
│   └── main.js                  # 应用入口：初始化、Tab 路由、全局事件
├── .env.example                 # 环境变量样板
└── README.md                    # 项目说明
```

### 6.1 分层依赖规则

```
ui/ ──────────► services/ ──────────► data/
(界面层)        (业务逻辑层)          (数据层)

ui/ ──────────► core/ (可直接引用)
services/ ────► core/ (可直接引用)

禁止：
  data/ ──X──► ui/     数据层不依赖界面
  data/ ──X──► services/  数据层不依赖业务
  services/ ──X──► ui/    业务层不依赖界面
```

---

## 7. 接口/API 规则

### 7.1 内部模块间接口

所有模块间函数调用遵循统一返回格式：

```js
// ✅ 统一返回结构
{
  success: true,          // boolean
  data: { ... },          // 成功时的数据
  error: {                // 失败时的错误信息
    code: "DB_WRITE_FAILED",
    message: "数据写入失败"
  }
}

// 示例
function getRecords(userId) {
  try {
    const records = await recordStore.getAll(userId);
    return { success: true, data: records };
  } catch (err) {
    logger.error("getRecords", err);
    return { success: false, error: { code: "DB_READ_FAILED", message: err.message } };
  }
}
```

### 7.2 数据层接口规范

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `getAll(options)` | `{ userId }` | `Promise<Result<Record[]>>` | 获取用户所有记录 |
| `add(record)` | `Record` | `Promise<Result<string>>` | 新增记录，返回 ID |
| `update(record)` | `Record` | `Promise<Result<void>>` | 更新记录 |
| `delete(id)` | `string` | `Promise<Result<void>>` | 删除记录 |

### 7.3 对外服务接口（外部 API 调用）

| 服务 | 接口 | 方法 | 超时 | 重试 |
|------|------|------|------|------|
| 腾讯地图逆地理编码 | `apis.map.qq.com/ws/geocoder/v1/` | JSONP | 8s | 0 |
| SheetJS CDN | `cdn.sheetjs.com/xlsx-0.20.1/` | `<script>` | 15s | 0 |

---

## 8. 错误处理规则

### 8.1 错误码体系

```
E_AUTH_xxx       身份认证错误
E_DB_xxx         IndexedDB 错误
E_GEO_xxx        定位/地图错误
E_IMPORT_xxx     导入错误
E_EXPORT_xxx     导出错误
E_VALIDATION_xxx 表单校验错误
```

具体错误码：

| 错误码 | 含义 | 用户提示 |
|--------|------|----------|
| `E_AUTH_INVALID` | 姓名或工号为空 | "请输入姓名和工号" |
| `E_DB_OPEN_FAILED` | IndexedDB 无法打开 | "浏览器不支持数据存储，请更换浏览器" |
| `E_DB_WRITE_FAILED` | 数据写入失败 | "保存失败，请重试" |
| `E_GEO_NOT_SUPPORTED` | 浏览器不支持定位 | "当前浏览器不支持定位功能" |
| `E_GEO_PERMISSION_DENIED` | 用户拒绝定位 | "定位权限被拒绝，请手动输入地址" |
| `E_GEO_TIMEOUT` | 定位超时 | "定位超时，请检查网络后重试" |
| `E_GEO_REVERSE_FAILED` | 地址解析失败 | "地址解析失败，已填入坐标" |
| `E_IMPORT_FORMAT` | 文件格式错误 | "文件格式不正确，请选择 .xlsx/.xls/.csv" |
| `E_IMPORT_PARSE` | 文件解析失败 | "文件解析失败，请检查文件内容" |
| `E_EXPORT_NO_DATA` | 无数据可导出 | "暂无可导出的记录" |
| `E_VALIDATION_PHONE` | 手机号格式错误 | "手机号格式不正确" |
| `E_VALIDATION_BRANCH` | 未选择网点 | "请选择网点" |
| `E_VALIDATION_DATE` | 未选择日期 | "请选择拜访日期" |

### 8.2 错误处理层级

```
用户操作 → UI 层捕获 → 调用 Service → Service 调用 Data
                    ↓ 错误
              Toast 展示用户提示
              Logger 记录技术细节
```

- **Data 层**：抛出原始错误，不处理
- **Service 层**：捕获 → 包装为标准 ErrorResult → 日志记录
- **UI 层**：解析 ErrorResult → 匹配用户提示 → Toast 展示

---

## 9. 日志规则

### 9.1 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `INFO` | 关键操作成功 | 登录成功、记录保存成功 |
| `WARN` | 降级处理 / 非致命错误 | 地图 API 超时 → 降级显示坐标 |
| `ERROR` | 功能失败 | IndexedDB 写入失败 |

### 9.2 日志格式

```js
// 统一格式：[时间] [级别] [模块] 消息 {详情}
// 时间格式：北京时间 ISO 8601

logger.info("auth", "用户登录成功", { user: currentUser.name });
// → [2026-06-12T10:07:34+08:00] [INFO] [auth] 用户登录成功 {"user":"波哥"}

logger.warn("geo", "逆地理编码超时，降级显示坐标", { lat, lng });
// → [2026-06-12T10:07:34+08:00] [WARN] [geo] 逆地理编码超时，降级显示坐标

logger.error("db", "写入记录失败", { error: err.message });
// → [2026-06-12T10:07:34+08:00] [ERROR] [db] 写入记录失败 {"error":"..."}
```

### 9.3 日志输出

- **开发环境**：`console.log/warn/error` 直接输出
- **生产环境**：仅 ERROR 级别输出到 `console.error`
- **不做远程日志上报**：纯前端应用，无后端

---

## 10. 数据模型

### 10.1 核心实体：VisitRecord

```js
{
  id:          string,   // 主键，格式：timestamp36 + random6
  visitor:     string,   // 拜访人姓名
  empNo:       string,   // 工号
  branch:      string,   // 网点全称 "宜昌市 · 猇亭"
  branchCity:  string,   // 城市 "宜昌市"
  branchName:  string,   // 网点简称 "猇亭"
  date:        string,   // 拜访日期 YYYY-MM-DD
  contact:     string,   // 联系人
  phone:       string,   // 联系电话
  address:     string,   // 地址
  lat:         string,   // 纬度
  lng:         string,   // 经度
  notes:       string,   // 关键问题备注
  tags:        string[], // 标签列表 ["服务品质","时效管控"]
  todos:       string[], // 待办事项列表
  createdAt:   string,   // 创建时间 ISO 8601
  updatedAt:   string?   // 更新时间 ISO 8601（可选）
}
```

### 10.2 IndexedDB 索引

| 索引名 | 字段 | 用途 |
|--------|------|------|
| `visitor` | visitor | 按用户查询 |
| `branch` | branch | 按网点查询 |
| `date` | date | 按日期查询/排序 |

### 10.3 静态数据：Branch（网点）

```js
{
  city:    string,  // 城市
  name:    string,  // 网点简称
  full:    string,  // 完整名称
  contact: string,  // 默认联系人
  phone:   string,  // 默认联系电话
  address: string   // 网点地址
}
```

---

## 11. 环境变量

### 11.1 .env.example

```bash
# 腾讯地图 WebService API Key
TMAP_WEBSERVICE_KEY=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77

# SheetJS CDN 地址
SHEETJS_CDN=https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js

# 日志级别：debug | info | warn | error
LOG_LEVEL=info

# 环境标识：development | production
APP_ENV=development
```

### 11.2 配置加载规则

- `src/core/env.js` 负责读取配置
- 优先级：`window.__APP_CONFIG__` > `localStorage` > `.env` 默认值
- API Key 类敏感信息不写入前端代码，通过环境变量注入

---

## 12. 部署说明

- **部署形态**：静态文件托管，nginx/caddy 或 OSS/CDN 直接托管
- **入口文件**：`public/index.html`
- **浏览器要求**：Chrome 80+ / Edge 80+ / Safari 14+ / Firefox 80+
- **无需后端**：所有数据处理在浏览器端完成
- **无需 HTTPS**：但推荐（Geolocation API 需要安全上下文）

---

## 13. 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2026-06-12 | v2.0 | 从单文件重构为分层架构，编写完整架构文档 | 波哥团队 |
