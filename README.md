# Multi Translate

A Raycast extension that translates selected text using multiple LLM models simultaneously, displaying results side by side.

Like Bob's multi-model feature: select text → press hotkey → get translations from multiple models in parallel.

## Features

- **Select & Translate**: Select text anywhere, trigger via Raycast hotkey
- **Multi-Model Parallel**: Call multiple LLM APIs in parallel, results update progressively
- **OpenAI Compatible**: Works with any OpenAI-compatible API (OpenAI, Claude via proxy, DeepSeek, GLM, etc.)
- **Configurable Prompt**: Customize system prompt for translation, polishing, or any text task
- **Copy Actions**: Copy individual or all results

## Setup

1. Configure at least one model in extension preferences:
   - **Base URL**: OpenAI-compatible endpoint (e.g. `https://api.openai.com`)
   - **API Key**: Your API key
   - **Model ID**: Model identifier (e.g. `gpt-4o`)
2. Optionally configure up to 3 models
3. Select text anywhere, open Raycast, run "Multi Translate"

## Preferences

| Preference | Description | Default |
|---|---|---|
| Model 1-3 Name | Display name for each model | Model 1/2/3 |
| Model 1-3 Base URL | OpenAI-compatible API base URL | — |
| Model 1-3 API Key | API key for each model | — |
| Model 1-3 Model ID | Model identifier string | — |
| System Prompt | Instruction sent to all models | Auto-translate (CN→EN, EN→CN) |
| Max Tokens | Max response tokens per model | 2048 |
