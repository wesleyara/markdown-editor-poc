import type { Themes } from 'md-editor-v3'

export interface MarkdownEditorFullscreenPreviewProps {
  modelValue: string
  theme: Themes
  language: string
  echarts: boolean
}

export interface MarkdownEditorFullscreenPreviewEmits {
  imageClick: [src: string]
}
