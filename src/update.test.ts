// Update-check tests: isNewerVersion is pure; checkForUpdate/downloadUpdate
// run against a stubbed fetch/window.open on the web path (jsdom reports a
// non-native platform, so the Android branches stay untouched).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  appVersion,
  checkForUpdate,
  downloadUpdate,
  isNewerVersion,
  permsRelevant,
  releasesUrl,
  update,
} from './update'

const releaseResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const stubFetch = (impl: () => Promise<unknown>) => {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  update.status = 'idle'
  update.busy = false
  update.latest = ''
  update.url = releasesUrl
  update.apkUrl = ''
  update.dl = 'idle'
  update.progress = 0
  update.apkPath = ''
  update.checkedAt = null
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isNewerVersion', () => {
  it('compares semantic versions, ignoring a leading v', () => {
    expect(isNewerVersion('1.2.4', '1.2.3')).toBe(true)
    expect(isNewerVersion('v1.2.3', '1.2.3')).toBe(false)
    expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true)
    expect(isNewerVersion('0.9.0', '1.0.0')).toBe(false)
    expect(isNewerVersion('1.10.0', '1.9.0')).toBe(true)
  })

  it('rejects malformed versions', () => {
    expect(isNewerVersion('abc', '1.2.3')).toBe(false)
    expect(isNewerVersion('1.2', '1.2.3')).toBe(false)
    expect(isNewerVersion('1.2.3', 'abc')).toBe(false)
    expect(isNewerVersion('', '')).toBe(false)
  })

  it('appVersion is a plain semver string', () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('checkForUpdate', () => {
  it('treats 404 (no releases) as up to date', async () => {
    stubFetch(async () => releaseResponse({}, 404))
    expect(await checkForUpdate()).toBe('uptodate')
    expect(update.status).toBe('uptodate')
  })

  it('reports a newer tag as available with the apk asset', async () => {
    stubFetch(async () =>
      releaseResponse({
        tag_name: 'v99.0.0',
        html_url: 'https://example.test/rel',
        assets: [{ name: 'substrack-v99.apk', browser_download_url: 'https://example.test/a.apk' }],
      }),
    )
    expect(await checkForUpdate()).toBe('available')
    expect(update.latest).toBe('99.0.0')
    expect(update.url).toBe('https://example.test/rel')
    expect(update.apkUrl).toBe('https://example.test/a.apk')
    expect(update.dl).toBe('idle')
    expect(update.progress).toBe(0)
  })

  it('reports an older/equal tag as up to date', async () => {
    stubFetch(async () => releaseResponse({ tag_name: 'v0.0.1', assets: [] }))
    expect(await checkForUpdate()).toBe('uptodate')
  })

  it('leaves apkUrl empty when the release has no apk asset', async () => {
    stubFetch(async () => releaseResponse({ tag_name: 'v99.0.0', assets: [] }))
    expect(await checkForUpdate()).toBe('available')
    expect(update.apkUrl).toBe('')
  })

  it('maps http errors and network failures to error', async () => {
    stubFetch(async () => releaseResponse({}, 500))
    expect(await checkForUpdate()).toBe('error')
    stubFetch(async () => Promise.reject(new Error('offline')))
    expect(await checkForUpdate()).toBe('error')
  })

  it('stamps and persists the check time on success only', async () => {
    const before = Date.now()
    stubFetch(async () => releaseResponse({ tag_name: 'v0.0.1', assets: [] }))
    expect(await checkForUpdate()).toBe('uptodate')
    expect(update.checkedAt).toBeGreaterThanOrEqual(before)
    expect(Number(localStorage.getItem('substrack:updateCheckedAt'))).toBe(update.checkedAt)

    const stamped = update.checkedAt
    stubFetch(async () => releaseResponse({}, 500))
    expect(await checkForUpdate()).toBe('error')
    expect(update.checkedAt).toBe(stamped)
  })

  it('does not re-enter while busy', async () => {
    const fn = stubFetch(async () => releaseResponse({}, 404))
    update.busy = true
    update.status = 'checking'
    expect(await checkForUpdate()).toBe('checking')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('downloadUpdate (web path)', () => {
  it('opens the release page off-Android', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    update.url = 'https://example.test/rel'
    await downloadUpdate()
    expect(open).toHaveBeenCalledWith('https://example.test/rel', '_blank', 'noopener')
  })

  it('permsRelevant is false off-Android', () => {
    expect(permsRelevant()).toBe(false)
  })
})
