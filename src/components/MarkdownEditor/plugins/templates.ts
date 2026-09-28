import { Bug, ClipboardList, LayoutTemplate } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import type { MarkdownTemplate } from '../models/markdown-editor-plugins.models'

export const defaultTemplates: MarkdownTemplate[] = [
  {
    key: 'bug',
    label: 'Bug report',
    icon: Bug,
    content: `## Descrição

## Passos para reproduzir
1.
2.

## Esperado

## Obtido
`
  },
  {
    key: 'meeting',
    label: 'Ata de reunião',
    icon: ClipboardList,
    content: `## Participantes
-

## Pauta
-

## Decisões
- [ ]
`
  }
]

/** Exemplo que usa `getValue`/`setValue`, além de `insert`: modelos que substituem o conteúdo
 * (pedindo confirmação se já houver texto) ou entram no cursor. */
export function templatesPlugin(options: { templates?: MarkdownTemplate[], confirm?: (message: string) => boolean } = {}) {
  const templates = options.templates ?? defaultTemplates
  const confirm = options.confirm ?? ((message: string) => window.confirm(message))

  return defineToolbarPlugin({
    name: 'templates',
    buttons: [{
      key: 'menu',
      title: 'Modelos',
      icon: LayoutTemplate,
      items: templates.map(t => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        onSelect: ({ insert, getValue, setValue, focus }) => {
          if (t.mode === 'replace') {
            if (getValue().trim() && !confirm('Substituir todo o conteúdo pelo modelo?')) return
            setValue(t.content)
            focus()
            return
          }
          insert(() => ({ targetValue: t.content }))
        }
      }))
    }]
  })
}
