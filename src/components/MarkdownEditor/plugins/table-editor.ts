import { Table } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import { getMessages } from '../utils/i18n'
import { mountDialog } from '../utils/mount-dialog'
import TableEditorDialog from './TableEditorDialog.vue'

/** Troca o item "Table" do menu Insert por um editor visual: escolhe colunas/linhas, preenche as
 * células e insere a tabela markdown pronta. */
export function tableEditorPlugin() {
  return defineToolbarPlugin({
    name: 'table-editor',
    hideTools: ['table'],
    insertMenuItems: [{
      key: 'table',
      label: 'Table',
      icon: Table,
      onSelect: ({ insert, getTheme, getLanguage }) => {
        mountDialog(TableEditorDialog, { theme: getTheme(), messages: getMessages(getLanguage()), onInsert: (markdown: string) => insert(() => ({ targetValue: markdown, select: false })) })
      }
    }]
  })
}
