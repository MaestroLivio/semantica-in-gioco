// Coda di riproduzione: una sola voce alla volta, priorità esplicita,
// interruzione immediata. È indipendente dal motore, così è testabile
// senza DOM e senza audio.

export interface QueueTask {
  id: string
  /** Valori più alti vengono serviti prima. */
  priority: number
  run: () => Promise<void>
  onEnd?: () => void
}

export class SpeechQueue {
  private tasks: QueueTask[] = []
  private sequence = 0
  private order = new Map<string, number>()
  private running = false
  private generation = 0

  constructor(private readonly stopCurrent: () => void = () => {}) {}

  get pending(): number {
    return this.tasks.length
  }

  get busy(): boolean {
    return this.running || this.tasks.length > 0
  }

  enqueue(task: QueueTask): void {
    this.order.set(task.id, this.sequence++)
    this.tasks.push(task)
    this.tasks.sort((a, b) => b.priority - a.priority || (this.order.get(a.id) ?? 0) - (this.order.get(b.id) ?? 0))
    void this.drain()
  }

  /** Interrompe subito la voce e svuota la coda. */
  cancelAll(): void {
    this.generation++
    this.tasks = []
    this.order.clear()
    this.stopCurrent()
  }

  private async drain(): Promise<void> {
    if (this.running) return
    this.running = true
    const generation = this.generation
    try {
      while (this.tasks.length) {
        if (generation !== this.generation) return
        const task = this.tasks.shift()!
        this.order.delete(task.id)
        try {
          await task.run()
        } catch {
          // Un errore di una voce non deve bloccare le successive.
        }
        if (generation !== this.generation) return
        task.onEnd?.()
      }
    } finally {
      this.running = false
      // Se durante l'esecuzione è arrivato un nuovo compito, riparte.
      if (this.tasks.length && generation === this.generation) void this.drain()
    }
  }
}
