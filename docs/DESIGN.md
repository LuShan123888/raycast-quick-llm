# Quick LLM 设计规划文档

## 1. 项目定位

Quick LLM 是一个 Raycast 扩展，将文本同时发送给多个 LLM 模型，SSE 流式响应，结果实时逐字更新。适用于翻译、润色、总结等轻量文本任务。

### 1.1 目标用户

使用 macOS + Raycast，同时拥有多个 LLM API 访问权限，需要快速对比不同模型输出的用户。

### 1.2 核心价值

| 价值 | 说明 |
|------|------|
| 零摩擦调用 | 选中文本 → 快捷键 → 立即获取结果，无需切换窗口 |
| 多模型对比 | 动态配置任意数量模型，并行调用，独立流式更新 |
| 统一接口 | 基于 OpenAI 兼容协议，一套配置适配所有主流 LLM 服务 |
| 即用即走 | 无需聊天界面，结果直接复制/粘贴到光标位置 |

---

## 2. 当前架构（v0.2）

### 2.1 核心流程

```
用户选中文本 / 剪贴板 / 手动输入
         │
         ▼
┌─────────────────────────────┐
│    quick-llm.tsx (主命令)    │
│  1. getSelectedText()        │
│  2. Clipboard.read() (降级)   │
│  3. Form 手动输入 (兜底)       │
│  4. loadConfig() (LocalStorage)│
│  5. 并行 callModelStream()    │
│  6. onChunk 逐步更新 UI       │
└──────────┬──────────────────┘
           │
     ┌─────┼─────┬─────┐
     ▼     ▼     ▼     ▼
  ┌──────┐ ┌──────┐ ┌──────┐ ...
  │GPT-4o│ │DeepS.│ │ GLM  │
  │ ⏳   │ │ ✅   │ │ ❌   │
  └──────┘ └──────┘ └──────┘
  SSE 流式  完成    出错
```

### 2.2 模块结构

```
src/
├── quick-llm.tsx    # 主命令：输入获取、流式调度、结果展示
├── configure.tsx    # 配置命令：模型增删改、系统设置
├── api.ts           # API 层：SSE 流式解析、非流式降级
└── types.ts         # 类型定义
```

**职责划分**：

| 模块 | 职责 |
|------|------|
| `quick-llm.tsx` | 输入获取（选中文本/剪贴板/表单）、LocalStorage 配置读取、并行流式调度、Markdown 渲染、ActionPanel 操作 |
| `configure.tsx` | 模型列表展示（List）、模型增删改（Form push）、系统设置编辑（System Prompt/Max Tokens） |
| `api.ts` | `callModelStream()` SSE 流式解析、`callModel()` 非流式降级、错误处理、耗时统计 |
| `types.ts` | `ModelConfig`、`ModelResult`、`AppConfig` 类型定义 |

### 2.3 API 调用协议

使用 OpenAI Chat Completions 兼容接口，默认流式：

```
POST {baseUrl}/v1/chat/completions
Headers: Authorization: Bearer {apiKey}
Body: {
  model: string,
  messages: [{role: "system", content: systemPrompt}, {role: "user", content: text}],
  max_tokens: number,
  temperature: 0.3,
  stream: true
}

Response: SSE event stream
data: {"choices":[{"delta":{"content":"你"}}]}
data: {"choices":[{"delta":{"content":"好"}}]}
...
data: [DONE]
```

**关键设计决策**：
- `temperature: 0.3` — 翻译/润色/总结类任务偏确定性输出
- `baseUrl` 末尾斜杠自动清理 — 避免用户配置时产生 `//` 路径
- `stream: true` 默认开启 — 流式响应大幅提升体感速度
- 非 SSE 响应自动降级 — 兼容不支持 stream 的 API

### 2.4 状态模型

```typescript
ModelResult {
  name: string       // 模型显示名
  content: string    // 返回内容（流式时逐步追加）
  loading: boolean   // 初始连接中
  streaming: boolean // 流式接收中
  error?: string     // 错误信息
  duration?: number  // 响应耗时（ms）
}

AppConfig {
  models: ModelConfig[]  // 动态模型列表
  systemPrompt: string   // 系统提示词
  maxTokens: number      // 最大 Token 数
}
```

### 2.5 配置存储

使用 Raycast `LocalStorage`（key: `quick-llm-config`）存储 JSON，不使用 Raycast Preferences（避免显示欢迎页）。

### 2.6 输入优先级

```
getSelectedText()  →  Clipboard.read()  →  Form 手动输入
     优先级 1              优先级 2            优先级 3
```

### 2.7 技术选型

- **框架**：Raycast API（@raycast/api ^1.83.0）
- **语言**：TypeScript 5.4
- **UI**：Raycast Detail（结果）+ Form（输入）+ List（配置）
- **HTTP**：原生 `fetch`（Raycast 环境内置）
- **构建**：Raycast CLI（`ray build` / `ray develop`）
- **依赖**：零运行时依赖（仅 @raycast/api）

---

## 3. 用户场景与预期行为

### 3.1 基本场景

| # | 场景 | 操作 | 预期行为 |
|---|------|------|----------|
| S1 | 划词翻译 | 选中文本 → 触发快捷键 | 流式调用所有模型，结果逐字更新 |
| S2 | 剪贴板翻译 | 复制文本 → 触发快捷键（无选中文本） | 自动读取剪贴板内容并翻译 |
| S3 | 手动输入 | 无选中文本且剪贴板为空 | 显示输入表单，输入后提交 |
| S4 | 复制结果 | ⌘+K → Copy All Results | 合并所有模型结果到剪贴板 |
| S5 | 粘贴指定模型 | ⌘+K → 模型子菜单 → Paste Result | 将该模型结果直接粘贴到光标位置 |
| S6 | 重新执行 | ⌘+K → Re-translate | 使用相同文本重新调用所有模型 |
| S7 | 新输入 | ⌘+K → New Input | 回到输入表单，输入新文本 |

### 3.2 配置场景

| # | 场景 | 操作 | 预期行为 |
|---|------|------|----------|
| S8 | 未配置模型 | 首次使用 | 显示引导文案 + Configure Models 快捷入口 |
| S9 | 添加模型 | Configure Models → Add Model | Form 输入后保存到 LocalStorage |
| S10 | 编辑模型 | Configure Models → Edit Model | 预填当前值，修改后保存 |
| S11 | 删除模型 | Configure Models → Delete Model | 确认后从列表移除 |
| S12 | 修改 System Prompt | Configure Models → Settings | 编辑后所有模型生效 |

### 3.3 错误场景

| # | 场景 | 预期行为 |
|---|------|----------|
| S13 | API Key 无效 | 该模型显示 ❌ 错误信息，其他模型不受影响 |
| S14 | 网络/超时 | 该模型显示错误信息，其他模型不受影响 |
| S15 | API 不支持 stream | 自动降级为非流式，一次性返回结果 |

---

## 4. 当前已知限制

### 4.1 设计约束（符合预期）

| # | 约束 | 说明 |
|---|------|------|
| 1 | 仅 OpenAI 兼容协议 | 不支持 Anthropic Native、Google Gemini 等非 OpenAI 协议的 API |
| 2 | Raycast 窗口固定大小 | 窗口高度有上限，内容超出后自动滚动 |
| 3 | 无历史记录 | 每次调用独立，不保存之前的查询和结果 |
| 4 | 无对话上下文 | 每次调用独立，无法追问或迭代 |

### 4.2 待优化

| # | 限制 | 影响 | 备注 |
|---|------|------|------|
| 5 | 无 Prompt 预设 | 每次切换任务类型需手动修改 System Prompt | 可增加 Prompt 模板库 |
| 6 | Markdown 渲染有限 | Raycast Detail 渲染能力有限，代码块高亮不支持 | Raycast 平台限制 |

---

## 5. 演进规划

### 5.1 Phase 1：流式响应 + 动态配置 ✅ 已完成（v0.2）

- [x] SSE 流式响应，逐字更新
- [x] 非 SSE API 自动降级
- [x] 模型配置迁移到 LocalStorage，动态增删改
- [x] 扩展内配置面板（Configure Models 命令）
- [x] 多种输入方式（选中文本/剪贴板/手动输入）
- [x] 移除 Raycast Preferences，避免欢迎页

### 5.2 Phase 2：Prompt 模板库（v0.3）

**目标**：预设多种 Prompt 模板，快速切换翻译/润色/总结等任务。

#### 5.2.1 模板管理

在 Configure Models → Settings 中管理 Prompt 模板：

```
模板 1: 翻译（中⇄英）    ← 默认
模板 2: 润色/改写
模板 3: 总结/摘要
模板 4: 代码解释
模板 5: 自定义
```

#### 5.2.2 快速切换

- 结果页增加快捷键切换 Prompt 模板
- 当前使用的模板名称显示在标题栏

#### 5.2.3 要解决的问题

- [ ] 每次切换任务类型需手动修改 System Prompt
- [ ] 常用 Prompt 需要反复粘贴

---

### 5.3 Phase 3：历史记录与收藏（v0.4）

**目标**：保存查询历史，支持回看和收藏常用结果。

#### 5.3.1 功能设计

- 新增 "History" 命令，展示历史查询列表
- 支持收藏常用结果
- LocalStorage 存储

#### 5.3.2 要解决的问题

- [ ] 查过的结果无法回看
- [ ] 好的结果无法保存

---

### 5.4 Phase 4：发布 Raycast Store（v1.0）

**目标**：打磨细节，发布到 Raycast Store。

#### 5.4.1 发布前检查

- [ ] 所有错误场景优雅处理
- [ ] 图标和描述完善
- [ ] 无障碍测试

---

## 6. 技术决策记录

### 6.1 为什么选择 OpenAI 兼容协议？

OpenAI 兼容协议已成为事实标准，覆盖 OpenAI、DeepSeek、GLM、Kimi、Ollama 等绝大多数服务。单一协议维护简单，用户只需换 Base URL。少数不兼容的 API（如 Anthropic）可通过第三方代理转为 OpenAI 格式。

### 6.2 为什么用 LocalStorage 而非 Preferences？

- Preferences 数量固定，无法动态增删模型
- Preferences 会触发 Raycast 欢迎页（首次使用时）
- LocalStorage 支持存储任意结构的 JSON 数据

### 6.3 为什么用状态切换而非 push/pop？

Raycast 的 `push()` 要求推送的组件是有效的命令级组件，推送子组件（如 ModelForm）会报错。改用内部 `View` 状态切换 List/Form 视图，同一命令内完成所有导航。

### 6.4 为什么 temperature 设为 0.3？

翻译、润色、总结等任务需要确定性输出。0.3 在保持一定灵活性的同时减少随机性。

---

## 7. 变更日志

### 2026-04-04 v0.2 流式响应 + 动态配置

**功能**：
- SSE 流式响应，结果逐字实时更新（⏳ 标识）
- 模型配置迁移到 LocalStorage，支持动态增删改，不限数量
- 新增 Configure Models 命令（List + Form）
- 新增 Settings 页面（System Prompt / Max Tokens）
- 多种输入方式：选中文本 → 剪贴板 → 手动输入
- 移除 Raycast Preferences，避免欢迎页
- 每个模型独立 Copy/Paste 子菜单
- 组件卸载时中止未完成的流

**技术实现**：
- 新增 `callModelStream()`：SSE 流式解析，onChunk/onDone 回调，非 SSE 自动降级
- 新增 `configure.tsx`：List 展示模型，内部 View 状态切换 Form
- `ModelResult` 新增 `streaming` 字段
- 新增 `AppConfig` 类型统一管理配置
- `abortRef` 防止组件卸载后继续更新状态

**文件变更**：
- 新增 `src/configure.tsx`
- 重写 `src/api.ts`（流式 + 非流式双模式）
- 重写 `src/quick-llm.tsx`（流式调度 + 多输入方式 + View 状态）
- 更新 `src/types.ts`（streaming 字段 + AppConfig）
- 更新 `package.json`（新增 configure 命令，清空 preferences）

---

### 2026-04-04 v0.1 初始版本

**功能**：
- 选中文本 → 触发快捷键 → 多模型并行调用
- 支持最多 3 个 OpenAI 兼容模型（Preferences 配置）
- 结果并排展示，显示响应耗时
- 支持复制全部/单个结果、粘贴到光标、重新执行

**技术实现**：
- 3 个源文件：`quick-llm.tsx`、`api.ts`、`types.ts`
- 零运行时依赖（仅 @raycast/api）
- 使用原生 `fetch` 调用 OpenAI 兼容接口

**限制**：
- 不支持流式响应
- 最多 3 个模型
- 无手动输入方式
