import { ListChecks } from '@lucide/vue'
import { defineToolbarPlugin, insertText, wrapSelection } from '../components/MarkdownEditor'

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
