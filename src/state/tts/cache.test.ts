import { describe, expect, it } from 'vitest'
import { cacheKey } from './cache'

describe('cacheKey', () => {
  it('è deterministica per gli stessi parametri', () => {
    const a = cacheKey({ text: 'Ciao', voiceId: 'it_IT-paola-medium', modelVersion: '1.0.0', rate: 0.9 })
    const b = cacheKey({ text: 'Ciao', voiceId: 'it_IT-paola-medium', modelVersion: '1.0.0', rate: 0.9 })
    expect(a).toBe(b)
  })

  it('cambia quando cambia testo, voce, versione o velocità', () => {
    const base = cacheKey({ text: 'Ciao', voiceId: 'v1', modelVersion: '1', rate: 1 })
    expect(cacheKey({ text: 'Ciao!', voiceId: 'v1', modelVersion: '1', rate: 1 })).not.toBe(base)
    expect(cacheKey({ text: 'Ciao', voiceId: 'v2', modelVersion: '1', rate: 1 })).not.toBe(base)
    expect(cacheKey({ text: 'Ciao', voiceId: 'v1', modelVersion: '2', rate: 1 })).not.toBe(base)
    expect(cacheKey({ text: 'Ciao', voiceId: 'v1', modelVersion: '1', rate: 0.8 })).not.toBe(base)
  })

  it('normalizza la velocità a due decimali', () => {
    const a = cacheKey({ text: 'Ciao', voiceId: 'v1', modelVersion: '1', rate: 0.9 })
    const b = cacheKey({ text: 'Ciao', voiceId: 'v1', modelVersion: '1', rate: 0.90001 })
    expect(a).toBe(b)
  })
})
