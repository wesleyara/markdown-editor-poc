import { AlertTriangle, Info, Lightbulb, MessageSquareWarning, OctagonAlert } from '@lucide/vue'
import type { Component } from 'vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import type { ToolbarMenuItem } from '../models/markdown-toolbar.models'
import type { CalloutType } from '../models/markdown-editor-plugins.models'
import { wrap } from './helpers'

const defaults: Record<CalloutType, { label: string, icon: Component }> = {
  note: { label: 'Nota', icon: Info },
  tip: { label: 'Dica', icon: Lightbulb },
  warning: { label: 'Atenção', icon: AlertTriangle },
  danger: { label: 'Perigo', icon: OctagonAlert }
}

/**
 * Exemplo de **dropdown próprio**. Insere blocos de admonition, sintaxe que o md-editor-v3
 * renderiza nativamente:
 *
 *     !!! warning Título
 *     conteúdo
 *     !!!
 */
export function calloutsPlugin(options: { types?: CalloutType[] } = {}) {
  const types = options.types ?? ['note', 'tip', 'warning', 'danger']

  const items: ToolbarMenuItem[] = types.map(type => ({
    key: type,
    label: defaults[type].label,
    icon: defaults[type].icon,
    onSelect: ({ insert }) => insert(wrap(`\n!!! ${type} ${defaults[type].label}\n`, '\n!!!\n', 'conteúdo'))
  }))

  return defineToolbarPlugin({
    name: 'callouts',
    buttons: [{ key: 'menu', title: 'Callouts', icon: MessageSquareWarning, items }]
  })
}
