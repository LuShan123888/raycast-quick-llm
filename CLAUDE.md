# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概述

Quick LLM 是一个 Raycast 扩展，将选中文本同时发送给多个 LLM 模型（OpenAI 兼容协议），结果并排展示。支持翻译、润色、总结等轻量文本任务。

## 常用命令

```bash
npm run dev        # 开发模式（热更新，连接 Raycast）
npm run build      # 生产构建
npm run lint       # 代码检查
npm run fix-lint   # 自动修复 lint 问题
```

## 架构

三个源文件，职责清晰：

- **`src/quick-llm.tsx`** — 主界面。读取偏好配置、获取选中文本、并行调度模型调用、渲染 Markdown 结果、处理快捷操作（复制/粘贴/重新执行）
- **`src/api.ts`** — API 层。封装 OpenAI Chat Completions 协议（`POST {baseUrl}/v1/chat/completions`），处理响应解析和错误，记录耗时。同时导出 `callAllModels`（批量调用）
- **`src/types.ts`** — `ModelConfig`（模型配置：name/baseUrl/apiKey/model）和 `ModelResult`（调用结果：content/loading/error/duration）

### 核心流程

`quick-llm.tsx` 启动时：`getSelectedText()` → `getModelsFromPreferences()`（将 3 组偏好字段解析为 ModelConfig 数组，跳过未完整配置的模型）→ `Promise.all` 并行调用 `callModel()` → 每个 Promise 完成后 `setResults` 逐步更新 UI。

### 模型配置

模型配置硬编码为 3 组偏好（Model 1-3），每组 4 个字段（Name/Base URL/API Key/Model ID）。只有 Base URL、API Key、Model ID 都填写的模型才参与调用。最多 3 个模型并行。

### UI 组件

使用 Raycast `Detail` 组件渲染 Markdown。快捷操作通过 `ActionPanel` 注册：Re-translate、Copy All（⌘C）、Copy Single（⌘⇧ 1/2/3）、Paste First（⌘P）。

## 关键细节

- API 调用使用原生 `fetch`（Raycast 环境内置），`temperature: 0.3`
- `baseUrl` 末尾斜杠自动清理（`replace(/\/+$/, "")`）
- 无流式响应，等待完整返回后更新 UI
- 设计规划见 `docs/DESIGN.md`
