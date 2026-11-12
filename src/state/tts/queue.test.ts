import { describe, expect, it } from 'vitest'
import { SpeechQueue } from './queue'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('SpeechQueue', () => {
  it('riproduce una voce alla volta, per priorità e poi in ordine di arrivo', async () => {
    const events: string[] = []
    const queue = new SpeechQueue()
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    queue.enqueue({
      id: 'a',
      priority: 0,
      run: async () => {
        events.push('a:start')
        await gate
        events.push('a:end')
      },
    })
    queue.enqueue({ id: 'b', priority: 0, run: async () => void events.push('b') })
    queue.enqueue({ id: 'c', priority: 5, run: async () => void events.push('c') })

    release()
    await delay(30)
    expect(events).toEqual(['a:start', 'a:end', 'c', 'b'])
  })

  it('annulla la coda e interrompe la voce in corso', async () => {
    const events: string[] = []
    let stopped = 0
    const queue = new SpeechQueue(() => {
      stopped++
    })
    queue.enqueue({ id: 'a', priority: 0, run: () => delay(40).then(() => void events.push('a')) })
    queue.enqueue({ id: 'b', priority: 0, run: async () => void events.push('b') })

    queue.cancelAll()
    await delay(80)
    expect(stopped).toBe(1)
    expect(events).toEqual(['a'])
    expect(queue.pending).toBe(0)
  })

  it('continua dopo un errore di una singola voce', async () => {
    const events: string[] = []
    const queue = new SpeechQueue()
    queue.enqueue({
      id: 'a',
      priority: 0,
      run: async () => {
        throw new Error('sintesi fallita')
      },
    })
    queue.enqueue({ id: 'b', priority: 0, run: async () => void events.push('b') })
    await delay(20)
    expect(events).toEqual(['b'])
  })

  it('segnala la fine di ogni voce', async () => {
    const ended: string[] = []
    const queue = new SpeechQueue()
    queue.enqueue({ id: 'a', priority: 0, run: async () => {}, onEnd: () => ended.push('a') })
    queue.enqueue({ id: 'b', priority: 0, run: async () => {}, onEnd: () => ended.push('b') })
    await delay(20)
    expect(ended).toEqual(['a', 'b'])
  })
})
