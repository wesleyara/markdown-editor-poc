import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownEditorFullscreenPreview from '../components/MarkdownEditorFullscreenPreview.vue'

vi.mock('md-editor-v3', () => ({
  MdPreview: defineComponent({
    name: 'MdPreview',
    props: { modelValue: String },
    setup: props => () => h('div', { class: 'md-editor-preview' }, [
      h('p', props.modelValue),
      h('img', { src: 'http://localhost/image.png' })
    ])
  })
}))

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  document.body.style.overflow = ''
})

async function mountOpen() {
  wrapper = mount(MarkdownEditorFullscreenPreview, {
    props: {
      'modelValue': 'conteúdo',
      'theme': 'light',
      'language': 'en-US',
      'echarts': false,
      'open': false,
      'onUpdate:open': (value: boolean) => wrapper!.setProps({ open: value })
    },
    attachTo: document.body
  })
  await wrapper.setProps({ open: true })
  return wrapper
}

const dialog = () => document.body.querySelector('.mde-fullscreen')

describe('MarkdownEditorFullscreenPreview', () => {
  it('não renderiza nada fechado', () => {
    wrapper = mount(MarkdownEditorFullscreenPreview, {
      props: { modelValue: 'x', theme: 'light', language: 'en-US', echarts: false, open: false }
    })
    expect(dialog()).toBeNull()
  })

  it('abre no body e trava a rolagem', async () => {
    await mountOpen()
    expect(dialog()?.textContent).toContain('conteúdo')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('fecha com Esc e restaura a rolagem', async () => {
    await mountOpen()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper!.vm.$nextTick()

    expect(wrapper!.emitted('update:open')).toEqual([[false]])
    expect(dialog()).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('ignora Esc já tratado por outra camada', async () => {
    await mountOpen()
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    event.preventDefault()
    window.dispatchEvent(event)
    expect(wrapper!.emitted('update:open')).toBeUndefined()
  })

  it('emite imageClick ao clicar numa imagem', async () => {
    await mountOpen()
    ;(dialog()!.querySelector('img') as HTMLImageElement).click()
    expect(wrapper!.emitted('imageClick')).toEqual([['http://localhost/image.png']])
  })
})
