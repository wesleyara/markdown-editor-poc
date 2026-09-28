import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownEditorImageLightbox from '../components/MarkdownEditorImageLightbox.vue'
import type { MarkdownEditorImageLightboxExpose } from '../models/markdown-editor-image-lightbox.models'

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())

async function mountOpen(src = 'http://localhost/image.png') {
  wrapper = mount(MarkdownEditorImageLightbox, { attachTo: document.body })
  ;(wrapper.vm as unknown as MarkdownEditorImageLightboxExpose).open(src)
  await wrapper.vm.$nextTick()
  return wrapper
}

const image = () => document.body.querySelector<HTMLImageElement>('.mde-lightbox img')
const action = (title: string) => document.body.querySelector<HTMLButtonElement>(`.mde-lightbox button[title="${title}"]`)!

describe('MarkdownEditorImageLightbox', () => {
  it('abre com a imagem informada', async () => {
    await mountOpen()
    expect(image()?.getAttribute('src')).toBe('http://localhost/image.png')
    expect(image()?.style.transform).toBe('translate(0px, 0px) scale(1)')
  })

  it('aplica zoom pelos botões, sem passar do mínimo', async () => {
    await mountOpen()
    action('Zoom in').click()
    await wrapper!.vm.$nextTick()
    expect(image()?.style.transform).toContain('scale(1.6)')

    action('Zoom out').click()
    action('Zoom out').click()
    await wrapper!.vm.$nextTick()
    expect(image()?.style.transform).toContain('scale(1)')
  })

  it('fecha pelo botão', async () => {
    await mountOpen()
    action('Close').click()
    await wrapper!.vm.$nextTick()
    expect(image()).toBeNull()
  })

  it('fecha com Esc e marca o evento como tratado', async () => {
    await mountOpen()
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    window.dispatchEvent(event)
    await wrapper!.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(image()).toBeNull()
  })
})
