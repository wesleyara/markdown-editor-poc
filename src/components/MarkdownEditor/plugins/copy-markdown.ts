import { Copy } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'

/** Exemplo de botão simples que não mexe no texto: copia o markdown para a área de transferência. */
export function copyMarkdownPlugin(options: { onCopied?: () => void, onError?: (error: unknown) => void } = {}) {
  return defineToolbarPlugin({
    name: 'copy-markdown',
    buttons: [{
      key: 'copy',
      title: 'Copiar markdown',
      icon: Copy,
      onClick: async ({ getValue }) => {
        try {
          await navigator.clipboard.writeText(getValue())
          options.onCopied?.()
        } catch (error) {
          options.onError?.(error)
        }
      }
    }]
  })
}
