# Quick LLM

[简体中文](#简体中文) | [English](#english)

---

## 简体中文

Raycast 扩展，将文本同时发送给多个 LLM 模型，SSE 流式响应，结果实时逐字更新。

### 功能特性

- **流式响应** - SSE 逐字输出，实时更新，体感零延迟
- **多模型并行** - 动态配置任意数量模型，同时调用，独立流式更新
- **多种输入** - 选中文本（自动获取）、剪贴板内容（自动读取）、手动输入（兜底）
- **OpenAI 兼容** - 支持所有 OpenAI 兼容接口（OpenAI、DeepSeek、GLM、Kimi 等）
- **自定义 Prompt** - 自由配置 System Prompt，支持翻译、润色、总结等任意轻量文本任务
- **快捷操作** - 每个模型独立 Copy/Paste，复制全部结果，一键重新执行
- **扩展内配置** - 无需跳出 Raycast，在扩展内直接管理模型和系统设置

### 使用

#### 安装

**方式一：Raycast Store（推荐）**

在 Raycast Store 中搜索 "Quick LLM" 安装。

**方式二：本地开发安装**

```bash
git clone https://github.com/LuShan123888/raycast-quick-llm.git
cd raycast-quick-llm
npm install
npm run dev
```

#### 输入方式

| 优先级 | 方式 | 说明 |
|--------|------|------|
| 1 | 选中文本 | 在任意应用中选中文本，触发快捷键自动获取 |
| 2 | 剪贴板 | 未选中文本时自动读取剪贴板内容 |
| 3 | 手动输入 | 都没有时显示输入表单，手动输入或粘贴 |

#### 配置

运行 "Configure Models" 命令，在扩展内直接管理：

**模型管理** — 动态增删改，不限制数量：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Model Name | 显示名称 | `GPT-4o` |
| Base URL | OpenAI 兼容接口地址 | `https://api.openai.com` |
| API Key | API 密钥 | `sk-...` |
| Model ID | 模型标识 | `gpt-4o` |

**常见模型配置示例：**

| 服务商 | Base URL | Model ID |
|--------|----------|----------|
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| GLM | `https://open.bigmodel.cn/api/paas` | `glm-4` |
| Kimi | `https://api.moonshot.cn` | `moonshot-v1-8k` |

**系统设置** — Configure Models → Settings：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| System Prompt | 发送给所有模型的系统指令 | 自动翻译（中⇄英） |
| Max Tokens | 每个模型的最大响应 Token 数 | 2048 |

#### 快捷操作

结果页按 `⌘+K` 或 `···` 打开操作菜单：

| 操作 | 说明 |
|------|------|
| Re-translate | 重新调用所有模型 |
| New Input (`⌘N`) | 回到输入表单 |
| Configure Models (`⌘⇧C`) | 打开配置面板 |
| Copy All Results (`⌘C`) | 合并所有模型结果 |
| **模型子菜单** | |
| Copy Result | 复制该模型结果 |
| Paste Result | 直接粘贴到光标位置 |

#### 状态标识

| 标识 | 含义 |
|------|------|
| `⏳` | 流式接收中 |
| `❌` | 调用出错 |
| `(1.2s)` | 响应耗时 |

### 开发

#### 项目结构

```
raycast-quick-llm/
├── src/
│   ├── quick-llm.tsx    # 主命令：输入获取、流式调度、结果展示
│   ├── configure.tsx    # 配置命令：模型管理、系统设置
│   ├── api.ts           # API 层：SSE 流式解析、非流式降级
│   └── types.ts         # 类型定义
├── assets/
│   └── command-icon.png # 扩展图标
├── package.json         # 扩展配置
└── tsconfig.json        # TypeScript 配置
```

#### 本地开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（热更新）
npm run build      # 生产构建
npm run lint       # 代码检查
npm run fix-lint   # 自动修复
```

### 许可证

MIT

---

## English

A Raycast extension that sends text to multiple LLM models in parallel with SSE streaming — results update in real-time, character by character.

### Features

- **SSE Streaming** - Real-time character-by-character output, zero perceived latency
- **Multi-Model Parallel** - Configure any number of models, call simultaneously, independent streaming
- **Flexible Input** - Selected text (auto), clipboard (auto-fallback), or manual input
- **OpenAI Compatible** - Works with any OpenAI-compatible API (OpenAI, DeepSeek, GLM, Kimi, etc.)
- **Custom Prompt** - Configure System Prompt for translation, polishing, summarization, or any task
- **Quick Actions** - Per-model Copy/Paste, copy all results, one-click re-run
- **In-App Config** - Manage models and settings directly within the extension

### Usage

#### Installation

**Option 1: Raycast Store (Recommended)**

Search "Quick LLM" in the Raycast Store.

**Option 2: Local Development**

```bash
git clone https://github.com/LuShan123888/raycast-quick-llm.git
cd raycast-quick-llm
npm install
npm run dev
```

#### Input Methods

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | Selected text | Select text in any app, trigger hotkey to auto-capture |
| 2 | Clipboard | Auto-read clipboard when no text is selected |
| 3 | Manual input | Show input form as fallback |

#### Configuration

Run the "Configure Models" command to manage directly in-app:

**Model Management** — Add, edit, delete any number of models:

| Setting | Description | Example |
|---------|-------------|---------|
| Model Name | Display name | `GPT-4o` |
| Base URL | OpenAI-compatible endpoint | `https://api.openai.com` |
| API Key | API key | `sk-...` |
| Model ID | Model identifier | `gpt-4o` |

**Common Model Configurations:**

| Provider | Base URL | Model ID |
|----------|----------|----------|
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| GLM | `https://open.bigmodel.cn/api/paas` | `glm-4` |
| Kimi | `https://api.moonshot.cn` | `moonshot-v1-8k` |

**System Settings** — Configure Models → Settings:

| Setting | Description | Default |
|---------|-------------|---------|
| System Prompt | Instruction sent to all models | Auto-translate (CN↔EN) |
| Max Tokens | Max response tokens per model | 2048 |

#### Quick Actions

Press `⌘+K` or `···` on the result page:

| Action | Description |
|--------|-------------|
| Re-translate | Re-call all models |
| New Input (`⌘N`) | Back to input form |
| Configure Models (`⌘⇧C`) | Open configuration |
| Copy All Results (`⌘C`) | Combine all results |
| **Model submenu** | |
| Copy Result | Copy this model's result |
| Paste Result | Paste directly to cursor |

#### Status Indicators

| Indicator | Meaning |
|-----------|---------|
| `⏳` | Streaming in progress |
| `❌` | Error occurred |
| `(1.2s)` | Response time |

### Development

#### Project Structure

```
raycast-quick-llm/
├── src/
│   ├── quick-llm.tsx    # Main command: input, streaming dispatch, results
│   ├── configure.tsx    # Config command: model management, settings
│   ├── api.ts           # API layer: SSE parsing, non-stream fallback
│   └── types.ts         # Type definitions
├── assets/
│   └── command-icon.png # Extension icon
├── package.json         # Extension config
└── tsconfig.json        # TypeScript config
```

#### Local Development

```bash
npm install        # Install dependencies
npm run dev        # Development mode (hot reload)
npm run build      # Production build
npm run lint       # Lint
npm run fix-lint   # Auto-fix
```

### License

MIT
