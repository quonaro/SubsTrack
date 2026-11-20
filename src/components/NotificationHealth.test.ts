import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationHealth from './NotificationHealth.vue'
import { alarms } from '../alarms'
import { reminderState } from '../domain/reminders'

// jsdom is never Android: the alarm/battery rows only show on a real device, so
// the flag is forced for those cases. The rest of the module stays real —
// `alarms` is the same reactive object the component reads.
const flags = vi.hoisted(() => ({ relevant: false, exactCalls: 0, batteryCalls: 0 }))

vi.mock('../alarms', async () => {
  const actual = await vi.importActual<typeof import('../alarms')>('../alarms')
  return {
    ...actual,
    alarmsRelevant: () => flags.relevant,
    refreshAlarms: async () => {},
    requestExactAlarms: async () => {
      flags.exactCalls += 1
    },
    requestBatteryExemption: async () => {
      flags.batteryCalls += 1
    },
  }
})

beforeEach(() => {
  flags.relevant = false
  flags.exactCalls = 0
  flags.batteryCalls = 0
  alarms.exact = true
  alarms.battery = true
  alarms.checked = true
  reminderState.scheduled = 0
  reminderState.at = 0
})

describe('NotificationHealth', () => {
  it('reports the notification permission', async () => {
    const w = mount(NotificationHealth)
    await flushPromises()
    // web: no runtime permission to ask for → treated as granted
    expect(w.text()).toContain('Разрешение на уведомления')
    expect(w.text()).toContain('выдано')
    expect(w.find('button').exists()).toBe(false)
  })

  it('hides the alarm and battery rows off Android', async () => {
    const w = mount(NotificationHealth)
    await flushPromises()
    expect(w.text()).not.toContain('Точные будильники')
    expect(w.text()).not.toContain('Оптимизация батареи')
  })

  it('offers to grant exact alarms and battery exemption when missing', async () => {
    flags.relevant = true
    alarms.exact = false
    alarms.battery = false
    const w = mount(NotificationHealth)
    await flushPromises()
    expect(w.text()).toContain('Точные будильники')
    expect(w.text()).toContain('могут опаздывать')
    expect(w.text()).toContain('напоминания могут не приходить')

    await w.find('button').trigger('click') // "Разрешить" is the first button (exact alarms)
    await flushPromises()
    expect(flags.exactCalls).toBe(1)
  })

  it('shows how many reminders are scheduled', async () => {
    const w = mount(NotificationHealth)
    await flushPromises()
    expect(w.text()).toContain('ещё не планировались')

    reminderState.scheduled = 42
    reminderState.at = new Date(2026, 2, 10, 9, 5).getTime()
    await flushPromises()
    expect(w.text()).toContain('42 шт.')
    expect(w.text()).toContain('09:05')
  })
})
