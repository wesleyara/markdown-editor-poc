import { Smile } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import { text } from './helpers'

const defaultEmojis = [
  { emoji: '✅', label: 'Feito' },
  { emoji: '🚧', label: 'Em andamento' },
  { emoji: '⚠️', label: 'Atenção' },
  { emoji: '❌', label: 'Bloqueado' },
  { emoji: '🐛', label: 'Bug' },
  { emoji: '💡', label: 'Ideia' },
  { emoji: '🚀', label: 'Deploy' },
  { emoji: '👀', label: 'Revisar' },
  { emoji: '🔴', label: 'Prioridade alta' },
  { emoji: '🟡', label: 'Prioridade média' },
  { emoji: '🟢', label: 'Prioridade baixa' }
]

/** Exemplo de dropdown configurável: emojis de status e de prioridade; a lista vem por opção. Sem ícone por item: o
 * próprio emoji entra no rótulo. */
export function emojiPlugin(options: { emojis?: Array<{ emoji: string, label: string }> } = {}) {
  const emojis = options.emojis ?? defaultEmojis

  return defineToolbarPlugin({
    name: 'emoji',
    buttons: [{
      key: 'menu',
      title: 'Emoji',
      icon: Smile,
      items: emojis.map(({ emoji, label }) => ({
        key: emoji,
        label: `${emoji}  ${label}`,
        onSelect: ({ insert }) => insert(text(`${emoji} `))
      }))
    }]
  })
}
