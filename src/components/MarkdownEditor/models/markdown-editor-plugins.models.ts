/** Tipos das opções dos plugins de exemplo (`plugins/`). */
import type { Component } from 'vue'

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger'

export interface MarkdownTemplate {
  key: string
  label: string
  icon?: Component
  content: string
  /** `replace` troca todo o conteúdo; `insert` (padrão) insere no cursor. */
  mode?: 'insert' | 'replace'
}
