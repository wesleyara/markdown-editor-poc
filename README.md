# Markdown Editor — POC

O editor Markdown do ClickLocal, extraído num componente Vue 3 (projeto Vite `vue-ts`),
independente de Nuxt e do Nuxt UI. É o mesmo editor, com os mesmos recursos:

- **md-editor-v3** (CodeMirror 6) com uma toolbar própria e compacta;
- abas **Editor / Preview** e botão para **expandir o preview em tela cheia**;
- **lightbox** para imagens do preview (zoom com roda do mouse ou duplo clique, arrastar);
- **Mermaid** (diagramas), **KaTeX** (fórmulas) e **highlight.js** (código) funcionando **offline**:
  nada é baixado de CDN;
- upload de imagens coladas ou arrastadas, via callback;
- tema claro/escuro;
- **toolbar extensível**: botões e dropdowns próprios, itens nos menus, slots, opção de esconder
  ferramentas e **plugins** reaproveitáveis, com 7 plugins de exemplo.

## Sumário

1. [Rodando a POC](#rodando-a-poc)
2. [Estrutura](#estrutura)
3. [Usando em outro projeto](#usando-em-outro-projeto)
4. [Uso básico](#uso-básico)
5. [API do `MarkdownEditor`](#api-do-markdowneditor)
6. [Customizando a toolbar](#customizando-a-toolbar)
7. [Plugins](#plugins)
8. [Reorganizando a toolbar](#reorganizando-a-toolbar)
9. [`MarkdownView` (somente leitura)](#markdownview-somente-leitura)
10. [Estilo e temas](#estilo-e-temas)
11. [Dependências e funcionamento offline](#dependências-e-funcionamento-offline)
12. [Notas e limitações](#notas-e-limitações)

---

## Rodando a POC

Requisitos: Node 20+. O projeto segue o template `vue-ts` do `create-vite`.

```bash
npm install
npm run dev          # demo em http://localhost:5173
npm run build        # vue-tsc -b (typecheck) + build da demo em dist/
npm run preview      # serve o dist/
npm test             # vitest em modo watch
npm run test:run     # vitest uma vez
```

A demo (`src/App.vue`) mostra o editor com upload de imagem, tema claro/escuro, botões
customizados, os plugins de exemplo (com um seletor de posição), um slot com contador de caracteres e o
`MarkdownView`.

## Estrutura

```
src/
├── main.ts / App.vue / style.css     app de demonstração
└── components/
    └── MarkdownEditor/
        ├── components/                        arquivos .vue (PascalCase)
        │   ├── MarkdownEditor.vue             editor com toolbar, preview, tela cheia e lightbox
        │   ├── MarkdownView.vue               renderização somente leitura
        │   ├── MarkdownEditorFullscreenPreview.vue  preview em tela cheia (Teleport para o body)
        │   ├── MarkdownEditorImageLightbox.vue      lightbox com zoom e arrastar
        │   └── MarkdownEditorDropdownMenu.vue       menu suspenso da toolbar
        ├── models/                            tipagens (kebab-case)
        │   ├── markdown-editor.models.ts      props/emits/expose do MarkdownEditor
        │   ├── markdown-view.models.ts
        │   ├── markdown-editor-fullscreen-preview.models.ts
        │   ├── markdown-editor-image-lightbox.models.ts
        │   ├── markdown-editor-dropdown-menu.models.ts
        │   ├── markdown-toolbar.models.ts     tipos públicos para estender a toolbar
        │   └── markdown-editor-plugins.models.ts  opções dos plugins de exemplo
        ├── tests/                             testes unitários (PascalCase, vitest)
        ├── utils/
        │   ├── markdown-toolbar.ts            geradores de inserção (negrito, link, tabela…)
        │   ├── toolbar.ts                     defineToolbarPlugin / isToolbarMenu
        │   └── setup.ts                       configuração global do md-editor-v3 (mermaid/katex/hljs locais)
        ├── plugins/                           plugins de toolbar de exemplo (ver seção "Plugins")
        ├── styles/markdown-editor.css         estilos e tokens (variáveis CSS)
        └── index.ts                           exporta componentes, tipos, utilitários e plugins
```

## Usando em outro projeto

Copie `src/components/MarkdownEditor/` para o seu projeto e instale as dependências:

```bash
npm install md-editor-v3 mermaid katex highlight.js @lucide/vue
```

Depois importe de `./components/MarkdownEditor` (o `index.ts` já importa o CSS do componente, do
md-editor-v3 e do KaTeX). Isso exige um bundler que entenda `?inline` em imports de CSS (Vite
entende).

## Uso básico

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MarkdownEditor } from './components/MarkdownEditor'

const text = ref('# Olá')

async function uploadImg(files: File[], callback: (urls: string[]) => void) {
  const urls = await Promise.all(files.map(async (file) => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body })
    return (await res.json()).url as string
  }))
  callback(urls)
}
</script>

<template>
  <MarkdownEditor
    v-model="text"
    height="320px"
    theme="light"
    placeholder="Escreva em markdown…"
    :on-upload-img="uploadImg"
  />
</template>
```

### Registro global (opcional)

```ts
import MarkdownEditorPlugin from './components/MarkdownEditor'
app.use(MarkdownEditorPlugin)   // registra <MarkdownEditor> e <MarkdownView>
```

## API do `MarkdownEditor`

### Props

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | — | Conteúdo markdown. |
| `height` | `string` | `'240px'` | Altura da área de edição/preview (qualquer valor CSS). |
| `theme` | `'light' \| 'dark'` | `'light'` | Tema do editor, preview, tela cheia e realce de código. |
| `language` | `string` | `'en-US'` | Idioma dos textos internos do md-editor-v3 (`'en-US'` ou `'zh-CN'`). |
| `placeholder` | `string` | `''` | Placeholder do editor. |
| `onUploadImg` | `(files, callback) => void` | — | Upload de imagens coladas ou arrastadas. Chame `callback(urls)`. |
| `imageLightbox` | `boolean` | `true` | Abre imagens do preview no lightbox. |
| `toolbarButtons` | `ToolbarEntry[]` | `[]` | Botões ou dropdowns extras (ver [customização](#customizando-a-toolbar)). |
| `plugins` | `ToolbarPlugin[]` | `[]` | Plugins de toolbar (ver [plugins](#plugins)). |
| `pluginsPlacement` | `'menu' \| 'toolbar'` | `'menu'` | `'menu'` junta os botões dos plugins no menu "More tools" (⋯); `'toolbar'` dá um grupo próprio a cada plugin. |
| `insertMenuItems` | `ToolbarMenuItem[]` | `[]` | Itens extras no fim do menu "Insert". |
| `headingMenuItems` | `ToolbarMenuItem[]` | `[]` | Itens extras no fim do menu "Heading". |
| `hideTools` | `BuiltinTool[]` | `[]` | Ferramentas nativas a esconder. |
| `prettier` | `boolean` | `false` | Formatação com Ctrl+Shift+F. Baixa o Prettier do CDN, ver [offline](#dependências-e-funcionamento-offline). |
| `echarts` | `boolean` | `false` | Blocos ` ```echarts `. Também baixa do CDN. |

### Eventos

| Evento | Payload |
| --- | --- |
| `update:modelValue` | `string` |

### Slots

| Slot | Props do slot | Onde aparece |
| --- | --- | --- |
| `toolbar-start` | `ToolbarContext` | Início da toolbar (antes do negrito). |
| `toolbar-end` | `ToolbarContext` | Fim da parte esquerda da toolbar (depois dos botões extras). |

### Métodos expostos (via `ref`)

É o mesmo `ToolbarContext`: `insert(generator)`, `getValue()`, `setValue(value)` e `focus()`.

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { MarkdownEditor, markdownToolbar } from './components/MarkdownEditor'

const editor = useTemplateRef('editor')
const makeBold = () => editor.value?.insert(markdownToolbar.bold)
</script>

<template>
  <MarkdownEditor ref="editor" v-model="text" />
</template>
```

## Customizando a toolbar

A toolbar tem grupos separados por divisórias:

```
[slot toolbar-start] [B I U S] | [H ▾] | [• 1. ☐] | [+ Insert ▾] | [toolbarButtons] | [⋯ ▾ plugins] [slot toolbar-end]      Editor Preview | ⤢
```

Os pontos de extensão abaixo podem ser combinados. Para empacotar e reaproveitar um conjunto
deles, veja [Plugins](#plugins).

### 1. O conceito central: `InsertGenerator`

Toda ação que mexe no texto passa por `insert(generator)`. O *generator* recebe o texto
selecionado (ou `''`) e devolve o que colocar no lugar:

```ts
type InsertGenerator = (selectedText: string) => {
  targetValue: string       // texto que substitui a seleção
  select?: boolean          // deixar algo selecionado depois?
  deviationStart?: number   // início da seleção, contado do INÍCIO do texto inserido
  deviationEnd?: number     // fim da seleção, contado do FIM do texto inserido (0 ou negativo)
}
```

Exemplo: envolver a seleção em `==…==` (marca-texto) e manter só o conteúdo selecionado:

```ts
const highlight: InsertGenerator = (selected) => {
  const text = selected || 'texto'
  return { targetValue: `==${text}==`, select: true, deviationStart: 2, deviationEnd: -2 }
}
```

Os geradores nativos estão exportados em `markdownToolbar` (`bold`, `italic`, `heading(n)`,
`link`, `table`, `mermaid`, `katex`…) e podem ser reaproveitados.

> Atenção: `deviationEnd` conta do **fim** do texto inserido. `deviationEnd: 0` seleciona até o
> fim; `-2` recua 2 caracteres. Emojis ocupam 2 posições (UTF-16), então prefira calcular com
> `prefixo.length` a escrever números fixos.

### 2. Botões extras: `toolbarButtons`

```ts
import { CalendarDays, Eraser } from '@lucide/vue'
import type { ToolbarButton } from './components/MarkdownEditor'

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'today',
    title: 'Inserir data de hoje',        // tooltip e aria-label
    icon: CalendarDays,                    // qualquer componente Vue
    onClick: ({ insert }) => insert(() => ({ targetValue: new Date().toLocaleDateString('pt-BR') }))
  },
  {
    key: 'clear',
    title: 'Limpar tudo',
    label: 'Limpar',                       // texto opcional ao lado (ou no lugar) do ícone
    icon: Eraser,
    onClick: ({ setValue, focus }) => { setValue(''); focus() }
  }
]
```

```vue
<MarkdownEditor v-model="text" :toolbar-buttons="toolbarButtons" />
```

Com `group: 'format'` ou `group: 'lists'`, o botão entra no fim desse grupo nativo em vez de
ganhar um grupo próprio (ver [Reorganizando a toolbar](#reorganizando-a-toolbar)).

O `onClick` recebe o `ToolbarContext`:

| Campo | Descrição |
| --- | --- |
| `insert(generator)` | Insere ou envolve a seleção (ver acima). |
| `getValue()` | Conteúdo atual. |
| `setValue(value)` | Troca todo o conteúdo (emite `update:modelValue`). |
| `focus()` | Devolve o foco ao editor. |

Ações assíncronas funcionam. Por exemplo, abrir um seletor seu e inserir o resultado:

```ts
{
  key: 'mention',
  title: 'Mencionar usuário',
  icon: AtSign,
  onClick: async ({ insert }) => {
    const user = await openUserPicker()          // seu modal
    if (user) insert(() => ({ targetValue: `@${user.login} ` }))
  }
}
```

#### Dropdown próprio

Uma entrada com `items`, em vez de `onClick`, vira um botão com ▾ que abre um menu (`ToolbarMenu`):

```ts
import { Smile } from '@lucide/vue'
import type { ToolbarEntry } from './components/MarkdownEditor'

const toolbarButtons: ToolbarEntry[] = [
  {
    key: 'status',
    title: 'Status',
    icon: Smile,
    items: [
      { key: 'done', label: '✅ Feito', onSelect: ({ insert }) => insert(() => ({ targetValue: '✅ ' })) },
      { key: 'wip', label: '🚧 Em andamento', onSelect: ({ insert }) => insert(() => ({ targetValue: '🚧 ' })) }
    ]
  }
]
```

### 3. Itens nos menus: `insertMenuItems` / `headingMenuItems`

Os itens entram no fim do menu correspondente:

```ts
import { Info } from '@lucide/vue'
import type { ToolbarMenuItem } from './components/MarkdownEditor'

const prefix = '> ℹ️ **Info:** '
const insertMenuItems: ToolbarMenuItem[] = [
  {
    key: 'callout-info',
    label: 'Callout: info',
    icon: Info,
    onSelect: ({ insert }) => insert((selected) => {
      const text = selected || 'mensagem'
      return {
        targetValue: prefix + text,
        select: true,
        deviationStart: prefix.length,
        deviationEnd: 0
      }
    })
  }
]
```

```vue
<MarkdownEditor v-model="text" :insert-menu-items="insertMenuItems" />
```

### 4. Esconder ferramentas nativas: `hideTools`

```vue
<!-- sem sublinhado, sem sub/sobrescrito e sem o botão de tela cheia -->
<MarkdownEditor v-model="text" :hide-tools="['underline', 'sub', 'sup', 'fullscreen']" />
```

Chaves disponíveis (`BuiltinTool`):

| Grupo | Chaves |
| --- | --- |
| Botões | `bold`, `italic`, `underline`, `strikeThrough`, `unorderedList`, `orderedList`, `task`, `fullscreen` |
| Menus inteiros | `headings`, `insert` |
| Itens do menu Heading | `h1` … `h6`, `sub`, `sup` |
| Itens do menu Insert | `quote`, `codeInline`, `codeBlock`, `link`, `image`, `table`, `mermaid`, `katex` |

Um menu sem nenhum item visível some. Um grupo vazio não gera divisória.

Para uma toolbar só com os seus botões:

```vue
<MarkdownEditor
  v-model="text"
  :hide-tools="['bold','italic','underline','strikeThrough','headings','unorderedList','orderedList','task','insert']"
  :toolbar-buttons="meusBotoes"
/>
```

### 5. Slots: markup livre

Para algo que não é um botão (um select, um contador, um badge), use os slots. Eles recebem o
mesmo `ToolbarContext`:

```vue
<MarkdownEditor v-model="text">
  <template #toolbar-end="{ getValue }">
    <span class="contador">{{ getValue().length }} chars</span>
  </template>

  <template #toolbar-start="{ insert }">
    <select @change="insert(() => ({ targetValue: ($event.target as HTMLSelectElement).value }))">
      <option value="">Snippet…</option>
      <option value=":white_check_mark: ">✅ Feito</option>
      <option value=":warning: ">⚠️ Atenção</option>
    </select>
  </template>
</MarkdownEditor>
```

Use a classe `mde-btn` (e `mde-icon` no ícone) para que um botão no slot fique igual aos nativos.

## Plugins

Um **plugin** reúne botões, dropdowns, itens de menu e ferramentas escondidas num objeto
reaproveitável. Você o escreve uma vez e liga em qualquer editor:

```vue
<script setup lang="ts">
import {
  MarkdownEditor, calloutsPlugin, dateTimePlugin, emojiPlugin, templatesPlugin
} from './components/MarkdownEditor'

const plugins = [calloutsPlugin(), dateTimePlugin(), emojiPlugin(), templatesPlugin()]
</script>

<template>
  <MarkdownEditor v-model="text" :plugins="plugins" />
</template>
```

Por padrão, os botões de todos os plugins ficam num único menu **"More tools" (⋯)**, na ordem do
array, para a toolbar não crescer a cada plugin. Um botão vira um item do menu e um dropdown vira
um **submenu** (›), usando o `title` como rótulo; os submenus abrem com o mouse, com clique ou com
→ / ← no teclado. Com `plugins-placement="toolbar"`, cada plugin ganha **um grupo próprio** na
toolbar, com divisória. Em ambos os modos, os `insertMenuItems` e `headingMenuItems` do plugin
entram no fim dos menus nativos, e os `hideTools` se
somam aos da prop. As `key`s de um plugin ficam isoladas das nativas e das de outros plugins.

> Crie os plugins **fora** do template (no `setup` ou num módulo), para não recriar os objetos
> a cada render.

### Anatomia

```ts
interface ToolbarPlugin {
  name: string                          // único; isola as keys internas
  buttons?: ToolbarEntry[]              // botões (onClick) e/ou dropdowns (items)
  insertMenuItems?: ToolbarMenuItem[]   // itens no fim do menu "Insert"
  headingMenuItems?: ToolbarMenuItem[]  // itens no fim do menu "Heading"
  hideTools?: BuiltinTool[]             // ferramentas nativas que o plugin substitui
  placement?: 'menu' | 'toolbar'        // sobrepõe a prop pluginsPlacement (ver "Reorganizando a toolbar")
}
```

### Plugins de exemplo (`src/components/MarkdownEditor/plugins/`)

Todos são exportados pelo `index.ts` e servem de ponto de partida. Cada um mostra uma técnica
diferente:

| Plugin | O que faz | Técnica demonstrada |
| --- | --- | --- |
| `calloutsPlugin({ types? })` | Dropdown "Callouts": nota, dica, atenção, perigo (`!!! warning … !!!`) | Dropdown próprio; envolve a seleção num bloco |
| `dateTimePlugin({ locale? })` | Dropdown com data, hora, data e hora, ISO 8601 | Valor calculado no clique |
| `emojiPlugin({ emojis? })` | Dropdown de emojis de status e de prioridade (🔴 🟡 🟢) | Lista configurável por opção |
| `templatesPlugin({ templates?, confirm? })` | Modelos (bug report, ata), inseridos no cursor ou substituindo tudo | `getValue` / `setValue` / `focus` |
| `textTransformPlugin()` | MAIÚSCULAS / minúsculas / Iniciais Maiúsculas na seleção | Opera sobre o texto selecionado |
| `extraBlocksPlugin()` | Recolhível (`<details>`), marca-texto, `<kbd>`, linha divisória | Só itens no menu "Insert", sem botão |
| `copyMarkdownPlugin({ onCopied?, onError? })` | Copia o markdown para a área de transferência | Botão que não altera o texto; callbacks |

Exemplos de configuração:

```ts
emojiPlugin({ emojis: [{ emoji: '🔥', label: 'Urgente' }, { emoji: '🧊', label: 'Congelado' }] })

templatesPlugin({
  templates: [
    { key: 'adr', label: 'ADR', content: '# ADR: \n\n## Contexto\n\n## Decisão\n', mode: 'replace' }
  ]
})

copyMarkdownPlugin({ onCopied: () => toast('Copiado!') })
```

O `index.ts` também exporta dois helpers usados pelos plugins:

- `wrapSelection(antes, depois, placeholder)`: envolve a seleção e mantém o miolo selecionado;
- `insertText(valor)`: insere um texto fixo.

### Escrevendo o seu plugin

1. Crie um arquivo (no seu projeto ou em `src/components/MarkdownEditor/plugins/`) com uma função que
   recebe opções e devolve `defineToolbarPlugin({...})`. O `defineToolbarPlugin` só existe para
   dar tipagem e autocomplete.
2. Nas ações, use o `ToolbarContext` (`insert`, `getValue`, `setValue`, `focus`).
3. Se o plugin ficar dentro do componente, exporte-o em `plugins/index.ts` e coloque as
   tipagens das opções em `models/markdown-editor-plugins.models.ts`.

Exemplo completo (é o `src/docs/tasks-plugin.ts` usado na demo): um plugin de "tarefas" que
substitui o botão nativo de task list por um próprio, **no mesmo lugar** (fim do grupo de listas,
via `group: 'lists'`), e adiciona um item no menu Insert:

```ts
import { ListChecks } from '@lucide/vue'
import { defineToolbarPlugin, insertText, wrapSelection } from './components/MarkdownEditor'

/** Plugin de exemplo do guia "Criando e adicionando itens na toolbar". */
export function tasksPlugin(options: { owner?: string } = {}) {
  const suffix = options.owner ? ` @${options.owner}` : ''

  return defineToolbarPlugin({
    name: 'tasks',
    // Substitui o botão nativo de task list pelo do plugin...
    hideTools: ['task'],
    buttons: [
      {
        key: 'task',
        title: 'Nova tarefa',
        icon: ListChecks,
        // ...e o coloca no mesmo lugar: fim do grupo de listas (• 1. ☐).
        group: 'lists',
        onClick: ({ insert }) => insert(wrapSelection('- [ ] ', suffix, 'tarefa'))
      }
    ],
    insertMenuItems: [
      {
        key: 'checklist',
        label: 'Checklist (3 itens)',
        icon: ListChecks,
        onSelect: ({ insert }) => insert(insertText('\n- [ ] \n- [ ] \n- [ ] \n'))
      }
    ]
  })
}
```

```vue
<MarkdownEditor v-model="text" :plugins="[tasksPlugin({ owner: 'ana' })]" />
```

Na demo (`npm run dev`) há checkboxes para ligar e desligar cada plugin de exemplo.

## Reorganizando a toolbar

A toolbar foi organizada para caber numa linha: os plugins ficam no menu **"More tools" (⋯)** e
os dropdowns deles viram submenus (›). Todos os pontos de ajuste estão abaixo, do mais simples
(props) ao mais profundo (código do componente).

### Onde cada coisa aparece

| Origem | Padrão | Como mudar |
| --- | --- | --- |
| Ferramentas nativas | inline, em grupos fixos | `hide-tools` para esconder; `groups` em `MarkdownEditor.vue` para reorganizar |
| `toolbar-buttons` | inline, num grupo depois do "Insert" | `group` para entrar num grupo nativo; `items` para virar dropdown; ou transforme num plugin |
| `insert-menu-items` / `heading-menu-items` | fim do menu nativo | — |
| `buttons` dos plugins | menu "More tools" (⋯) | `plugins-placement` (todos), `placement` (por plugin) ou `group` (por botão) |
| `insertMenuItems` / `headingMenuItems` dos plugins | fim do menu nativo | — (não dependem do placement) |

### Todos os plugins de uma vez: `plugins-placement`

```html
<!-- padrão: todos no menu ⋯ -->
<MarkdownEditor v-model="text" :plugins="plugins" />

<!-- cada plugin num grupo próprio, direto na toolbar -->
<MarkdownEditor v-model="text" :plugins="plugins" plugins-placement="toolbar" />
```

### Um plugin específico: `placement`

O `placement` do plugin tem prioridade sobre a prop. Dá para defini-lo ao criar o plugin:

```ts
export function tasksPlugin() {
  return defineToolbarPlugin({
    name: 'tasks',
    placement: 'toolbar', // sempre inline, mesmo com o resto no menu ⋯
    buttons: [/* ... */]
  })
}
```

Ou sobrescrevê-lo na hora de usar, sem mexer no plugin:

```ts
const plugins = [
  { ...copyMarkdownPlugin(), placement: 'toolbar' }, // botão de copiar sempre à vista
  calloutsPlugin(),                                   // restante no menu ⋯
  emojiPlugin()
] satisfies ToolbarPlugin[]
```

### Um botão dentro de um grupo nativo: `group`

Por padrão, `toolbar-buttons` ficam num grupo próprio e os `buttons` de plugin seguem o
`placement`. Com `group`, a entrada vai para o **fim de um grupo nativo**, seja qual for a origem:

| `group` | Grupo |
| --- | --- |
| `'format'` | B I U S |
| `'lists'` | • 1. ☐ |

```ts
defineToolbarPlugin({
  name: 'tasks',
  hideTools: ['task'],   // esconde o ☐ nativo...
  buttons: [
    // ...e põe o botão do plugin no lugar dele, no fim do grupo de listas
    { key: 'task', title: 'Nova tarefa', icon: ListChecks, group: 'lists', onClick: /* ... */ }
  ]
})
```

Entradas com `group` nunca vão para o menu ⋯. Para aceitar outros grupos, adicione o nome ao
tipo `ToolbarGroup` (`models/markdown-toolbar.models.ts`) e um `.concat(entriesInGroup('nome'))`
no grupo correspondente, em `groups` (`MarkdownEditor.vue`).

### Ordem

- Plugins seguem a ordem do array `plugins`, tanto na toolbar quanto no menu ⋯.
- Os grupos de plugins com `placement: 'toolbar'` vêm antes do menu ⋯.
- Dentro do menu, um botão do plugin vira um item e um dropdown vira um submenu, usando o `title`
  como rótulo. Para mudar o texto que aparece no menu, mude o `title` da entrada.

### Título e ícone do menu ⋯, e os grupos nativos

Ficam no `computed` **`groups`** de `src/components/MarkdownEditor/components/MarkdownEditor.vue`.
Cada array interno de `all` é um grupo da toolbar (separado por divisória), na ordem em que
aparece:

```ts
const all: MarkdownEditorToolbarEntry[][] = [
  visible([button('bold', ...), ...]).concat(entriesInGroup('format')),    // B I U S + group 'format'
  visible([{ kind: 'menu', key: 'headings', ... }]),              // H ▾
  visible([button('unorderedList', ...), ...]).concat(entriesInGroup('lists')), // • 1. ☐ + group 'lists'
  visible([{ kind: 'menu', key: 'insert', ... }]),                // + Insert ▾
  ungrouped(props.toolbarButtons).map(e => customEntry(e)),       // toolbar-buttons
  ...pluginsIn('toolbar').map(...),                               // plugins inline
  [{ kind: 'menu', key: 'plugins', title: 'More tools', icon: Ellipsis, items: ... }] // menu ⋯
]
```

- **Título/ícone do menu ⋯:** troque `title` e `icon` da entrada `key: 'plugins'`.
- **Reordenar grupos nativos:** mude a posição dos arrays.
- **Transformar botões nativos num dropdown** (ex.: as listas):

  ```ts
  visible<MarkdownEditorToolbarEntry>([{
    kind: 'menu', key: 'lists', title: 'Lists', icon: List,
    items: visible([
      builtinItem('unorderedList', 'Bulleted list', List, md.unorderedList),
      builtinItem('orderedList', 'Numbered list', ListOrdered, md.orderedList),
      builtinItem('task', 'Task list', ListTodo, md.task)
    ])
  }]),
  ```

  Se criar uma chave nova (como `'lists'`), adicione-a ao tipo `BuiltinTool` em
  `models/markdown-toolbar.models.ts` para ela funcionar no `hide-tools`.

Menus sem itens visíveis e grupos vazios somem sozinhos, então esconder tudo de um grupo não deixa
divisória sobrando.

### Visual dos menus

Em `styles/markdown-editor.css`:

- `.mde-menu`: menu e submenu (largura mínima, sombra, borda);
- `.mde-submenu`: posição do submenu (à direita do item) e `max-height` com rolagem;
- `.mde-menu-item-chevron`: a seta › dos itens com submenu;
- tokens `--mde-*` em `.mde-root` para cores, raio e `z-index`.

## `MarkdownView` (somente leitura)

Renderiza markdown com o mesmo pipeline do editor (mermaid, KaTeX, realce de código) e com
lightbox nas imagens. É o que o ClickLocal usa para os comentários.

```vue
<MarkdownView :model-value="comment.body" theme="light" />
```

| Prop | Tipo | Padrão |
| --- | --- | --- |
| `modelValue` | `string` | — |
| `theme` | `'light' \| 'dark'` | `'light'` |
| `language` | `string` | `'en-US'` |
| `imageLightbox` | `boolean` | `true` |
| `echarts` | `boolean` | `false` |

O `MarkdownEditorImageLightbox` também é exportado para uso isolado: `lightboxRef.open(src)` / `close()`.

## Estilo e temas

Os estilos usam variáveis CSS definidas em `.mde-root` (e em `.mde-root.mde-dark` no tema escuro).
Sobrescreva as variáveis para casar com o seu design system:

```css
.mde-root {
  --mde-accent: #7c3aed;        /* anel de foco */
  --mde-radius: 4px;
  --mde-border: #d4d4d8;
  --mde-bg-elevated: #f4f4f5;   /* fundo da toolbar e hover dos menus */
  --mde-bg-hover: #e4e4e7;
  --mde-active-bg: #7c3aed;     /* aba Editor/Preview ativa */
  --mde-active-text: #fff;
  --mde-font: 'Inter', sans-serif;
  --mde-z: 1000;                /* z-index da tela cheia (lightbox = +10, menus = +1) */
}
.mde-root.mde-dark { --mde-bg: #0b0b0f; }
```

O tema do conteúdo (preview e editor) vem do md-editor-v3 e segue a prop `theme`. O realce de
código usa o tema *atom* (one-light ou one-dark), o mesmo que o md-editor usaria vindo do CDN.

**Tailwind:** o preflight do Tailwind zera `list-style` e `font-weight`. O `styles/markdown-editor.css` já restaura
listas e negrito dentro do preview, então não é preciso fazer nada.

## Dependências e funcionamento offline

Por padrão, o md-editor-v3 baixa várias bibliotecas do unpkg em tempo de execução. O componente
resolve isso no `utils/setup.ts`:

| Biblioteca | Situação |
| --- | --- |
| mermaid | instância local (dependência do projeto) |
| KaTeX (JS + CSS) | instância local |
| highlight.js (JS + tema CSS) | instância local |
| cropperjs | não é usado (só serve à toolbar nativa, que fica escondida); um stub evita o download |
| Prettier | desligado (`prettier: false`) |
| echarts | desligado (`echarts: false`) |

Com isso, **nenhuma requisição externa** é feita. Isso foi verificado na demo com a aba Network.

Para ligar Prettier ou echarts sem CDN, instale a biblioteca e entregue a instância ao md-editor
antes de montar o editor:

```ts
import { config } from 'md-editor-v3'
import * as prettier from 'prettier/standalone'
import parserMarkdown from 'prettier/plugins/markdown'
import * as echarts from 'echarts'

config({
  editorExtensions: {
    prettier: { prettierInstance: prettier, parserMarkdownInstance: parserMarkdown },
    echarts: { instance: echarts }
  }
})
```

Depois use `<MarkdownEditor prettier echarts />`. Sem essa configuração, as props ligadas fazem o
md-editor buscar as bibliotecas no CDN.

> O `config()` do md-editor-v3 é global. Se o seu app também o usa, chame
> `setupMarkdownEditor()` (exportado) antes e faça a sua configuração depois.

## Notas e limitações

- **SSR / Nuxt:** o md-editor-v3 depende do DOM. Em Nuxt, envolva o componente com `<ClientOnly>`.
  No ClickLocal o componente também é carregado de forma lazy (`LazyCardModal`), para manter
  mermaid e KaTeX fora do bundle inicial. Faça o mesmo com `defineAsyncComponent` se o tamanho
  do bundle importar.
- **Dentro de modais com focus trap** (Reka UI, Headless UI…): a tela cheia e o lightbox usam
  `Teleport` para o `body`, fora do modal. Alguns focus traps impedem interação com elementos
  fora deles. Se isso acontecer, desative o trap do modal enquanto a tela cheia estiver aberta,
  ou marque o modal como não modal.
- **Esc em camadas:** com o lightbox aberto sobre a tela cheia, o primeiro Esc fecha só o
  lightbox e o segundo fecha a tela cheia. Ao fechar, o foco volta ao botão que abriu.
- **Imagens `data:image/svg+xml`** são bloqueadas pelo markdown-it por segurança. Use URLs ou
  PNG/JPEG/GIF/WebP em data URL.
- **TypeScript:** os tipos do md-editor-v3 não passam com `skipLibCheck: false`. Use
  `skipLibCheck: true`, que é o padrão dos templates do Vite.
- **Callouts:** o md-editor-v3 renderiza `!!! tipo Título … !!!`, mas não traz estilo para eles.
  O `styles/markdown-editor.css` inclui estilos para `note`, `tip`, `warning`/`caution` e
  `danger`/`error`. Qualquer outro tipo usa o visual de `note`.
- **Idioma da UI:** os rótulos da toolbar estão em inglês, como no ClickLocal. Para traduzir,
  edite os `label`/`title` em `components/MarkdownEditor.vue`.

### Diferenças em relação ao ClickLocal

- `UButton`, `UDropdownMenu`, `UModal` e os ícones `i-lucide-*` do Nuxt UI foram trocados por
  componentes próprios e pelo `@lucide/vue`. Não há dependência de Nuxt, Nuxt UI nem Tailwind.
- O lightbox vem embutido no editor (no ClickLocal ele fica no `CardModal`).
- KaTeX e highlight.js vêm dos pacotes npm, não do CDN. Prettier e echarts ficam desligados.
- **Correção:** os geradores em `utils/markdown-toolbar.ts` usavam `deviationEnd` como se contasse do
  início do texto inserido. Por isso, depois de inserir negrito, link etc., a seleção passava do
  ponto. Aqui o valor foi corrigido para contar do fim, como o md-editor espera.
