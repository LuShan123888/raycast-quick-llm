/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quick-llm` command */
  export type QuickLlm = ExtensionPreferences & {}
  /** Preferences accessible in the `configure` command */
  export type Configure = ExtensionPreferences & {}
  /** Preferences accessible in the `templates` command */
  export type Templates = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quick-llm` command */
  export type QuickLlm = {}
  /** Arguments passed to the `configure` command */
  export type Configure = {}
  /** Arguments passed to the `templates` command */
  export type Templates = {}
}

