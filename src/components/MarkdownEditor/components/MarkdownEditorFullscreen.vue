<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import type { MarkdownEditorFullscreenProps } from '../models/markdown-editor-fullscreen.models'

const props = defineProps<MarkdownEditorFullscreenProps>()

const open = defineModel<boolean>('open', { required: true })
let previouslyFocused: HTMLElement | null = null
let previousOverflow = ''

function onKeydown(event: KeyboardEvent) {
  // Esc já tratado (ex.: pelo lightbox aberto por cima) não fecha a tela cheia.
  if (event.key === 'Escape' && !event.defaultPrevented) open.value = false
}

function teardown() {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = previousOverflow
  previouslyFocused?.focus()
  previouslyFocused = null
}

watch(open, (value) => {
  if (value) {
    previouslyFocused = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
  } else {
    teardown()
  }
})

onBeforeUnmount(() => {
  if (open.value) teardown()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="mde-root mde-fullscreen"
      :class="{ 'mde-dark': props.theme === 'dark' }"
      role="dialog"
      aria-modal="true"
      aria-label="Editor"
    >
      <slot />
    </div>
  </Teleport>
</template>
