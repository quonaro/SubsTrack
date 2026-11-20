// Platform glue for the backup file. Web downloads it through the browser,
// Android opens the system "Save as" sheet (ACTION_CREATE_DOCUMENT, see
// FileSaverPlugin.java) so the user keeps the file wherever they want —
// Downloads, Drive, an SD card — and no storage permission is involved.
import { Capacitor, registerPlugin } from '@capacitor/core'

interface FileSaverPlugin {
  save(options: { fileName: string; text: string; mime?: string }): Promise<{
    saved: boolean
    uri?: string
  }>
}

const FileSaver = registerPlugin<FileSaverPlugin>('FileSaver')

export type SaveResult =
  /** Browser download. */
  | { kind: 'downloaded' }
  /** Written to the document the user picked. */
  | { kind: 'saved'; uri: string }
  /** The picker was dismissed without saving. */
  | { kind: 'canceled' }

function download(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function saveBackup(text: string, name: string): Promise<SaveResult> {
  if (Capacitor.getPlatform() === 'web') {
    download(text, name)
    return { kind: 'downloaded' }
  }
  const res = await FileSaver.save({ fileName: name, text, mime: 'application/json' })
  if (!res.saved) return { kind: 'canceled' }
  return { kind: 'saved', uri: res.uri ?? '' }
}
