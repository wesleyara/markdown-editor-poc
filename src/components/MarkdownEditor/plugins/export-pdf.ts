import { FileDown } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import { getMessages } from '../utils/i18n'
import { mountDialog } from '../utils/mount-dialog'
import ExportPdfDialog from './ExportPdfDialog.vue'

let counter = 0

/** Botão que abre um preview do documento e o imprime ("Salvar como PDF" do navegador). */
export function exportPdfPlugin() {
  return defineToolbarPlugin({
    name: 'export-pdf',
    buttons: [{
      key: 'export-pdf',
      title: 'Export as PDF',
      icon: FileDown,
      onClick: ({ getValue, getTheme, getLanguage }) => {
        mountDialog(ExportPdfDialog, {
          modelValue: getValue(),
          theme: getTheme(),
          language: getLanguage(),
          messages: getMessages(getLanguage()),
          editorId: `mde-pdf-${counter++}`
        })
      }
    }]
  })
}
