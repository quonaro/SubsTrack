import { Capacitor, registerPlugin } from '@capacitor/core'
import { reactive } from 'vue'
import { logger } from './log'

const log = logger('alarms')

// Native plugin (android/app/.../AlarmsPlugin.java): exact-alarm permission and
// battery-optimisation exemption. Without the former Android 14+ downgrades
// every reminder to an inexact alarm, without the latter Doze/OEM cleaners
// delay them by hours — both are the usual reason "напоминание не пришло".
interface AlarmsPlugin {
  status(): Promise<{ exact: boolean; battery: boolean }>
  requestExact(): Promise<void>
  requestBattery(): Promise<void>
}
const Alarms = registerPlugin<AlarmsPlugin>('Alarms')

export const alarms = reactive({
  /** Exact alarms allowed (always true below API 31). */
  exact: true,
  /** Exempt from battery optimisation (always true below API 26). */
  battery: true,
  checked: false,
})

export const alarmsRelevant = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export async function refreshAlarms(): Promise<void> {
  if (!alarmsRelevant()) return
  try {
    const s = await Alarms.status()
    alarms.exact = !!s.exact
    alarms.battery = !!s.battery
    alarms.checked = true
  } catch (e) {
    log.debug('alarm status failed', e)
  }
}

/** Opens the system "Alarms & reminders" screen; the user grants it there. */
export async function requestExactAlarms(): Promise<void> {
  if (!alarmsRelevant()) return
  try {
    await Alarms.requestExact()
  } catch (e) {
    log.debug('exact alarm request failed', e)
  }
  await refreshAlarms()
}

/** Opens the "unrestricted battery usage" prompt/screen. */
export async function requestBatteryExemption(): Promise<void> {
  if (!alarmsRelevant()) return
  try {
    await Alarms.requestBattery()
  } catch (e) {
    log.debug('battery exemption request failed', e)
  }
  await refreshAlarms()
}
