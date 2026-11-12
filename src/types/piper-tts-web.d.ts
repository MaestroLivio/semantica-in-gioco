// piper-tts-web non pubblica dichiarazioni TypeScript: questo file descrive
// solo la parte dell'API che l'app usa davvero.

declare module 'piper-tts-web' {
  export interface PiperResponse {
    phonemeData: unknown
    file: Blob
    duration: number
  }

  export interface PiperEngineOptions {
    onnxRuntime?: unknown
    voiceProvider?: unknown
  }

  export class PiperWebEngine {
    constructor(options?: PiperEngineOptions)
    generate(text: string, voice: string, speaker?: number): Promise<PiperResponse>
    expressions(phonemeData: unknown): Promise<unknown>
  }

  export class PiperWebWorkerEngine extends PiperWebEngine {}

  export class HuggingFaceVoiceProvider {
    list(): Promise<unknown>
  }

  export class OnnxWebGPURuntime {}
  export class OnnxWebGPUWorkerRuntime {}
}
