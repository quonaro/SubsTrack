import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isDebugEnabled, LOG_FLAG, logger } from './log'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isDebugEnabled', () => {
  it('is off without a flag', () => {
    expect(isDebugEnabled('db')).toBe(false)
  })

  it('enables namespaces listed in the flag', () => {
    localStorage.setItem(LOG_FLAG, 'db, store ,-db')
    expect(isDebugEnabled('store')).toBe(true)
    expect(isDebugEnabled('db')).toBe(false)
    expect(isDebugEnabled('subs')).toBe(false)
  })

  it('* enables everything, -* disables everything', () => {
    localStorage.setItem(LOG_FLAG, '*')
    expect(isDebugEnabled('anything')).toBe(true)
    localStorage.setItem(LOG_FLAG, '*,-db')
    expect(isDebugEnabled('db')).toBe(false)
    expect(isDebugEnabled('store')).toBe(true)
    localStorage.setItem(LOG_FLAG, '*,-*')
    expect(isDebugEnabled('store')).toBe(false)
  })

  it('later tokens win', () => {
    localStorage.setItem(LOG_FLAG, 'db,-db,db')
    expect(isDebugEnabled('db')).toBe(true)
  })
})

describe('logger', () => {
  it('gates debug/info behind the flag', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = logger('test')
    log.debug('quiet')
    log.info('quiet')
    expect(debug).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
    localStorage.setItem(LOG_FLAG, 'test')
    log.debug('loud')
    log.info('loud')
    expect(debug).toHaveBeenCalledWith('[test]', 'loud')
    expect(info).toHaveBeenCalledWith('[test]', 'loud')
  })

  it('always emits warn/error regardless of the flag', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = logger('test')
    log.warn('w')
    log.error('e')
    expect(warn).toHaveBeenCalledWith('[test]', 'w')
    expect(error).toHaveBeenCalledWith('[test]', 'e')
  })
})
