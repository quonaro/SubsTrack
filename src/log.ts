// Gated logger. debug/info stay silent until a namespace is enabled via
// localStorage `substrack:log` — a comma-separated list of namespaces ('*'
// enables all, '-ns' excludes one). warn/error always emit.
// Example: localStorage.setItem('substrack:log', 'db,store,-db:hot')

export const LOG_FLAG = 'substrack:log'

type Level = 'debug' | 'info' | 'warn' | 'error'

function flagTokens(): string[] {
  try {
    return (localStorage.getItem(LOG_FLAG) ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export function isDebugEnabled(ns: string): boolean {
  const tokens = flagTokens()
  if (!tokens.length) return false
  let on = tokens.includes('*')
  for (const t of tokens) {
    if (t === '-*') on = false
    else if (t === `-${ns}`) on = false
    else if (t === ns) on = true
  }
  return on
}

// Dev-only terminal bridge: beacon the entry to the vite middleware
// (see vite.config.ts) so it lands in the dev-server console. Safe to call
// anywhere — every failure mode is swallowed.
function sendToTerminal(level: Level, ns: string, args: unknown[]): void {
  if (!import.meta.env.DEV) return
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
  const text = args.map((a) => {
    if (typeof a === 'string') return a
    if (a && typeof a === 'object' && typeof (a as { message?: unknown }).message === 'string') {
      const name = (a as { name?: unknown }).name
      return `${typeof name === 'string' && name ? `${name}: ` : ''}${
        (a as { message: string }).message
      }`
    }
    try {
      return JSON.stringify(a)
    } catch {
      return String(a)
    }
  })
  try {
    navigator.sendBeacon(
      '/__substrack-log',
      new Blob([JSON.stringify({ level, ns, args: text })], { type: 'application/json' }),
    )
  } catch {
    /* best effort */
  }
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export function logger(ns: string): Logger {
  const emit = (level: Level, args: unknown[]) => {
    if (level === 'debug' || level === 'info') {
      if (!isDebugEnabled(ns)) return
      ;(level === 'debug' ? console.debug : console.info)(`[${ns}]`, ...args)
    } else {
      ;(level === 'warn' ? console.warn : console.error)(`[${ns}]`, ...args)
    }
    sendToTerminal(level, ns, args)
  }
  return {
    debug: (...args) => emit('debug', args),
    info: (...args) => emit('info', args),
    warn: (...args) => emit('warn', args),
    error: (...args) => emit('error', args),
  }
}
