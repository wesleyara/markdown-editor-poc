<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { CalendarDays, Eraser } from '@lucide/vue'
import {
  MarkdownEditor, MarkdownView,
  calloutsPlugin, copyMarkdownPlugin, dateTimePlugin, emojiPlugin, exportPdfPlugin, extraBlocksPlugin,
  tableEditorPlugin, templatesPlugin, textTransformPlugin
} from './components/MarkdownEditor'
import type { ToolbarButton, ToolbarPlugin } from './components/MarkdownEditor'
import { tasksPlugin } from './docs/tasks-plugin'
import tasksPluginSource from './docs/tasks-plugin.ts?raw'
import toolbarGuideSource from './docs/toolbar-guide.md?raw'

// Guia de customização da toolbar, renderizado com o próprio MarkdownView. O código do plugin de
// exemplo vem do arquivo real, então o que aparece no guia é o que roda no editor acima.
const toolbarGuide = toolbarGuideSource.replace('{{TASKS_PLUGIN}}', tasksPluginSource.trim())

const dark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
const theme = computed(() => (dark.value ? 'dark' : 'light'))
watchEffect(() => document.documentElement.classList.toggle('dark', dark.value))

// Arquivo em public/. Obs.: o markdown-it bloqueia URLs `data:image/svg+xml` por segurança.
const sampleImage = '/sample.svg'

const content = ref(`# Markdown Editor POC

Texto com **negrito**, *itálico*, <u>sublinhado</u> e ~~riscado~~.

- item de lista
- [ ] tarefa pendente
- [x] tarefa concluída

\`\`\`ts
function hello(name: string) {
  return \`Hello, \${name}!\`
}
\`\`\`

| Coluna | Valor |
| --- | --- |
| A | 1 |
| B | 2 |

\`\`\`mermaid
flowchart LR
  A[Editor] --> B[Preview]
  B --> C[Tela cheia]
\`\`\`

$$
E = mc^2
$$

![exemplo](${sampleImage})
`)

// ---- Exemplos de customização da toolbar (ver README → "Customizando a toolbar") ----

// Botões extras: ganham um grupo próprio no fim da toolbar.
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'today',
    title: 'Inserir data de hoje',
    icon: CalendarDays,
    onClick: ({ insert }) => insert(() => ({ targetValue: new Date().toLocaleDateString('pt-BR') }))
  },
  {
    key: 'clear',
    title: 'Limpar tudo',
    icon: Eraser,
    onClick: ({ setValue, focus }) => {
      setValue('')
      focus()
    }
  }
]

// ---- Plugins de exemplo (src/components/MarkdownEditor/plugins) — ligue/desligue na demo ----
const copied = ref(false)
const availablePlugins: Array<{ id: string, label: string, plugin: ToolbarPlugin }> = [
  { id: 'tasks', label: 'Tarefas (exemplo do guia)', plugin: tasksPlugin({ owner: 'ana' }) },
  { id: 'callouts', label: 'Callouts (dropdown próprio)', plugin: calloutsPlugin() },
  { id: 'date', label: 'Data e hora', plugin: dateTimePlugin() },
  { id: 'emoji', label: 'Emoji', plugin: emojiPlugin() },
  { id: 'templates', label: 'Modelos', plugin: templatesPlugin() },
  { id: 'case', label: 'Maiúsculas/minúsculas', plugin: textTransformPlugin() },
  { id: 'table', label: 'Editor de tabela (menu Insert)', plugin: tableEditorPlugin() },
  { id: 'pdf', label: 'Exportar PDF', plugin: exportPdfPlugin() },
  { id: 'blocks', label: 'Blocos extras (menu Insert)', plugin: extraBlocksPlugin() },
  {
    id: 'copy',
    label: 'Copiar markdown',
    plugin: copyMarkdownPlugin({
      onCopied: () => {
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
      }
    })
  }
]
const pluginsPlacement = ref<'menu' | 'toolbar'>('menu')
const enabledPlugins = ref(availablePlugins.map(p => p.id))
const plugins = computed(() => availablePlugins.filter(p => enabledPlugins.value.includes(p.id)).map(p => p.plugin))

// Upload de exemplo: converte para data URL. No seu projeto, envie para o backend e devolva as URLs.
function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  }))).then(callback)
}
</script>

<template>
  <main class="demo">
    <header>
      <div>
        <h1>Markdown Editor — POC</h1>
        <p>Editor do ClickLocal empacotado para Vue 3 + Vite.</p>
      </div>
      <button
        type="button"
        class="demo-toggle"
        @click="dark = !dark"
      >
        {{ dark ? 'Tema claro' : 'Tema escuro' }}
      </button>
    </header>

    <section>
      <h2>Plugins de toolbar</h2>
      <div class="demo-plugins">
        <label
          v-for="p in availablePlugins"
          :key="p.id"
        >
          <input
            v-model="enabledPlugins"
            type="checkbox"
            :value="p.id"
          >
          {{ p.label }}
        </label>
      </div>
      <div class="demo-plugins demo-placement">
        <span>Posição dos plugins:</span>
        <label>
          <input
            v-model="pluginsPlacement"
            type="radio"
            value="menu"
          >
          menu "More tools" (⋯)
        </label>
        <label>
          <input
            v-model="pluginsPlacement"
            type="radio"
            value="toolbar"
          >
          um grupo por plugin na toolbar
        </label>
      </div>
    </section>

    <section>
      <h2>MarkdownEditor</h2>
      <MarkdownEditor
        v-model="content"
        height="360px"
        :theme="theme"
        placeholder="Escreva em markdown…"
        :on-upload-img="handleUploadImg"
        :toolbar-buttons="toolbarButtons"
        :plugins="plugins"
        :plugins-placement="pluginsPlacement"
        :hide-tools="['sub', 'sup']"
      >
        <!-- Slot livre: qualquer markup recebe o mesmo contexto (insert, getValue, setValue, focus). -->
        <template #toolbar-end="{ getValue }">
          <span class="demo-counter">{{ copied ? 'copiado!' : `${getValue().length} chars` }}</span>
        </template>
      </MarkdownEditor>
    </section>

    <section>
      <h2>MarkdownView (somente leitura)</h2>
      <div class="demo-card">
        <MarkdownView
          :model-value="content"
          :theme="theme"
        />
      </div>
    </section>

    <section>
      <h2>Guia: criando e adicionando itens na toolbar</h2>
      <div class="demo-card">
        <MarkdownView
          :model-value="toolbarGuide"
          :theme="theme"
        />
      </div>
    </section>

    <section>
      <h2>v-model</h2>
      <pre class="demo-card demo-raw">{{ content }}</pre>
    </section>
  </main>
</template>
