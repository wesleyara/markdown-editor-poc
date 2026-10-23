import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportPdfPlugin, tableEditorPlugin } from '../plugins'
import type { ToolbarContext, ToolbarMenu, ToolbarButton } from '../models/markdown-toolbar.models'

vi.mock('md-editor-v3', () => ({ MdPreview: { name: 'MdPreview', props: ['modelValue'], template: '<div class="preview">{{ modelValue }}</div>' } }))

const ctx = (insert = vi.fn()): ToolbarContext => ({
  insert, getValue: () => '# Doc', setValue: vi.fn(), focus: vi.fn(), getTheme: () => 'light', getLanguage: () => 'pt-BR'
})

afterEach(() => { document.body.innerHTML = '' })

describe('tableEditorPlugin', () => {
  it('hides the native table item and inserts the edited table', () => {
    const plugin = tableEditorPlugin()
    expect(plugin.hideTools).toContain('table')
    const insert = vi.fn()
    plugin.insertMenuItems![0]!.onSelect(ctx(insert))
    const dialog = document.body.querySelector('.mde-dialog')!
    expect(dialog.textContent).toContain('Editor de tabela')
    const inputs = dialog.querySelectorAll<HTMLInputElement>('.mde-cell')
    inputs[0]!.value = 'Nome'
    inputs[0]!.dispatchEvent(new Event('input'))
    ;(Array.from(dialog.querySelectorAll('button')).find(b => b.textContent?.includes('Inserir tabela')) as HTMLButtonElement).click()
    const generated = insert.mock.calls[0]![0]('').targetValue as string
    expect(generated).toContain('| Nome | Cabeçalho 2 | Cabeçalho 3 |')
    expect(document.body.querySelector('.mde-dialog')).toBeNull()
  })
})

describe('exportPdfPlugin', () => {
  it('opens a preview and prints it', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    ;((exportPdfPlugin().buttons![0]) as ToolbarButton).onClick(ctx())
    expect(document.body.querySelector('.mde-pdf .preview')?.textContent).toBe('# Doc')
    ;(Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('Exportar')) as HTMLButtonElement).click()
    expect(print).toHaveBeenCalled()
    expect((exportPdfPlugin().buttons![0] as ToolbarMenu).items).toBeUndefined()
  })
})
