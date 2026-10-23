<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { MdPreview } from 'md-editor-v3'
import type { Themes } from 'md-editor-v3'
import type { MarkdownEditorMessages } from '../utils/i18n'

const props = defineProps<{ modelValue: string, theme: Themes, language: string, messages: MarkdownEditorMessages, editorId: string }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  emit('close')
}

// O PDF sai do diálogo de impressão do navegador ("Salvar como PDF"); o CSS `@media print` esconde
// tudo menos este diálogo (ver `.mde-pdf` em markdown-editor.css).
function print() {
  window.print()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="mde-root mde-overlay mde-pdf"
      :class="{ 'mde-dark': props.theme === 'dark' }"
      @click.self="emit('close')"
    >
      <div
        class="mde-dialog mde-dialog--wide"
        role="dialog"
        aria-modal="true"
        :aria-label="props.messages.exportPdf"
      >
        <div class="mde-dialog-header">
          <span class="mde-dialog-title">{{ props.messages.exportPdf }}</span>
          <button
            type="button"
            class="mde-btn mde-btn--primary"
            @click="print"
          >
            {{ props.messages.exportPdfAction }}
          </button>
        </div>
        <div class="mde-dialog-body mde-pdf-content mde-scroll">
          <MdPreview
            :editor-id="`${props.editorId}-pdf`"
            :model-value="props.modelValue"
            :language="props.language"
            :theme="props.theme"
            preview-theme="default"
            :no-img-zoom-in="true"
            :code-foldable="false"
            :show-code-row-number="false"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
