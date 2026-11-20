import { ACCENTS } from './theme'
import { store } from './store'

const WIPE_CLASS = 'theme-wipe'
const WIPE_VAR = '--wipe-r'

let pauses = 0
let overlay: HTMLDivElement | null = null

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The wipe needs rAF; jsdom's CSS.supports is unreliable, so tests opt out via MODE. */
function canAnimate(): boolean {
  if (import.meta.env.MODE === 'test') return false
  return typeof requestAnimationFrame === 'function' && typeof document !== 'undefined'
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

const easeInOutCubic = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)

/**
 * Mask gradient centered on the tap point with a 2px feathered edge.
 * `visibleInside` picks the phase: true → colored disc grows (covers old UI);
 * false → transparent hole grows (reveals the already-applied new theme).
 * --wipe-r is the circle radius, animated frame-by-frame via rAF.
 */
function maskGradient(x: number, y: number, visibleInside: boolean): string {
  const a = visibleInside ? '#000' : 'transparent'
  const b = visibleInside ? 'transparent' : '#000'
  return (
    `radial-gradient(circle at ${x}px ${y}px, ` +
    `${a} calc(var(${WIPE_VAR}) - 2px), ${b} var(${WIPE_VAR}))`
  )
}

function setMask(el: HTMLElement, x: number, y: number, visibleInside: boolean): void {
  const g = maskGradient(x, y, visibleInside)
  el.style.setProperty('-webkit-mask-image', g)
  el.style.setProperty('mask-image', g)
  el.style.maskMode = 'alpha'
}

/** Animates --wipe-r on the overlay from `from` to `to` over `duration` ms. */
function animateRadius(el: HTMLElement, from: number, to: number, duration: number) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now()
    const step = (t: number): void => {
      if (!el.isConnected) {
        resolve()
        return
      }
      const p = Math.min(1, (t - t0) / duration)
      el.style.setProperty(WIPE_VAR, `${from + (to - from) * easeInOutCubic(p)}px`)
      if (p < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

/**
 * Circular theme wipe. Plays an expanding colored disc from the tap point;
 * once it fully covers the screen `apply()` swaps the theme instantly
 * (CSS transitions are frozen meanwhile), then a transparent hole expands
 * along the same circle to reveal the new theme. An async `apply()` keeps
 * the screen fully covered until it resolves, so settings written there
 * (and the reactive selection that follows) stay invisible during the grow.
 *
 * `color` overrides the fill — defaults to the accent color.
 * Falls back to a plain apply() when the animation can't run.
 */
export async function runThemeWipe(
  e: { clientX: number; clientY: number },
  apply: () => void | Promise<void>,
  color?: string,
): Promise<void> {
  if (reducedMotion() || !canAnimate() || typeof document === 'undefined') {
    await apply()
    return
  }

  const fill = color ?? (ACCENTS[store.settings.accent] ?? ACCENTS.orange).value
  // Keyboard-activated clicks report 0,0 — fall back to screen center.
  const x = e.clientX || window.innerWidth / 2
  const y = e.clientY || window.innerHeight / 2

  // Farthest screen point from the tap — the radius that guarantees coverage.
  const maxR =
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 2

  pauses++
  document.documentElement.classList.add(WIPE_CLASS)
  overlay?.remove()
  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;'
  root.style.background = fill
  root.style.setProperty(WIPE_VAR, '0px')
  setMask(root, x, y, true)
  document.body.appendChild(root)
  overlay = root

  try {
    // Phase 1: colored disc expands over the still-old UI.
    await animateRadius(root, 0, maxR, 600)

    // Screen is fully covered — swap the theme invisibly, hold a beat,
    // then phase 2: a transparent hole expands along the same circle.
    await apply()
    setMask(root, x, y, false)
    root.style.setProperty(WIPE_VAR, '0px')
    await delay(160)
    await animateRadius(root, 0, maxR, 620)
  } finally {
    root.remove()
    if (overlay === root) overlay = null
    if (--pauses === 0) document.documentElement.classList.remove(WIPE_CLASS)
  }
}
