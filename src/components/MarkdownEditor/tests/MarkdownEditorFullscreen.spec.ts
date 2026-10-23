import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownEditorFullscreen from '../components/MarkdownEditorFullscreen.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  document.body.style.overflow = ''
})

async function mountOpen() {
  wrapper = mount(MarkdownEditorFullscreen, {
    props: {
      'theme': 'light',
      'open': false,
      'onUpdate:open': (value: boolean) => wrapper!.setProps({ open: value })
    },
    slots: { default: '<p>conteúdo</p>' },
    attachTo: document.body
  })
  await wrapper.setProps({ open: true })
  return wrapper
}

const dialog = () => document.body.querySelector('.mde-fullscreen')

describe('MarkdownEditorFullscreen', () => {
  it('não renderiza nada fechado', () => {
    wrapper = mount(MarkdownEditorFullscreen, {
      props: { theme: 'light', open: false }
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
})
