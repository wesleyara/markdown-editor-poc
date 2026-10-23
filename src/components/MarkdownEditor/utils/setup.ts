/** Configuração global do md-editor-v3. Por padrão ele baixa mermaid, katex, highlight.js, cropper,
 * prettier e echarts de um CDN (unpkg); aqui entregamos as instâncias instaladas via npm (ou
 * desligamos o que não é usado), então o editor funciona offline e na versão que o pacote declara em
 * `dependencies`. É idempotente — pode ser chamado várias vezes. */
import { config } from 'md-editor-v3'
import { lineNumbers } from '@codemirror/view'
import PT_BR from '@vavt/cm-extension/dist/locale/pt-BR'
import mermaid from 'mermaid'
import katex from 'katex'
import hljs from 'highlight.js'
import '@fontsource-variable/recursive'
import 'katex/dist/katex.min.css'
import hljsLight from 'highlight.js/styles/atom-one-light.css?inline'
import hljsDark from 'highlight.js/styles/atom-one-dark.css?inline'

const MERMAID_FONT = '"Recursive Variable", ui-monospace, Menlo, Consolas, monospace'

let configured = false

export function setupMarkdownEditor() {
  if (configured) return
  configured = true

  // A fonte é carregada sob demanda; o mermaid mede os rótulos na hora de renderizar, então um
  // carregamento tardio deixa o texto mais largo que a caixa (rótulos cortados). Aquecemos já.
  if (typeof document !== 'undefined') void document.fonts?.load('16px "Recursive Variable"')

  config({
    // Números de linha na área de edição (a toolbar nativa do md-editor não é usada, então o
    // CodeMirror vem sem eles).
    codeMirrorExtensions: extensions => [...extensions, { type: 'lineNumbers', extension: lineNumbers() }],
    // Traduções do md-editor-v3 além de en-US/zh-CN; use com `language="pt-BR"`.
    editorConfig: { languageUserDefined: { 'pt-BR': PT_BR } },
    // `![video](url)` vira um <video> reproduzível; uploads de vídeo são inseridos com esse alt.
    markdownItConfig(md) {
      const defaultImage = md.renderer.rules.image
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]!
        if (token.content.trim().toLowerCase() === 'video') {
          const src = md.utils.escapeHtml(token.attrGet('src') ?? '')
          return `<video controls preload="metadata" src="${src}" style="max-width:100%"></video>`
        }
        return defaultImage ? defaultImage(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
      }
    },
    // Visual do mermaid.live: look `neo` (nós arredondados, sombras suaves, traços nítidos).
    mermaidConfig: base => ({
      startOnLoad: false,
      // O `base` do md-editor trazia theme + themeVariables que sobrescreveriam a paleta neo.
      theme: base.theme === 'dark' ? 'neo-dark' : 'neo',
      look: 'neo',
      fontFamily: MERMAID_FONT,
      themeVariables: { fontFamily: MERMAID_FONT },
      // Rótulos SVG são medidos e desenhados com a mesma fonte, então ficam centralizados nos nós
      // (os de foreignObject são medidos com outra fonte que a do CSS do editor).
      htmlLabels: false,
      flowchart: { ...base?.flowchart, htmlLabels: false, curve: 'basis', padding: 16 }
    }),
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
