import { CaseLower, CaseSensitive, CaseUpper } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import type { InsertGenerator } from '../models/markdown-toolbar.models'

/** Transforma a seleção e mantém o resultado selecionado. Sem seleção, não faz nada. */
function transform(fn: (s: string) => string): InsertGenerator {
  return (selected) => {
    const result = fn(selected)
    return { targetValue: result, select: result.length > 0, deviationStart: 0, deviationEnd: 0 }
  }
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())

/** Exemplo de dropdown que opera sobre o texto selecionado. */
export function textTransformPlugin() {
  return defineToolbarPlugin({
    name: 'text-transform',
    buttons: [{
      key: 'menu',
      title: 'Maiúsculas/minúsculas',
      icon: CaseSensitive,
      items: [
        { key: 'upper', label: 'MAIÚSCULAS', icon: CaseUpper, onSelect: ({ insert }) => insert(transform(s => s.toUpperCase())) },
        { key: 'lower', label: 'minúsculas', icon: CaseLower, onSelect: ({ insert }) => insert(transform(s => s.toLowerCase())) },
        { key: 'title', label: 'Iniciais Maiúsculas', icon: CaseSensitive, onSelect: ({ insert }) => insert(transform(titleCase)) }
      ]
    }]
  })
}
