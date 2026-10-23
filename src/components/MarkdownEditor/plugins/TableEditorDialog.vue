<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Minus, Plus } from '@lucide/vue'
import type { Themes } from 'md-editor-v3'
import type { MarkdownEditorMessages } from '../utils/i18n'

const props = defineProps<{ theme: Themes, messages: MarkdownEditorMessages }>()
const emit = defineEmits<{ insert: [markdown: string], close: [] }>()

const MIN_COLS = 1
const MAX_COLS = 10
const MIN_ROWS = 1
const MAX_ROWS = 20

const headers = ref<string[]>([])
const body = ref<string[][]>([])

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function reset() {
  headers.value = Array.from({ length: 3 }, (_, i) => `${props.messages.tableHeader} ${i + 1}`)
  body.value = Array.from({ length: 2 }, () => Array<string>(3).fill(''))
}

function resizeCols(delta: number) {
  const next = clamp(headers.value.length + delta, MIN_COLS, MAX_COLS)
  if (next > headers.value.length) {
    headers.value.push(`${props.messages.tableHeader} ${next}`)
    body.value.forEach(row => row.push(''))
  } else if (next < headers.value.length) {
    headers.value.pop()
    body.value.forEach(row => row.pop())
  }
}

function resizeRows(delta: number) {
  const next = clamp(body.value.length + delta, MIN_ROWS, MAX_ROWS)
  if (next > body.value.length) body.value.push(Array<string>(headers.value.length).fill(''))
  else if (next < body.value.length) body.value.pop()
}

const cell = (value: string) => value.replace(/\|/g, '\\|').trim() || ' '

function toMarkdown() {
  const row = (cells: string[]) => `| ${cells.map(cell).join(' | ')} |`
  return `\n${[row(headers.value), row(headers.value.map(() => '---')), ...body.value.map(row)].join('\n')}\n`
}

function insert() {
  emit('insert', toMarkdown())
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  // preventDefault avisa o fullscreen (que escuta o mesmo Esc) de que já foi tratado.
  event.preventDefault()
  emit('close')
}

reset()
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="mde-root mde-overlay"
      :class="{ 'mde-dark': props.theme === 'dark' }"
      @click.self="emit('close')"
    >
      <div
        class="mde-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="props.messages.tableEditor"
      >
        <div class="mde-dialog-header">
          <span class="mde-dialog-title">{{ props.messages.tableEditor }}</span>
          <div class="mde-counters">
            <div class="mde-counter">
              <span class="mde-label">{{ props.messages.tableColumns }}</span>
              <div class="mde-counter-controls">
                <button
                  type="button"
                  class="mde-btn"
                  :title="props.messages.tableRemove"
                  :aria-label="`${props.messages.tableRemove} ${props.messages.tableColumns}`"
                  :disabled="headers.length <= MIN_COLS"
                  @click="resizeCols(-1)"
                >
                  <Minus class="mde-icon" />
                </button>
                <span class="mde-counter-value">{{ headers.length }}</span>
                <button
                  type="button"
                  class="mde-btn"
                  :title="props.messages.tableAdd"
                  :aria-label="`${props.messages.tableAdd} ${props.messages.tableColumns}`"
                  :disabled="headers.length >= MAX_COLS"
                  @click="resizeCols(1)"
                >
                  <Plus class="mde-icon" />
                </button>
              </div>
            </div>
            <div class="mde-counter">
              <span class="mde-label">{{ props.messages.tableRows }}</span>
              <div class="mde-counter-controls">
                <button
                  type="button"
                  class="mde-btn"
                  :title="props.messages.tableRemove"
                  :aria-label="`${props.messages.tableRemove} ${props.messages.tableRows}`"
                  :disabled="body.length <= MIN_ROWS"
                  @click="resizeRows(-1)"
                >
                  <Minus class="mde-icon" />
                </button>
                <span class="mde-counter-value">{{ body.length }}</span>
                <button
                  type="button"
                  class="mde-btn"
                  :title="props.messages.tableAdd"
                  :aria-label="`${props.messages.tableAdd} ${props.messages.tableRows}`"
                  :disabled="body.length >= MAX_ROWS"
                  @click="resizeRows(1)"
                >
                  <Plus class="mde-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mde-dialog-body">
          <table class="mde-table-grid">
            <thead>
              <tr>
                <th
                  v-for="(_, ci) in headers"
                  :key="ci"
                >
                  <input
                    v-model="headers[ci]"
                    class="mde-cell mde-cell--header"
                    :placeholder="`${props.messages.tableHeader} ${ci + 1}`"
                  >
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in body"
                :key="ri"
              >
                <td
                  v-for="(_, ci) in row"
                  :key="ci"
                >
                  <input
                    v-model="body[ri]![ci]"
                    class="mde-cell"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mde-dialog-footer">
          <button
            type="button"
            class="mde-btn mde-btn--outline"
            @click="emit('close')"
          >
            {{ props.messages.tableCancel }}
          </button>
          <button
            type="button"
            class="mde-btn mde-btn--primary"
            @click="insert"
          >
            {{ props.messages.tableInsert }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
