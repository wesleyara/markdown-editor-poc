import { Highlighter, Keyboard, ListCollapse, SeparatorHorizontal } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import { block, text, wrap } from './helpers'

/** Exemplo de plugin sem botões: só acrescenta itens ao menu nativo "Insert". Usa HTML inline,
 * que o md-editor-v3 renderiza (como o `<u>` do sublinhado). */
export function extraBlocksPlugin() {
  return defineToolbarPlugin({
    name: 'extra-blocks',
    insertMenuItems: [
      { key: 'details', label: 'Bloco recolhível', icon: ListCollapse, onSelect: ({ insert }) => insert(wrap('\n<details>\n<summary>Detalhes</summary>\n\n', '\n\n</details>\n', 'conteúdo')) },
      { key: 'mark', label: 'Marca-texto', icon: Highlighter, onSelect: ({ insert }) => insert(wrap('<mark>', '</mark>', 'destaque')) },
      { key: 'kbd', label: 'Tecla', icon: Keyboard, onSelect: ({ insert }) => insert(wrap('<kbd>', '</kbd>', 'Ctrl')) },
      { key: 'hr', label: 'Linha divisória', icon: SeparatorHorizontal, onSelect: ({ insert }) => insert(text(block('---'))) }
    ]
  })
}
