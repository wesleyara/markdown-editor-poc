/** Configuração global do md-editor-v3. Por padrão ele baixa mermaid, katex, highlight.js, cropper,
 * prettier e echarts de um CDN (unpkg); aqui entregamos as instâncias instaladas via npm (ou
 * desligamos o que não é usado), então o editor funciona offline e na versão que o pacote declara em
 * `dependencies`. É idempotente — pode ser chamado várias vezes. */
import { config } from 'md-editor-v3'
import mermaid from 'mermaid'
import katex from 'katex'
import hljs from 'highlight.js'
import 'katex/dist/katex.min.css'
import hljsLight from 'highlight.js/styles/atom-one-light.css?inline'
import hljsDark from 'highlight.js/styles/atom-one-dark.css?inline'

let configured = false

export function setupMarkdownEditor() {
  if (configured) return
  configured = true

  config({
    editorExtensions: {
      mermaid: { instance: mermaid },
      katex: { instance: katex },
      highlight: { instance: hljs },
      // O cropper só é usado pelo diálogo "recortar imagem" da toolbar nativa do md-editor, que não
      // exibimos (`:toolbars="[]"`). Um stub impede o download do cropperjs pelo CDN.
      cropper: { instance: class CropperStub {} }
    }
  })

  // Com a instância local o md-editor não injeta o CSS do highlight.js, então injetamos o tema
  // "atom" (o mesmo que ele usaria do CDN), com uma variante para cada tema do editor.
  if (typeof document !== 'undefined' && !document.getElementById('mde-hljs-theme')) {
    const style = document.createElement('style')
    style.id = 'mde-hljs-theme'
    style.textContent = `.md-editor:not(.md-editor-dark){${hljsLight}}\n.md-editor-dark{${hljsDark}}`
    document.head.appendChild(style)
  }
}
