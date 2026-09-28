A toolbar é montada em grupos separados por divisórias:

```
[slot toolbar-start] [B I U S] | [H ▾] | [• 1. ☐] | [+ Insert ▾] | [toolbarButtons] | [⋯ ▾ plugins] [slot toolbar-end]
```

Existem cinco pontos de extensão, e eles podem ser combinados. Para mudar **onde** cada coisa
aparece (menu ⋯ ou toolbar, ordem, agrupamentos), veja a seção 9.

| Quero… | Use | Onde entra |
| --- | --- | --- |
| um botão ou dropdown só neste editor | prop `toolbar-buttons` | grupo próprio depois do "Insert" |
| um item nos menus nativos | props `insert-menu-items` / `heading-menu-items` | fim do menu |
| esconder ferramentas nativas | prop `hide-tools` | — |
| markup livre (select, contador…) | slots `toolbar-start` / `toolbar-end` | início / fim da toolbar |
| reaproveitar tudo isso em vários editores | **plugin** + prop `plugins` | menu "More tools" (⋯) |

## 1. Entenda o `InsertGenerator`

Toda ação que altera o texto passa por `insert(generator)`. O generator recebe o texto selecionado
(ou `''`) e devolve o que colocar no lugar e o que deixar selecionado:

```ts
import type { InsertGenerator } from './components/MarkdownEditor'

// ==texto== (marca-texto), deixando só "texto" selecionado
const highlight: InsertGenerator = (selected) => {
  const text = selected || 'texto'
  return {
    targetValue: `==${text}==`,
    select: true,
    deviationStart: 2,  // conta do INÍCIO do texto inserido
    deviationEnd: -2    // conta do FIM do texto inserido (0 = até o fim)
  }
}
```

Os geradores nativos (`bold`, `link`, `table`, `heading(n)`…) estão em `markdownToolbar`. Para os
casos comuns, use os helpers `wrapSelection(antes, depois, placeholder)` e `insertText(valor)`.

## 2. Botão simples: `toolbar-buttons`

```ts
import { CalendarDays } from '@lucide/vue'
import type { ToolbarButton } from './components/MarkdownEditor'

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'today',
    title: 'Inserir data de hoje', // tooltip e aria-label
    icon: CalendarDays,            // qualquer componente Vue (opcional)
    label: 'Hoje',                 // texto ao lado do ícone (opcional)
    onClick: ({ insert }) => insert(() => ({ targetValue: new Date().toLocaleDateString('pt-BR') }))
  }
]
```

```html
<MarkdownEditor v-model="text" :toolbar-buttons="toolbarButtons" />
```

Com `group: 'format'` ou `group: 'lists'`, o botão entra no fim desse grupo nativo em vez de
ganhar um grupo próprio (ver seção 9).

O `onClick` recebe o `ToolbarContext`: `insert(generator)`, `getValue()`, `setValue(valor)` e
`focus()`. Ele pode ser `async`, por exemplo para abrir um modal seu e inserir o resultado.

## 3. Dropdown: troque `onClick` por `items`

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

## 4. Itens nos menus nativos

```ts
import { Info } from '@lucide/vue'
import { wrapSelection } from './components/MarkdownEditor'
import type { ToolbarMenuItem } from './components/MarkdownEditor'

const insertMenuItems: ToolbarMenuItem[] = [
  {
    key: 'callout-info',
    label: 'Callout: info',
    icon: Info,
    onSelect: ({ insert }) => insert(wrapSelection('> ℹ️ **Info:** ', '', 'mensagem'))
  }
]
```

```html
<MarkdownEditor v-model="text" :insert-menu-items="insertMenuItems" />
```

## 5. Esconder ferramentas nativas

```html
<MarkdownEditor v-model="text" :hide-tools="['underline', 'sub', 'sup', 'fullscreen']" />
```

Chaves: `bold`, `italic`, `underline`, `strikeThrough`, `unorderedList`, `orderedList`, `task`,
`fullscreen`, os menus `headings` e `insert`, e os itens `h1`…`h6`, `sub`, `sup`, `quote`,
`codeInline`, `codeBlock`, `link`, `image`, `table`, `mermaid`, `katex`. Um menu sem itens visíveis
some, e um grupo vazio não gera divisória.

## 6. Slots para markup livre

```html
<MarkdownEditor v-model="text">
  <template #toolbar-end="{ getValue }">
    <span>{{ getValue().length }} chars</span>
  </template>
</MarkdownEditor>
```

Use as classes `mde-btn` e `mde-icon` para que um botão no slot fique igual aos nativos.

## 7. Criando um plugin (toolbar reaproveitável)

Um plugin junta botões, dropdowns, itens de menu e ferramentas escondidas num objeto só. Crie uma
função que recebe opções e devolve `defineToolbarPlugin({...})`. O exemplo abaixo é o arquivo
`src/docs/tasks-plugin.ts`, que está **ligado no editor desta demo** (ativo em "Tarefas"). O botão
"Nova tarefa" substitui o ☐ nativo e fica no mesmo lugar, no fim do grupo de listas:

```ts
{{TASKS_PLUGIN}}
```

```ts
interface ToolbarPlugin {
  name: string                          // único; isola as keys internas
  buttons?: ToolbarEntry[]              // botões (onClick) e/ou dropdowns (items)
  insertMenuItems?: ToolbarMenuItem[]   // fim do menu "Insert"
  headingMenuItems?: ToolbarMenuItem[]  // fim do menu "Heading"
  hideTools?: BuiltinTool[]             // somam-se aos da prop hide-tools
  placement?: 'menu' | 'toolbar'        // onde ficam os buttons; ver seção 9
}
```

## 8. Adicionando o plugin ao editor

```html
<script setup lang="ts">
import { MarkdownEditor, calloutsPlugin, emojiPlugin } from './components/MarkdownEditor'
import { tasksPlugin } from './docs/tasks-plugin'

// Crie os plugins fora do template, para não recriar os objetos a cada render.
const plugins = [tasksPlugin({ owner: 'ana' }), calloutsPlugin(), emojiPlugin()]
</script>

<template>
  <MarkdownEditor v-model="text" :plugins="plugins" />
</template>
```

Por padrão, os botões de todos os plugins ficam num único menu **"More tools" (⋯)**, na ordem do
array, para a toolbar não crescer a cada plugin. Um botão do plugin vira um item desse menu e um
dropdown vira um **submenu** (›), com o `title` como rótulo. Para dar a cada plugin um grupo
próprio direto na toolbar, use `plugins-placement="toolbar"`:

```html
<MarkdownEditor v-model="text" :plugins="plugins" plugins-placement="toolbar" />
```

Os `insertMenuItems` e `headingMenuItems` dos plugins continuam entrando nos menus nativos. Para distribuir o plugin junto com o
componente, mova o arquivo para `src/components/MarkdownEditor/plugins/`, exporte-o em
`plugins/index.ts` e coloque a tipagem das opções em `models/markdown-editor-plugins.models.ts`.

## 9. Reorganizando a toolbar

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
