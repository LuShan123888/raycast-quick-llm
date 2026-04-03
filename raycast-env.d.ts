/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Model 1 Name - Display name for Model 1 (e.g. GPT-4o) */
  "model1Name": string,
  /** Model 1 Base URL - OpenAI-compatible base URL (e.g. https://api.openai.com) */
  "model1BaseUrl"?: string,
  /** Model 1 API Key - API key for Model 1 */
  "model1ApiKey"?: string,
  /** Model 1 ID - Model identifier (e.g. gpt-4o) */
  "model1Model"?: string,
  /** Model 2 Name - Display name for Model 2 */
  "model2Name": string,
  /** Model 2 Base URL - OpenAI-compatible base URL */
  "model2BaseUrl"?: string,
  /** Model 2 API Key - API key for Model 2 */
  "model2ApiKey"?: string,
  /** Model 2 ID - Model identifier */
  "model2Model"?: string,
  /** Model 3 Name - Display name for Model 3 (leave empty to disable) */
  "model3Name"?: string,
  /** Model 3 Base URL - OpenAI-compatible base URL */
  "model3BaseUrl"?: string,
  /** Model 3 API Key - API key for Model 3 */
  "model3ApiKey"?: string,
  /** Model 3 ID - Model identifier */
  "model3Model"?: string,
  /** System Prompt - System prompt for translation. Leave default for auto-translate. */
  "systemPrompt": unknown,
  /** Max Tokens - Maximum tokens for each response */
  "maxTokens": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `translate` command */
  export type Translate = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `translate` command */
  export type Translate = {}
}

