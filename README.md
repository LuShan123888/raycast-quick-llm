# Quick LLM

[简体中文](#简体中文) | [English](#english)

---

## 简体中文

Raycast 扩展，将选中文本同时发送给多个 LLM 模型，结果并排展示，实时更新。

### 功能特性

- **即选即用** - 选中文本，触发 Raycast 快捷键，立即获取结果
- **多模型并行** - 同时调用最多 3 个 LLM API，结果逐步更新，显示响应耗时
- **OpenAI 兼容** - 支持所有 OpenAI 兼容接口（OpenAI、DeepSeek、GLM、Kimi 等）
- **自定义 Prompt** - 自由配置 System Prompt，支持翻译、润色、总结等任意轻量文本任务
- **快捷操作** - 复制单个/全部结果，直接粘贴到光标位置，一键重新执行

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

#### 配置

在 Raycast 扩展设置中配置模型，至少配置一个：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Model Name | 显示名称 | `GPT-4o` |
| Base URL | OpenAI 兼容接口地址 | `https://api.openai.com` |
| API Key | API 密钥 | `sk-...` |
| Model ID | 模型标识 | `gpt-4o` |

> 支持最多 3 个模型并行对比，Model 3 留空则不启用。

**常见模型配置示例：**

| 服务商 | Base URL | Model ID |
|--------|----------|----------|
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| GLM | `https://open.bigmodel.cn/api/paas` | `glm-4` |
| Kimi | `https://api.moonshot.cn` | `moonshot-v1-8k` |

#### 快捷操作

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 重新执行 | — | 重新调用所有模型 |
| 复制全部结果 | `⌘ C` | 合并所有模型结果 |
| 复制单个结果 | `⌘ ⇧ 1/2/3` | 复制对应模型的结果 |
| 粘贴首个结果 | `⌘ P` | 直接粘贴到光标位置 |

### 偏好设置

| 偏好项 | 说明 | 默认值 |
|--------|------|--------|
| Model 1-3 Name | 模型显示名称 | Model 1/2/3 |
| Model 1-3 Base URL | OpenAI 兼容接口地址 | — |
| Model 1-3 API Key | API 密钥 | — |
| Model 1-3 Model ID | 模型标识字符串 | — |
| System Prompt | 发送给所有模型的系统指令 | 自动翻译（中⇄英） |
| Max Tokens | 每个模型的最大响应 Token 数 | 2048 |

### 开发

#### 项目结构

```
raycast-quick-llm/
├── src/
│   ├── quick-llm.tsx    # 主界面：结果展示与交互
│   ├── api.ts           # API 调用：模型请求与响应处理
│   └── types.ts         # 类型定义
├── assets/
│   └── command-icon.png # 扩展图标
├── package.json         # 扩展配置与依赖
└── tsconfig.json        # TypeScript 配置
```

#### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 自动修复
npm run fix-lint
```

### 许可证

MIT

---

## English

A Raycast extension that sends selected text to multiple LLM models in parallel, displaying results side by side with live updates.

### Features

- **Select & Go** - Select text, trigger via Raycast hotkey, get results instantly
- **Multi-Model Parallel** - Call up to 3 LLM APIs simultaneously, results update progressively with response time
- **OpenAI Compatible** - Works with any OpenAI-compatible API (OpenAI, DeepSeek, GLM, Kimi, etc.)
- **Custom Prompt** - Configure System Prompt for translation, polishing, summarization, or any lightweight text task
- **Quick Actions** - Copy individual or all results, paste directly to cursor, one-click re-run

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

#### Configuration

Configure models in Raycast extension preferences (at least one required):

| Setting | Description | Example |
|---------|-------------|---------|
| Model Name | Display name | `GPT-4o` |
| Base URL | OpenAI-compatible endpoint | `https://api.openai.com` |
| API Key | API key | `sk-...` |
| Model ID | Model identifier | `gpt-4o` |

> Supports up to 3 models for parallel comparison. Leave Model 3 empty to disable.

**Common Model Configurations:**

| Provider | Base URL | Model ID |
|----------|----------|----------|
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| GLM | `https://open.bigmodel.cn/api/paas` | `glm-4` |
| Kimi | `https://api.moonshot.cn` | `moonshot-v1-8k` |

#### Quick Actions

| Action | Shortcut | Description |
|--------|----------|-------------|
| Re-run | — | Re-call all models |
| Copy All Results | `⌘ C` | Combine all model results |
| Copy Single Result | `⌘ ⇧ 1/2/3` | Copy specific model result |
| Paste First Result | `⌘ P` | Paste directly to cursor position |

### Preferences

| Preference | Description | Default |
|------------|-------------|---------|
| Model 1-3 Name | Display name for each model | Model 1/2/3 |
| Model 1-3 Base URL | OpenAI-compatible API base URL | — |
| Model 1-3 API Key | API key for each model | — |
| Model 1-3 Model ID | Model identifier string | — |
| System Prompt | Instruction sent to all models | Auto-translate (CN↔EN) |
| Max Tokens | Max response tokens per model | 2048 |

### Development

#### Project Structure

```
raycast-quick-llm/
├── src/
│   ├── quick-llm.tsx    # Main UI: result display and interaction
│   ├── api.ts           # API calls: model request and response handling
│   └── types.ts         # Type definitions
├── assets/
│   └── command-icon.png # Extension icon
├── package.json         # Extension config and dependencies
└── tsconfig.json        # TypeScript config
```

#### Local Development

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Auto-fix
npm run fix-lint
```

### License

MIT
