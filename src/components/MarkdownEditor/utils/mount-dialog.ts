import { createApp } from 'vue'
import type { Component } from 'vue'

/** Abre um componente de diálogo fora da árvore do editor (plugins não têm template próprio).
 * O componente deve emitir `close`; ao fechar, o app é desmontado e o foco volta a quem o abriu. */
export function mountDialog(component: Component, props: Record<string, unknown>, onClose?: () => void) {
  const host = document.createElement('div')
  const previouslyFocused = document.activeElement as HTMLElement | null
  document.body.appendChild(host)
  const app = createApp(component, {
    ...props,
    onClose: () => {
      app.unmount()
      host.remove()
      previouslyFocused?.focus()
      onClose?.()
    }
  })
  app.mount(host)
}
