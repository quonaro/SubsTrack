import { describe, expect, it } from 'vitest'
import {
  alarms,
  alarmsRelevant,
  refreshAlarms,
  requestBatteryExemption,
  requestExactAlarms,
} from './alarms'

describe('alarms', () => {
  it('is Android-only', () => {
    expect(alarmsRelevant()).toBe(false)
  })

  it('assumes both permissions are fine until a native status arrives', async () => {
    await refreshAlarms()
    expect(alarms).toEqual({ exact: true, battery: true, checked: false })
  })

  it('request helpers are no-ops off Android', async () => {
    await requestExactAlarms()
    await requestBatteryExemption()
    expect(alarms.exact).toBe(true)
    expect(alarms.battery).toBe(true)
  })
})
