import { ipcMain } from 'electron';
import { StreamUploader } from './streamUploader';

class SystemAudioRecorder {
  private uploader: StreamUploader;

  constructor() {
    this.uploader = new StreamUploader('system');
    this.setupIPC();
  }

  private setupIPC() {
    ipcMain.on('media:start-stream', () => {
        this.uploader.connect();
    });

    ipcMain.on('media:stop-stream', () => {
        this.uploader.disconnect();
    });

    ipcMain.on('media:system-chunk', async (_, chunk: ArrayBuffer) => {
      this.uploader.uploadChunk(chunk);
    });
  }
}

export const systemAudioRecorder = new SystemAudioRecorder();
