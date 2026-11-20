import type { AVIFModule } from '@jsquash/avif/codec/enc/avif_enc'

/** Custom icons are stored inline in the `icon` column as data URLs. */
export const IMAGE_ICON_PREFIX = 'data:image/'

/** Icons render at ≤58px, so a 160px square covers 2× screens with margin. */
export const ICON_IMAGE_SIZE = 160

export function isImageIcon(icon: string): boolean {
  return icon.startsWith(IMAGE_ICON_PREFIX)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Loads the single-threaded AVIF encoder. `@jsquash/avif`'s own `encode()`
 * picks the multi-threaded build whenever shared WebAssembly memory happens
 * to be available, but that build only works behind COOP/COEP headers (never
 * the case in the app), so the glue is instantiated with the plain wasm here.
 */
let avifModule: Promise<AVIFModule> | null = null

async function loadAvif(): Promise<AVIFModule> {
  if (avifModule) return avifModule
  const loading = (async () => {
    const [{ default: factory }, { initEmscriptenModule }, { default: wasmUrl }] =
      await Promise.all([
        import('@jsquash/avif/codec/enc/avif_enc.js'),
        import('@jsquash/avif/utils.js'),
        import('@jsquash/avif/codec/enc/avif_enc.wasm?url'),
      ])
    const binary = await fetch(wasmUrl).then((response) => response.arrayBuffer())
    const wasm = await WebAssembly.compile(binary)
    return initEmscriptenModule(factory, wasm)
  })()
  avifModule = loading
  // A failed load must not poison every later attempt.
  loading.catch(() => {
    if (avifModule === loading) avifModule = null
  })
  return loading
}

/** Encodes pixels as AVIF; the source is tiny so quality stays high. */
export async function encodeAvif(image: ImageData, quality = 62): Promise<Blob> {
  const [{ defaultOptions }, module] = await Promise.all([
    import('@jsquash/avif/meta.js'),
    loadAvif(),
  ])
  const output = module.encode(new Uint8Array(image.data.buffer), image.width, image.height, {
    ...defaultOptions,
    quality,
    speed: 8,
  })
  if (!output) throw new Error('AVIF encoding failed')
  return new Blob([output as unknown as BlobPart], { type: 'image/avif' })
}

type DrawableImage = ImageBitmap | HTMLImageElement

async function loadImage(source: Blob): Promise<DrawableImage> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(source)
  const url = URL.createObjectURL(source)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Turns a (normally already square) crop into a small square AVIF icon.
 * Falls back to WebP when the encoder is unavailable so the picker never
 * leaves the user without an icon.
 */
export async function makeIconImage(source: Blob, size = ICON_IMAGE_SIZE): Promise<Blob> {
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas is unavailable')
  const side = Math.min(image.width, image.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    (image.width - side) / 2,
    (image.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  if ('close' in image) image.close()

  try {
    return await encodeAvif(ctx.getImageData(0, 0, size, size))
  } catch {
    return canvasToBlob(canvas, 'image/webp', 0.85)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error(`could not encode ${type}`))
      },
      type,
      quality,
    )
  })
}
