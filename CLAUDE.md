# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概述

Quick LLM 是一个 Raycast 扩展，将文本同时发送给多个 LLM 模型（OpenAI 兼容协议），SSE 流式响应，结果实时逐字更新。支持翻译、润色、总结等轻量文本任务。

## 常用命令

```bash
npm run dev        # 开发模式（热更新，连接 Raycast）
npm run build      # 生产构建
npm run lint       # 代码检查
npm run fix-lint   # 自动修复 lint 问题
```

## 架构

四个源文件，两个命令：

### 命令

| 命令 | 文件 | 说明 |
|------|------|------|
| Quick LLM | `src/quick-llm.tsx` | 主命令：输入获取、流式调度、结果展示 |
| Configure Models | `src/configure.tsx` | 配置命令：模型增删改、系统设置 |

### 辅助模块

| 模块 | 职责 |
|------|------|
| `src/api.ts` | `callModelStream()`（SSE 流式，onChunk/onDone 回调）、`callModel()`（非流式降级备用） |
| `src/types.ts` | `ModelConfig`（id/name/baseUrl/apiKey/model）、`ModelResult`（name/content/loading/streaming/error/duration）、`AppConfig`（models/systemPrompt/maxTokens） |

### 核心流程

`quick-llm.tsx` 启动时：
1. 从 LocalStorage 加载 `AppConfig`（key: `quick-llm-config`）
2. 依次尝试 `getSelectedText()` → `Clipboard.read()` → 显示输入 Form
3. 有文本后并行启动 `callModelStream()`，每个模型独立流式更新
4. `onChunk` 回调追加 content，`onDone` 回调标记完成并记录耗时

### 配置存储

所有配置通过 Raycast `LocalStorage` 持久化（key: `quick-llm-config`），存储为 JSON：
- `models`: ModelConfig 数组（动态数量）
- `systemPrompt`: 系统提示词
- `maxTokens`: 最大 Token 数

`package.json` 中 `preferences: []`，无 Raycast Preferences（避免显示欢迎页）。

### UI 组件

主命令用内部状态 `View` 切换三种视图：
- `input` — Form + TextArea 手动输入
- `result` — Detail 渲染 Markdown 结果
- `unconfigured` — 引导配置

配置命令同样用 `View` 状态切换 List 和 Form。

## 关键细节

- API 调用使用原生 `fetch`（Raycast 环境内置），`temperature: 0.3`
- `baseUrl` 末尾斜杠自动清理（`replace(/\/+$/, "")`）
- 流式响应：`stream: true`，解析 SSE `data:` 行，非 SSE 响应自动降级为非流式
- 组件卸载时 `abortRef.current = true` 中止未完成的流
- 设计规划见 `docs/DESIGN.md`
