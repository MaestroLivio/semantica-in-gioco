import { describe, expect, it } from 'vitest'
import { blobToDataUrl, dataUrlToBlob } from './db'

describe('backup delle registrazioni', () => {
  it('serializza un Blob audio e lo ricostruisce senza perdere i byte', async () => {
    const original = new Blob([new Uint8Array([0, 1, 2, 250, 255])], { type: 'audio/webm' })
    const dataUrl = await blobToDataUrl(original)
    expect(dataUrl.startsWith('data:audio/webm;base64,')).toBe(true)
    const restored = dataUrlToBlob(dataUrl)
    expect(restored.type).toBe('audio/webm')
    expect(new Uint8Array(await restored.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 250, 255]))
  })

  it('accetta anche un data URL senza tipo dichiarato', async () => {
    const blob = dataUrlToBlob('data:;base64,AAEC')
    expect(blob.type).toBe('application/octet-stream')
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2]))
  })
})
