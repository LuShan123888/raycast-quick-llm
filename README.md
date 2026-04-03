# Quick LLM

A Raycast extension that sends selected text to multiple LLM models in parallel, displaying results side by side.

Select text → press hotkey → get results from multiple models instantly. Supports translation, polishing, summarization, and any lightweight text task.

## Features

- **Select & Go**: Select text anywhere, trigger via Raycast hotkey
- **Multi-Model Parallel**: Call multiple LLM APIs simultaneously, results update progressively
- **OpenAI Compatible**: Works with any OpenAI-compatible API (OpenAI, DeepSeek, GLM, etc.)
- **Configurable Prompt**: Customize system prompt for translation, polishing, summarization, or any task
- **Copy Actions**: Copy individual or all results, paste directly to cursor position

## Setup

1. Configure at least one model in extension preferences:
   - **Name**: Display name (e.g. "GPT-4o")
   - **Base URL**: OpenAI-compatible endpoint (e.g. `https://api.openai.com`)
   - **API Key**: Your API key
   - **Model ID**: Model identifier (e.g. `gpt-4o`)
2. Optionally configure Model 2 and Model 3 for parallel comparison
3. Customize the System Prompt for your use case (translation, polishing, etc.)

## Preferences

| Preference | Description | Default |
|-----------|-------------|---------|
| Model 1-3 Name | Display name for each model | Model 1/2/3 |
| Model 1-3 Base URL | OpenAI-compatible API base URL | — |
| Model 1-3 API Key | API key for each model | — |
| Model 1-3 Model ID | Model identifier string | — |
| System Prompt | Instruction sent to all models | Auto-translate (CN↔EN) |
| Max Tokens | Max response tokens per model | 2048 |
