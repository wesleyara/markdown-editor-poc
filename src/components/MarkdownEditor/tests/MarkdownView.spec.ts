import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownView from '../components/MarkdownView.vue'

vi.mock('../utils/setup', () => ({ setupMarkdownEditor: vi.fn() }))
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
afterEach(() => wrapper?.unmount())

describe('MarkdownView', () => {
  it('renderiza o conteúdo', () => {
    wrapper = mount(MarkdownView, { props: { modelValue: 'texto' }, attachTo: document.body })
    expect(wrapper.find('.md-editor-preview p').text()).toBe('texto')
  })

  it('abre a imagem clicada no lightbox', async () => {
    wrapper = mount(MarkdownView, { props: { modelValue: 'texto' }, attachTo: document.body })
    await wrapper.find('.md-editor-preview img').trigger('click')
    expect(document.body.querySelector('.mde-lightbox img')?.getAttribute('src')).toBe('http://localhost/image.png')
  })

  it('não abre o lightbox com imageLightbox desligado', async () => {
    wrapper = mount(MarkdownView, { props: { modelValue: 'texto', imageLightbox: false }, attachTo: document.body })
    await wrapper.find('.md-editor-preview img').trigger('click')
    expect(document.body.querySelector('.mde-lightbox')).toBeNull()
  })
})
