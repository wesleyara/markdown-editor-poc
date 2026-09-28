import { Calendar, CalendarClock, Clock } from '@lucide/vue'
import { defineToolbarPlugin } from '../utils/toolbar'
import { text } from './helpers'

/** Exemplo de dropdown com itens que calculam o valor na hora do clique. */
export function dateTimePlugin(options: { locale?: string } = {}) {
  const locale = options.locale ?? 'pt-BR'

  return defineToolbarPlugin({
    name: 'date-time',
    buttons: [{
      key: 'menu',
      title: 'Data e hora',
      icon: CalendarClock,
      items: [
        { key: 'date', label: 'Data', icon: Calendar, onSelect: ({ insert }) => insert(text(new Date().toLocaleDateString(locale))) },
        { key: 'time', label: 'Hora', icon: Clock, onSelect: ({ insert }) => insert(text(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }))) },
        { key: 'datetime', label: 'Data e hora', icon: CalendarClock, onSelect: ({ insert }) => insert(text(new Date().toLocaleString(locale))) },
        { key: 'iso', label: 'ISO 8601', icon: CalendarClock, onSelect: ({ insert }) => insert(text(new Date().toISOString())) }
      ]
    }]
  })
}
