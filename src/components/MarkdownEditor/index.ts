import 'md-editor-v3/lib/style.css'
import './styles/markdown-editor.css'
import type { App, Plugin } from 'vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import MarkdownView from './components/MarkdownView.vue'
import MarkdownEditorImageLightbox from './components/MarkdownEditorImageLightbox.vue'
import { setupMarkdownEditor } from './utils/setup'

export { MarkdownEditor, MarkdownView, MarkdownEditorImageLightbox, setupMarkdownEditor }
export * as markdownToolbar from './utils/markdown-toolbar'
export { defineToolbarPlugin, isToolbarMenu } from './utils/toolbar'
export * from './plugins'

export type * from './models/markdown-editor.models'
export type * from './models/markdown-view.models'
export type * from './models/markdown-editor-image-lightbox.models'
export type * from './models/markdown-toolbar.models'
export type * from './models/markdown-editor-plugins.models'

/** Uso opcional como plugin: `app.use(MarkdownEditorPlugin)` registra os componentes globalmente. */
export const MarkdownEditorPlugin: Plugin = {
  install(app: App) {
    setupMarkdownEditor()
    app.component('MarkdownEditor', MarkdownEditor)
    app.component('MarkdownView', MarkdownView)
  }
}

export default MarkdownEditorPlugin
