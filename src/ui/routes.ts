import type { SessionRequest } from '../engine/session'
import type { Exercise } from '../engine/exercise'
import type { EnvironmentId } from '../engine/types'

export type Route =
  | { name: 'home' }
  | { name: 'child' }
  | {
      name: 'session'
      request: SessionRequest
      label?: string
      restartable?: boolean
      /** Lezione già costruita (per esempio dalla scheda parola). */
      exercises?: Exercise[]
    }
  | { name: 'teacher' }
  | { name: 'explore'; envId?: EnvironmentId }
  | { name: 'atlas' }
  | { name: 'stories'; storyId?: string }
  | { name: 'maps'; mapId?: string }
  | { name: 'settings' }
  | { name: 'about' }

export type Navigate = (route: Route) => void
