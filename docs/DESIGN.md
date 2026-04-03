# Quick LLM 设计规划文档

## 1. 项目定位

Quick LLM 是一个 Raycast 扩展，将选中文本同时发送给多个 LLM 模型，结果并排展示、实时更新。适用于翻译、润色、总结等轻量文本任务。

### 1.1 目标用户

使用 macOS + Raycast，同时拥有多个 LLM API 访问权限，需要快速对比不同模型输出的用户。

### 1.2 核心价值

| 价值 | 说明 |
|------|------|
| 零摩擦调用 | 选中文本 → 快捷键 → 立即获取结果，无需切换窗口 |
| 多模型对比 | 最多 3 个模型并行调用，结果逐步更新，含响应耗时 |
| 统一接口 | 基于 OpenAI 兼容协议，一套配置适配所有主流 LLM 服务 |
| 即用即走 | 无需聊天界面，结果直接复制/粘贴到光标位置 |

---

## 2. 当前架构（v0.1）

### 2.1 核心流程

```
用户选中文本 → Raycast 触发快捷键
         │
         ▼
┌─────────────────────────────┐
│    quick-llm.tsx (主界面)     │
│  1. environment.getSelectedText()  │
│  2. getModelsFromPreferences()     │
│  3. 并行调用 callModel()           │
│  4. 逐步更新 UI (setResults)       │
└──────────┬──────────────────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
┌────────┐ ┌────────┐ ┌────────┐
│Model 1 │ │Model 2 │ │Model 3 │
│ GPT-4o │ │ DeepSeek│ │  GLM   │
└────────┘ └────────┘ └────────┘
     │     │     │
     ▼     ▼     ▼
  结果逐步回传，UI 实时更新
```

### 2.2 模块结构

```
src/
├── quick-llm.tsx    # 主界面：状态管理、结果展示、用户交互
├── api.ts           # API 层：模型调用、响应解析
└── types.ts         # 类型定义：ModelConfig、ModelResult
```

**职责划分**：

| 模块 | 职责 |
|------|------|
| `quick-llm.tsx` | 偏好读取、模型配置解析、文本获取、并行调度、Markdown 渲染、快捷操作 |
| `api.ts` | HTTP 请求、OpenAI 协议封装、错误处理、耗时统计 |
| `types.ts` | `ModelConfig`（模型配置）、`ModelResult`（调用结果） |

### 2.3 API 调用协议

使用 OpenAI Chat Completions 兼容接口：

```
POST {baseUrl}/v1/chat/completions
Headers: Authorization: Bearer {apiKey}
Body: {
  model: string,
  messages: [{role: "system", content: systemPrompt}, {role: "user", content: selectedText}],
  max_tokens: number,
  temperature: 0.3
}
```

**关键设计决策**：
- `temperature: 0.3` — 翻译/润色/总结类任务偏确定性输出
- `baseUrl` 末尾斜杠自动清理 — 避免用户配置时产生 `//` 路径
- 无流式响应 — 当前使用 `fetch` 一次性返回，结果完整后才更新 UI

### 2.4 状态模型

```typescript
ModelResult {
  name: string      // 模型显示名
  content: string   // 返回内容（空字符串表示加载中/出错）
  loading: boolean  // 是否加载中
  error?: string    // 错误信息
  duration?: number // 响应耗时（ms）
}
```

### 2.5 技术选型

- **框架**：Raycast API（@raycast/api ^1.83.0）
- **语言**：TypeScript 5.4
- **UI**：Raycast Detail 组件（Markdown 渲染）
- **HTTP**：原生 `fetch`（Raycast 环境内置）
- **构建**：Raycast CLI（`ray build` / `ray develop`）
- **依赖**：零运行时依赖（仅 @raycast/api）

---

## 3. 用户场景与预期行为

### 3.1 基本场景

| # | 场景 | 操作 | 预期行为 |
|---|------|------|----------|
| S1 | 划词翻译 | 选中文本 → 触发快捷键 | 调用所有已配置模型，并排展示翻译结果 |
| S2 | 只配置一个模型 | 仅填写 Model 1 配置 | 单列展示，无对比，其他功能正常 |
| S3 | 复制结果 | `⌘ C` | 合并所有模型结果到剪贴板 |
| S4 | 粘贴到光标 | `⌘ P` | 将第一个模型的结果直接粘贴到当前光标位置 |
| S5 | 复制指定模型 | `⌘ ⇧ 1/2/3` | 只复制对应编号模型的结果 |
| S6 | 重新执行 | 点击 Re-translate | 使用相同文本重新调用所有模型 |

### 3.2 配置场景

| # | 场景 | 操作 | 预期行为 |
|---|------|------|----------|
| S7 | 未配置任何模型 | 首次使用 | 弹出 Toast 提示"请配置至少一个模型" |
| S8 | 模型部分配置 | 只填了 Base URL 但没填 API Key | 该模型被跳过，不参与调用 |
| S9 | 自定义 Prompt | 修改 System Prompt 为"润色以下文本" | 所有模型使用新的 Prompt |
| S10 | 使用 DeepSeek | Base URL 填 `https://api.deepseek.com` | 正常调用，与 OpenAI 接口兼容 |

### 3.3 错误场景

| # | 场景 | 预期行为 |
|---|------|----------|
| S11 | API Key 无效 | 该模型显示 HTTP 401 错误信息，其他模型正常 |
| S12 | 网络超时 | 该模型显示错误信息，其他模型不受影响 |
| S13 | 未选中文本 | 提示"(no text selected)" |
| S14 | 未授予辅助功能权限 | 提示"(failed to get selected text — grant Accessibility permission)" |

---

## 4. 当前已知限制

### 4.1 设计约束（符合预期）

| # | 约束 | 说明 |
|---|------|------|
| 1 | 最多 3 个模型 | Raycast 偏好配置项数量固定，扩展更多模型需要重构配置方式 |
| 2 | 仅 OpenAI 兼容协议 | 不支持 Anthropic Native、Google Gemini 等非 OpenAI 协议的 API |
| 3 | 无流式响应 | 等模型完整返回后才更新 UI，无法逐字显示 |
| 4 | 无历史记录 | 每次调用独立，不保存之前的查询和结果 |

### 4.2 待优化

| # | 限制 | 影响 | 备注 |
|---|------|------|------|
| 5 | 模型配置硬编码为 3 组 | 想用 4+ 个模型对比时无法扩展 | 可改为动态配置 |
| 6 | 无 Prompt 预设 | 每次切换任务类型需手动修改 System Prompt | 可增加 Prompt 模板库 |
| 7 | 无对话上下文 | 每次调用独立，无法追问或迭代 | 适合轻量任务，不适合复杂对话 |
| 8 | Markdown 渲染有限 | Raycast Detail 的 Markdown 渲染能力有限，代码块高亮不支持 | Raycast 平台限制 |

---

## 5. 演进规划

### 5.1 Phase 1：流式响应（v0.2）

**目标**：支持 SSE 流式响应，结果逐字更新，大幅提升体感速度。

#### 5.1.1 流式 API 调用

将 `callModel()` 从一次性 `fetch` 改为 SSE 流式读取：

```
POST {baseUrl}/v1/chat/completions
Body: { ...same, stream: true }

Response: SSE event stream
data: {"choices":[{"delta":{"content":"你"}}]}
data: {"choices":[{"delta":{"content":"好"}}]}
...
data: [DONE]
```

#### 5.1.2 实现要点

- 使用 `ReadableStream` + `TextDecoder` 逐块解析 SSE
- 每个 delta content 追加到对应模型的 `ModelResult.content`
- UI 使用 `setResults` 逐步更新
- 需要兼容不支持 `stream: true` 的 API（降级为非流式）

#### 5.1.3 要解决的问题

- [ ] 长文本等待时间过长，用户无法感知进度
- [ ] 流式响应的解析和错误处理
- [ ] 非流式 API 的自动降级

---

### 5.2 Phase 2：Prompt 模板库（v0.3）

**目标**：预设多种 Prompt 模板，快速切换翻译/润色/总结等任务。

#### 5.2.1 模板管理

在 Raycast 偏好中配置多个 Prompt 模板：

```
模板 1: 翻译（中⇄英）    ← 默认
模板 2: 润色/改写
模板 3: 总结/摘要
模板 4: 代码解释
模板 5: 自定义
```

#### 5.2.2 快速切换

- 主界面增加快捷键切换 Prompt 模板
- 当前使用的模板名称显示在标题栏
- 支持用户自定义模板内容

#### 5.2.3 要解决的问题

- [ ] 每次切换任务类型需手动修改 System Prompt
- [ ] 常用 Prompt 需要反复粘贴

---

### 5.3 Phase 3：动态模型配置（v0.4）

**目标**：支持任意数量的模型配置，突破 3 个模型限制。

#### 5.3.1 配置方式

将模型配置从 Raycast Preferences 迁移到本地 JSON 文件：

```json
// ~/.config/quick-llm/models.json
[
  {"name": "GPT-4o", "baseUrl": "https://api.openai.com", "apiKey": "sk-...", "model": "gpt-4o"},
  {"name": "DeepSeek", "baseUrl": "https://api.deepseek.com", "apiKey": "sk-...", "model": "deepseek-chat"},
  {"name": "GLM-4", "baseUrl": "https://open.bigmodel.cn/api/paas", "apiKey": "...", "model": "glm-4"},
  {"name": "Claude", "baseUrl": "...", "apiKey": "...", "model": "claude-sonnet-4-20250514"}
]
```

#### 5.3.2 UI 适配

- 动态生成模型列，不再固定 3 列
- 结果页支持滚动浏览所有模型
- 考虑网格布局（2x2、3x2 等）

#### 5.3.3 要解决的问题

- [ ] 突破 3 个模型上限
- [ ] 模型配置更灵活（增删改）
- [ ] API Key 安全存储（避免明文 JSON）

---

### 5.4 Phase 4：历史记录与收藏（v0.5）

**目标**：保存查询历史，支持回看和收藏常用结果。

#### 5.4.1 功能设计

```bash
# 查看历史
Quick LLM History    # 新命令，展示历史查询列表

# 收藏
⌘ S → 收藏当前结果
收藏列表 → 查看所有收藏的结果
```

#### 5.4.2 存储

使用 LocalStorage（Raycast 内置）或 SQLite：

```
History {
  id: string
  input: string        // 原始文本
  prompt: string       // 使用的 System Prompt
  results: Result[]    // 各模型结果
  createdAt: number    // 时间戳
  favorite: boolean    // 是否收藏
}
```

#### 5.4.3 要解决的问题

- [ ] 查过的结果无法回看
- [ ] 好的结果无法保存
- [ ] 无法统计哪些 Prompt/模型组合效果最好

---

### 5.5 Phase 5：发布 Raycast Store（v1.0）

**目标**：打磨细节，发布到 Raycast Store，面向所有用户。

#### 5.5.1 发布前检查

- [ ] 所有错误场景优雅处理
- [ ] 图标和描述完善
- [ ] 支持 Raycast 的所有键盘交互标准
- [ ] 无障碍测试
- [ ] 性能优化（首屏加载时间）

#### 5.5.2 要解决的问题

- [ ] 其他用户可以一键安装
- [ ] 版本更新自动推送

---

## 6. 技术决策记录

### 6.1 为什么选择 OpenAI 兼容协议？

| 维度 | OpenAI 兼容 | 多协议适配 |
|------|------------|-----------|
| 覆盖面 | 覆盖 OpenAI、DeepSeek、GLM、Kimi、Ollama 等绝大多数服务 | 可覆盖 Anthropic、Google 等 |
| 维护成本 | 单一协议，维护简单 | 每种协议独立维护，复杂度高 |
| 用户配置 | 统一格式，用户只需换 Base URL | 不同协议配置方式不同 |

结论：OpenAI 兼容协议已成为事实标准，覆盖绝大多数场景。少数不兼容的 API（如 Anthropic）可以通过第三方代理（如 OpenRouter）转为 OpenAI 格式。

### 6.2 为什么使用 Detail 而非 Form/List？

| 组件 | 适用场景 | 优势 | 劣势 |
|------|---------|------|------|
| Detail | 展示长文本、Markdown | 支持格式化、适合展示结果 | 交互能力有限 |
| Form | 输入表单 | 适合配置和输入 | 不适合展示结果 |
| List | 列表选择 | 适合浏览多条记录 | 每条记录展示空间有限 |

结论：LLM 返回的文本通常较长，需要 Markdown 渲染能力。Detail 组件最适合展示结果。输入侧使用 `environment.getSelectedText()` 直接获取选中文本，无需 Form。

### 6.3 为什么 temperature 设为 0.3？

翻译、润色、总结等任务需要确定性输出。0.3 在保持一定灵活性的同时减少随机性。如果用户需要创意性输出（如续写、头脑风暴），可通过自定义 System Prompt 调整。

### 6.4 为什么不用流式响应（v0.1）？

v0.1 优先实现核心功能，流式响应需要额外处理 SSE 解析、增量更新、错误中断等复杂逻辑。放在 Phase 1 专门解决。

---

## 7. 变更日志

### 2026-04-04 v0.1 初始版本

**功能**：
- 选中文本 → 触发 Raycast 快捷键 → 多模型并行调用
- 支持最多 3 个 OpenAI 兼容模型
- 结果并排展示，显示响应耗时
- 支持复制全部/单个结果、粘贴到光标、重新执行

**技术实现**：
- 3 个源文件：`quick-llm.tsx`、`api.ts`、`types.ts`
- 零运行时依赖（仅 @raycast/api）
- 使用原生 `fetch` 调用 OpenAI 兼容接口

**限制**：
- 不支持流式响应
- 最多 3 个模型
- 无 Prompt 模板切换
- 无历史记录
