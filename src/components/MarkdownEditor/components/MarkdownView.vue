<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { MdPreview } from 'md-editor-v3'
import { setupMarkdownEditor } from '../utils/setup'
import type { MarkdownViewProps } from '../models/markdown-view.models'
import MarkdownEditorImageLightbox from './MarkdownEditorImageLightbox.vue'

setupMarkdownEditor()

/** Renderização só-leitura com o mesmo pipeline do editor (mermaid, katex, highlight) — é o que o
 * ClickLocal usa para exibir comentários. */
const props = withDefaults(defineProps<MarkdownViewProps>(), {
  theme: 'light',
  language: 'en-US',
  imageLightbox: true,
  echarts: false
})

const lightbox = useTemplateRef('lightbox')

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (props.imageLightbox && target.tagName === 'IMG' && target.closest('.md-editor-preview')) {
    lightbox.value?.open((target as HTMLImageElement).src)
  }
}
</script>

<template>
  <div
    class="mde-view"
    @click="onClick"
  >
    <MdPreview
      :model-value="props.modelValue"
      :language="props.language"
      :theme="props.theme"
      preview-theme="default"
      :no-img-zoom-in="true"
      :no-echarts="!props.echarts"
      :show-code-row-number="true"
    />
    <MarkdownEditorImageLightbox ref="lightbox" />
  </div>
</template>
