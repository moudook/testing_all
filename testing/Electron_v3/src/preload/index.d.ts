import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    mediaAPI: {
      getScreenSources: () => Promise<{ id: string; name: string; thumbnail: string }[]>
      startStream: () => void
      stopStream: () => void
      sendScreenChunk: (chunk: ArrayBuffer) => void
      sendMicChunk: (chunk: ArrayBuffer) => void
      sendSystemChunk: (chunk: ArrayBuffer) => void
    }
  }
}
