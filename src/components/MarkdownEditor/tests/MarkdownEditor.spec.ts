import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import * as md from '../utils/markdown-toolbar'
import { defineToolbarPlugin } from '../utils/toolbar'
import type { MarkdownEditorProps } from '../models/markdown-editor.models'

const editorApi = vi.hoisted(() => ({ insert: vi.fn(), focus: vi.fn() }))

vi.mock('../utils/setup', () => ({ setupMarkdownEditor: vi.fn() }))
vi.mock('md-editor-v3', () => ({
  MdEditor: defineComponent({
    name: 'MdEditor',
    props: { modelValue: String },
    setup(props, { expose }) {
      expose(editorApi)
      return () => h('div', { class: 'md-editor-stub' }, props.modelValue)
    }
  }),
  MdPreview: defineComponent({
    name: 'MdPreview',
    props: { modelValue: String },
    setup: props => () => h('div', { class: 'md-editor-preview' }, props.modelValue)
  })
}))

let wrapper: VueWrapper | undefined

function mountEditor(props: Partial<MarkdownEditorProps> = {}) {
  wrapper = mount(MarkdownEditor, { props: { modelValue: '# Olá', ...props }, attachTo: document.body })
  return wrapper
}

const button = (title: string) => wrapper!.find(`button[title="${title}"]`)

beforeEach(() => vi.clearAllMocks())
afterEach(() => wrapper?.unmount())

describe('MarkdownEditor', () => {
  it('renderiza a toolbar nativa e o editor', () => {
    mountEditor()
    for (const title of ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Headings', 'Bulleted list', 'Insert', 'Expand editor']) {
      expect(button(title).exists()).toBe(true)
    }
    expect(wrapper!.find('.md-editor-stub').text()).toBe('# Olá')
  })

  it('usa o gerador nativo ao clicar num botão', async () => {
    mountEditor()
    await button('Bold').trigger('click')
    expect(editorApi.insert).toHaveBeenCalledWith(md.bold)
  })

  it('esconde as ferramentas de hideTools', () => {
    mountEditor({ hideTools: ['bold', 'headings', 'fullscreen'] })
    expect(button('Bold').exists()).toBe(false)
    expect(button('Headings').exists()).toBe(false)
    expect(button('Expand editor').exists()).toBe(false)
    expect(button('Italic').exists()).toBe(true)
  })

  it('passa o ToolbarContext para os botões extras', async () => {
    const onClick = vi.fn(({ setValue }) => setValue('novo'))
    mountEditor({ toolbarButtons: [{ key: 'custom', title: 'Custom', onClick }] })

    await button('Custom').trigger('click')

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({
      insert: expect.any(Function),
      getValue: expect.any(Function),
      setValue: expect.any(Function),
      focus: expect.any(Function)
    }))
    expect(wrapper!.emitted('update:modelValue')).toEqual([['novo']])
  })

  const menuItem = (label: string) => wrapper!.findAll('.mde-menu-item').find(b => b.text() === label)

  it('agrupa os plugins no menu "More tools", com dropdowns como submenus', async () => {
    const onClick = vi.fn()
    const onSelect = vi.fn()
    const plugin = defineToolbarPlugin({
      name: 'test',
      buttons: [
        { key: 'btn', title: 'Plugin button', onClick },
        { key: 'menu', title: 'Plugin menu', items: [{ key: 'sub', label: 'Sub item', onSelect }] }
      ]
    })
    mountEditor({ plugins: [plugin] })

    expect(button('Plugin button').exists()).toBe(false)

    await button('More tools').trigger('click')
    await menuItem('Plugin menu')!.trigger('click')
    await menuItem('Sub item')!.trigger('click')
    expect(onSelect).toHaveBeenCalledOnce()

    await button('More tools').trigger('click')
    await menuItem('Plugin button')!.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('respeita o placement de cada plugin sobre a prop pluginsPlacement', async () => {
    const inline = defineToolbarPlugin({ name: 'inline', placement: 'toolbar', buttons: [{ key: 'a', title: 'Inline button', onClick: vi.fn() }] })
    const grouped = defineToolbarPlugin({ name: 'grouped', buttons: [{ key: 'b', title: 'Grouped button', onClick: vi.fn() }] })
    mountEditor({ plugins: [inline, grouped] })

    expect(button('Inline button').exists()).toBe(true)
    expect(button('Grouped button').exists()).toBe(false)
    await button('More tools').trigger('click')
    expect(menuItem('Grouped button')).toBeDefined()
    expect(menuItem('Inline button')).toBeUndefined()

    await wrapper!.setProps({ pluginsPlacement: 'toolbar', plugins: [inline, { ...grouped, placement: 'menu' }] })
    expect(button('Grouped button').exists()).toBe(false)
  })

  it('coloca entradas com group no fim do grupo nativo, fora do menu e do grupo extra', async () => {
    const plugin = defineToolbarPlugin({
      name: 'tasks',
      hideTools: ['task'],
      buttons: [{ key: 'task', title: 'Nova tarefa', group: 'lists', onClick: vi.fn() }]
    })
    mountEditor({
      plugins: [plugin],
      toolbarButtons: [{ key: 'hl', title: 'Highlight', group: 'format', onClick: vi.fn() }]
    })

    const groupTitles = () => {
      const titles: string[][] = [[]]
      for (const el of wrapper!.findAll('.mde-toolbar-group:not(.mde-toolbar-group--end) > *')) {
        if (el.classes('mde-divider')) titles.push([])
        else titles.at(-1)!.push((el.element.tagName === 'BUTTON' ? el : el.find('button')).attributes('title')!)
      }
      return titles
    }
    const groups = groupTitles()
    expect(groups[0]).toEqual(['Bold', 'Italic', 'Underline', 'Strikethrough', 'Highlight'])
    expect(groups[2]).toEqual(['Bulleted list', 'Numbered list', 'Nova tarefa'])
    // Sem outros botões de plugin, o menu "More tools" nem aparece.
    expect(button('More tools').exists()).toBe(false)
  })

  it('sem plugins, não mostra o menu "More tools"', () => {
    mountEditor()
    expect(button('More tools').exists()).toBe(false)
  })

  it('com pluginsPlacement="toolbar", cada plugin fica na toolbar', async () => {
    const onSelect = vi.fn()
    const plugin = defineToolbarPlugin({
      name: 'test',
      buttons: [{ key: 'btn', title: 'Plugin button', onClick: vi.fn() }],
      insertMenuItems: [{ key: 'item', label: 'Plugin item', onSelect }],
      hideTools: ['italic']
    })
    mountEditor({ plugins: [plugin], pluginsPlacement: 'toolbar' })

    expect(button('Plugin button').exists()).toBe(true)
    expect(button('More tools').exists()).toBe(false)
    expect(button('Italic').exists()).toBe(false)

    await button('Insert').trigger('click')
    const item = wrapper!.findAll('.mde-menu-item').find(b => b.text() === 'Plugin item')
    await item!.trigger('click')
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('alterna para o preview e esconde a toolbar de edição', async () => {
    mountEditor()
    const preview = wrapper!.findAll('button').find(b => b.text() === 'Preview')
    await preview!.trigger('click')

    expect(wrapper!.find('.md-editor-stub').isVisible()).toBe(false)
    expect(wrapper!.find('.md-editor-preview').text()).toBe('# Olá')
    expect(button('Bold').exists()).toBe(false)
  })

  it('volta ao editor antes de inserir a partir do preview', async () => {
    mountEditor()
    await wrapper!.findAll('button').find(b => b.text() === 'Preview')!.trigger('click')

    ;(wrapper!.vm as unknown as { insert: (g: typeof md.bold) => void }).insert(md.bold)
    await wrapper!.vm.$nextTick()

    expect(wrapper!.find('.md-editor-stub').isVisible()).toBe(true)
  })

  it('mantém o mesmo editor montado ao ir e voltar do preview (preserva o Ctrl+Z)', async () => {
    mountEditor()
    const editorEl = wrapper!.find('.md-editor-stub').element
    const tab = (label: string) => wrapper!.findAll('button').find(b => b.text() === label)!

    await tab('Preview').trigger('click')
    await tab('Editor').trigger('click')

    expect(wrapper!.find('.md-editor-stub').element).toBe(editorEl)
    expect(wrapper!.find('.md-editor-preview').exists()).toBe(false)
  })

  it('expõe getValue com o conteúdo atual', () => {
    mountEditor({ modelValue: 'abc' })
    expect((wrapper!.vm as unknown as { getValue: () => string }).getValue()).toBe('abc')
  })
})

describe('MarkdownEditor em tela cheia', () => {
  it('abre o editor completo no body e recolhe pelo botão', async () => {
    mountEditor({ modelValue: 'texto' })
    await button('Expand editor').trigger('click')

    const dialog = document.body.querySelector('.mde-fullscreen')!
    expect(dialog.querySelector('button[title="Bold"]')).not.toBeNull()
    expect(dialog.querySelector('button[title="Expand editor"]')).toBeNull()

    ;(dialog.querySelector('button[title="Exit fullscreen (Esc)"]') as HTMLButtonElement).click()
    await wrapper!.vm.$nextTick()
    expect(document.body.querySelector('.mde-fullscreen')).toBeNull()
  })
})
