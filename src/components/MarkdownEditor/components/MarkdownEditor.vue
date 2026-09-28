<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import type { Component } from 'vue'
import { MdEditor, MdPreview } from 'md-editor-v3'
import type { ExposeParam } from 'md-editor-v3'
import {
  Bold, ChevronDown, Code, Ellipsis, Heading, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Image, Italic, Link, List, ListOrdered, ListTodo, Maximize2, Plus, Quote, Sigma, SquareCode,
  Strikethrough, Subscript, Superscript, Table, Underline, Workflow
} from '@lucide/vue'
import { setupMarkdownEditor } from '../utils/setup'
import * as md from '../utils/markdown-toolbar'
import { isToolbarMenu } from '../utils/toolbar'
import type { BuiltinTool, InsertGenerator, ToolbarContext, ToolbarEntry, ToolbarMenuItem, ToolbarGroup, ToolbarPlugin, ToolbarPluginPlacement } from '../models/markdown-toolbar.models'
import type { MarkdownEditorEmits, MarkdownEditorProps, MarkdownEditorToolbarEntry, MarkdownEditorViewMode } from '../models/markdown-editor.models'
import type { MarkdownEditorDropdownItem } from '../models/markdown-editor-dropdown-menu.models'
import MarkdownEditorDropdownMenu from './MarkdownEditorDropdownMenu.vue'
import MarkdownEditorFullscreenPreview from './MarkdownEditorFullscreenPreview.vue'
import MarkdownEditorImageLightbox from './MarkdownEditorImageLightbox.vue'

setupMarkdownEditor()

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
  height: '240px',
  onUploadImg: undefined,
  theme: 'light',
  language: 'en-US',
  placeholder: '',
  imageLightbox: true,
  toolbarButtons: () => [],
  plugins: () => [],
  headingMenuItems: () => [],
  insertMenuItems: () => [],
  hideTools: () => [],
  prettier: false,
  pluginsPlacement: 'menu',
  echarts: false
})

const emit = defineEmits<MarkdownEditorEmits>()

const viewMode = ref<MarkdownEditorViewMode>('editor')
const editorRef = useTemplateRef<ExposeParam>('editorRef')
const previewFullscreen = ref(false)
const lightbox = useTemplateRef('lightbox')

function run(generator: InsertGenerator) {
  // `insert` só existe com o editor montado; no modo preview voltamos pro editor primeiro.
  if (viewMode.value !== 'editor') viewMode.value = 'editor'
  editorRef.value?.insert(generator)
}

const ctx: ToolbarContext = {
  insert: run,
  getValue: () => props.modelValue,
  setValue: value => emit('update:modelValue', value),
  focus: () => editorRef.value?.focus()
}

function openImage(src: string) {
  if (props.imageLightbox) lightbox.value?.open(src)
}

function onPreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG' && target.closest('.md-editor-preview')) {
    openImage((target as HTMLImageElement).src)
  }
}

const hidden = computed(() => new Set<string>([
  ...props.hideTools,
  ...props.plugins.flatMap(p => p.hideTools ?? [])
]))

function builtinItem(key: BuiltinTool, label: string, icon: Component, generator: InsertGenerator): MarkdownEditorDropdownItem {
  return { key, label, icon, onSelect: () => run(generator) }
}

function customItems(items: ToolbarMenuItem[], prefix = ''): MarkdownEditorDropdownItem[] {
  return items.map(item => ({ key: prefix + item.key, label: item.label, icon: item.icon, onSelect: () => item.onSelect(ctx) }))
}

function customEntry(entry: ToolbarEntry, prefix = ''): MarkdownEditorToolbarEntry {
  const base = { key: prefix + entry.key, title: entry.title, icon: entry.icon, label: entry.label }
  return isToolbarMenu(entry)
    ? { kind: 'menu', ...base, items: customItems(entry.items) }
    : { kind: 'button', ...base, action: () => entry.onClick(ctx) }
}

// No menu "More tools": botões viram itens e dropdowns viram submenus.
function customMenuItem(entry: ToolbarEntry, prefix = ''): MarkdownEditorDropdownItem {
  const base = { key: prefix + entry.key, label: entry.title, icon: entry.icon }
  return isToolbarMenu(entry)
    ? { ...base, children: customItems(entry.items, `${base.key}:`) }
    : { ...base, onSelect: () => entry.onClick(ctx) }
}

// Chaves dos itens de plugin ficam como `plugin:<name>:<key>` para não colidir com as nativas.
const pluginPrefix = (p: ToolbarPlugin) => `plugin:${p.name}:`

const pluginsIn = (placement: ToolbarPluginPlacement) =>
  props.plugins.filter(p => (p.placement ?? props.pluginsPlacement) === placement)

// Entradas com `group` vão para o fim do grupo nativo indicado, de onde quer que venham.
function entriesInGroup(group: ToolbarGroup): MarkdownEditorToolbarEntry[] {
  return [
    ...props.toolbarButtons.filter(e => e.group === group).map(e => customEntry(e)),
    ...props.plugins.flatMap(p => (p.buttons ?? []).filter(e => e.group === group).map(e => customEntry(e, pluginPrefix(p))))
  ]
}

const ungrouped = (entries: ToolbarEntry[] = []) => entries.filter(e => !e.group)

const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6]

const groups = computed<MarkdownEditorToolbarEntry[][]>(() => {
  const visible = <T extends { key: string }>(list: T[]) => list.filter(e => !hidden.value.has(e.key))

  const headingItems = visible([
    ...headingIcons.map((icon, i) => builtinItem(`h${i + 1}` as BuiltinTool, `Heading ${i + 1}`, icon, md.heading((i + 1) as 1 | 2 | 3 | 4 | 5 | 6))),
    builtinItem('sub', 'Subscript', Subscript, md.sub),
    builtinItem('sup', 'Superscript', Superscript, md.sup)
  ]).concat(
    customItems(props.headingMenuItems),
    props.plugins.flatMap(p => customItems(p.headingMenuItems ?? [], pluginPrefix(p)))
  )

  const insertItems = visible([
    builtinItem('quote', 'Quote', Quote, md.quote),
    builtinItem('codeInline', 'Inline code', Code, md.codeInline),
    builtinItem('codeBlock', 'Code block', SquareCode, md.codeBlock),
    builtinItem('link', 'Link', Link, md.link),
    builtinItem('image', 'Image', Image, md.image),
    builtinItem('table', 'Table', Table, md.table),
    builtinItem('mermaid', 'Diagram', Workflow, md.mermaid),
    builtinItem('katex', 'Formula', Sigma, md.katex)
  ]).concat(
    customItems(props.insertMenuItems),
    props.plugins.flatMap(p => customItems(p.insertMenuItems ?? [], pluginPrefix(p)))
  )

  const button = (key: BuiltinTool, title: string, icon: Component, generator: InsertGenerator): MarkdownEditorToolbarEntry =>
    ({ kind: 'button', key, title, icon, action: () => run(generator) })

  const all: MarkdownEditorToolbarEntry[][] = [
    visible([
      button('bold', 'Bold', Bold, md.bold),
      button('italic', 'Italic', Italic, md.italic),
      button('underline', 'Underline', Underline, md.underline),
      button('strikeThrough', 'Strikethrough', Strikethrough, md.strikeThrough)
    ]).concat(entriesInGroup('format')),
    visible<MarkdownEditorToolbarEntry>([{ kind: 'menu', key: 'headings', title: 'Headings', icon: Heading, items: headingItems }]),
    visible([
      button('unorderedList', 'Bulleted list', List, md.unorderedList),
      button('orderedList', 'Numbered list', ListOrdered, md.orderedList),
      button('task', 'Task list', ListTodo, md.task)
    ]).concat(entriesInGroup('lists')),
    visible<MarkdownEditorToolbarEntry>([{ kind: 'menu', key: 'insert', title: 'Insert', icon: Plus, label: 'Insert', items: insertItems }]),
    ungrouped(props.toolbarButtons).map(e => customEntry(e)),
    // Plugins com placement 'toolbar': um grupo cada, na ordem do array.
    ...pluginsIn('toolbar').map(p => ungrouped(p.buttons).map(e => customEntry(e, pluginPrefix(p)))),
    // Plugins com placement 'menu': todos juntos no menu "More tools" (título e ícone definidos aqui).
    [{
      kind: 'menu',
      key: 'plugins',
      title: 'More tools',
      icon: Ellipsis,
      items: pluginsIn('menu').flatMap(p => ungrouped(p.buttons).map(e => customMenuItem(e, pluginPrefix(p))))
    }]
  ]

  // Menus sem nenhum item somem junto; grupos vazios não geram divisória.
  return all
    .map(group => group.filter(e => e.kind === 'button' || e.items.length > 0))
    .filter(group => group.length > 0)
})

defineExpose(ctx)
</script>

<template>
  <div
    class="mde-root"
    :class="{ 'mde-dark': props.theme === 'dark' }"
  >
    <div class="mde-toolbar">
      <div
        v-if="viewMode === 'editor'"
        class="mde-toolbar-group"
      >
        <slot
          name="toolbar-start"
          v-bind="ctx"
        />
        <template
          v-for="(group, gi) in groups"
          :key="gi"
        >
          <div
            v-if="gi > 0"
            class="mde-divider"
          />
          <template
            v-for="entry in group"
            :key="entry.key"
          >
            <button
              v-if="entry.kind === 'button'"
              type="button"
              class="mde-btn"
              :title="entry.title"
              :aria-label="entry.title"
              @click="entry.action"
            >
              <component
                :is="entry.icon"
                v-if="entry.icon"
                class="mde-icon"
              />
              <template v-if="entry.label">
                {{ entry.label }}
              </template>
            </button>
            <MarkdownEditorDropdownMenu
              v-else
              :items="entry.items"
            >
              <template #default="{ toggle, open }">
                <button
                  type="button"
                  class="mde-btn"
                  :title="entry.title"
                  :aria-label="entry.title"
                  aria-haspopup="menu"
                  :aria-expanded="open"
                  @click="toggle"
                >
                  <component
                    :is="entry.icon"
                    v-if="entry.icon"
                    class="mde-icon"
                  />
                  <template v-if="entry.label">
                    {{ entry.label }}
                  </template>
                  <ChevronDown class="mde-icon mde-icon--sm" />
                </button>
              </template>
            </MarkdownEditorDropdownMenu>
          </template>
        </template>
        <slot
          name="toolbar-end"
          v-bind="ctx"
        />
      </div>
      <span
        v-else
        class="mde-label"
      >Preview</span>

      <div class="mde-toolbar-group mde-toolbar-group--end">
        <button
          type="button"
          class="mde-btn"
          :class="{ 'mde-btn--active': viewMode === 'editor' }"
          @click="viewMode = 'editor'"
        >
          Editor
        </button>
        <button
          type="button"
          class="mde-btn"
          :class="{ 'mde-btn--active': viewMode === 'preview' }"
          @click="viewMode = 'preview'"
        >
          Preview
        </button>
        <template v-if="!hidden.has('fullscreen')">
          <div class="mde-divider" />
          <button
            type="button"
            class="mde-btn"
            title="Expand preview"
            aria-label="Expand preview"
            @click="previewFullscreen = true"
          >
            <Maximize2 class="mde-icon" />
          </button>
        </template>
      </div>
    </div>

    <MdEditor
      v-if="viewMode === 'editor'"
      ref="editorRef"
      :model-value="props.modelValue"
      :language="props.language"
      :theme="props.theme"
      :placeholder="props.placeholder"
      preview-theme="default"
      :preview="false"
      :toolbars="[]"
      :footers="[]"
      :show-code-row-number="true"
      :style="{ height: props.height }"
      class="mde-surface"
      :on-upload-img="props.onUploadImg"
      :no-img-zoom-in="true"
      :no-prettier="!props.prettier"
      :no-echarts="!props.echarts"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <MdPreview
      v-else
      :model-value="props.modelValue"
      :language="props.language"
      :theme="props.theme"
      preview-theme="default"
      :no-img-zoom-in="true"
      :no-echarts="!props.echarts"
      :show-code-row-number="true"
      class="mde-preview mde-scroll"
      :style="{ height: props.height }"
      @click="onPreviewClick"
    />

    <MarkdownEditorFullscreenPreview
      v-model:open="previewFullscreen"
      :model-value="props.modelValue"
      :theme="props.theme"
      :language="props.language"
      :echarts="props.echarts"
      @image-click="openImage"
    />
    <MarkdownEditorImageLightbox ref="lightbox" />
  </div>
</template>
