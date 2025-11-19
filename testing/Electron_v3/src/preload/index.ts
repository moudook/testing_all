import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

const mediaAPI = {
  getScreenSources: () => ipcRenderer.invoke('media:get-screen-sources'),
  startStream: () => ipcRenderer.send('media:start-stream'),
  stopStream: () => ipcRenderer.send('media:stop-stream'),
  sendScreenChunk: (chunk: ArrayBuffer) => ipcRenderer.send('media:screen-chunk', chunk),
  sendMicChunk: (chunk: ArrayBuffer) => ipcRenderer.send('media:mic-chunk', chunk),
  sendSystemChunk: (chunk: ArrayBuffer) => ipcRenderer.send('media:system-chunk', chunk),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('mediaAPI', mediaAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.mediaAPI = mediaAPI
}
