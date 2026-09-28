import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import MarkdownEditorDropdownMenu from '../components/MarkdownEditorDropdownMenu.vue'
import type { MarkdownEditorDropdownItem } from '../models/markdown-editor-dropdown-menu.models'

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())

function mountMenu(items: MarkdownEditorDropdownItem[]) {
  wrapper = mount(MarkdownEditorDropdownMenu, {
    props: { items },
    slots: {
      default: ({ toggle, open }: { toggle: () => void, open: boolean }) =>
        h('button', { class: 'trigger', 'aria-expanded': open, onClick: toggle }, 'Abrir')
    },
    attachTo: document.body
  })
  return wrapper
}

const items = () => [
  { key: 'a', label: 'Primeiro', onSelect: vi.fn() },
  { key: 'b', label: 'Segundo', onSelect: vi.fn() }
]

describe('MarkdownEditorDropdownMenu', () => {
  it('abre e fecha pelo slot', async () => {
    mountMenu(items())
    expect(wrapper!.find('.mde-menu').exists()).toBe(false)

    await wrapper!.find('.trigger').trigger('click')
    expect(wrapper!.findAll('.mde-menu-item').map(b => b.text())).toEqual(['Primeiro', 'Segundo'])
    expect(wrapper!.find('.trigger').attributes('aria-expanded')).toBe('true')

    await wrapper!.find('.trigger').trigger('click')
    expect(wrapper!.find('.mde-menu').exists()).toBe(false)
  })

  it('executa o item escolhido e fecha', async () => {
    const list = items()
    mountMenu(list)
    await wrapper!.find('.trigger').trigger('click')
    await wrapper!.findAll('.mde-menu-item')[1]!.trigger('click')

    expect(list[1]!.onSelect).toHaveBeenCalledOnce()
    expect(list[0]!.onSelect).not.toHaveBeenCalled()
    expect(wrapper!.find('.mde-menu').exists()).toBe(false)
  })

  it('foca o primeiro item ao abrir e navega com as setas', async () => {
    mountMenu(items())
    await wrapper!.find('.trigger').trigger('click')
    await wrapper!.vm.$nextTick()
    const buttons = wrapper!.findAll('.mde-menu-item')
    expect(document.activeElement).toBe(buttons[0]!.element)

    await wrapper!.find('.mde-dropdown').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[1]!.element)

    await wrapper!.find('.mde-dropdown').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[0]!.element)
  })

  it('fecha com Esc', async () => {
    mountMenu(items())
    await wrapper!.find('.trigger').trigger('click')
    await wrapper!.find('.mde-dropdown').trigger('keydown', { key: 'Escape' })
    expect(wrapper!.find('.mde-menu').exists()).toBe(false)
  })

  it('fecha ao clicar fora', async () => {
    mountMenu(items())
    await wrapper!.find('.trigger').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper!.vm.$nextTick()
    expect(wrapper!.find('.mde-menu').exists()).toBe(false)
  })

  describe('submenus', () => {
    const withSubmenu = () => [
      { key: 'a', label: 'Primeiro', onSelect: vi.fn() },
      {
        key: 'sub',
        label: 'Mais',
        children: [
          { key: 'x', label: 'Filho X', onSelect: vi.fn() },
          { key: 'y', label: 'Filho Y', onSelect: vi.fn() }
        ]
      }
    ]
    const submenu = () => wrapper!.find('.mde-submenu')
    const keydown = (key: string) => wrapper!.find('.mde-dropdown').trigger('keydown', { key })

    it('abre o submenu ao clicar e executa o filho', async () => {
      const list = withSubmenu()
      mountMenu(list)
      await wrapper!.find('.trigger').trigger('click')
      expect(submenu().exists()).toBe(false)

      await wrapper!.find('[data-key="sub"]').trigger('click')
      expect(submenu().findAll('button').map(b => b.text())).toEqual(['Filho X', 'Filho Y'])

      await submenu().findAll('button')[1]!.trigger('click')
      expect(list[1]!.children![1]!.onSelect).toHaveBeenCalledOnce()
      expect(wrapper!.find('.mde-menu').exists()).toBe(false)
    })

    it('clicar depois do hover mantém o submenu aberto', async () => {
      mountMenu(withSubmenu())
      await wrapper!.find('.trigger').trigger('click')
      await wrapper!.findAll('.mde-menu > li')[1]!.trigger('mouseenter')
      await wrapper!.find('[data-key="sub"]').trigger('click')
      expect(submenu().exists()).toBe(true)
    })

    it('abre o submenu ao passar o mouse e fecha ao passar em outro item', async () => {
      mountMenu(withSubmenu())
      await wrapper!.find('.trigger').trigger('click')
      const [first, second] = wrapper!.findAll('.mde-menu > li')

      await second!.trigger('mouseenter')
      expect(submenu().exists()).toBe(true)

      await first!.trigger('mouseenter')
      expect(submenu().exists()).toBe(false)
    })

    it('navega pelo teclado: → entra, ↓ circula só no submenu, ← e Esc voltam', async () => {
      mountMenu(withSubmenu())
      await wrapper!.find('.trigger').trigger('click')
      await wrapper!.vm.$nextTick()
      await keydown('ArrowDown')
      expect((document.activeElement as HTMLElement).dataset.key).toBe('sub')

      await keydown('ArrowRight')
      await wrapper!.vm.$nextTick()
      expect((document.activeElement as HTMLElement).dataset.key).toBe('x')

      await keydown('ArrowDown')
      await keydown('ArrowDown')
      expect((document.activeElement as HTMLElement).dataset.key).toBe('x')

      await keydown('ArrowLeft')
      expect(submenu().exists()).toBe(false)
      expect((document.activeElement as HTMLElement).dataset.key).toBe('sub')

      await keydown('ArrowRight')
      await wrapper!.vm.$nextTick()
      await keydown('Escape')
      expect(submenu().exists()).toBe(false)
      expect(wrapper!.find('.mde-menu').exists()).toBe(true)
    })
  })
})
