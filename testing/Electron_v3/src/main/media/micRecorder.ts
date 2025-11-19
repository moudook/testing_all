import { ipcMain } from 'electron';
import { StreamUploader } from './streamUploader';

class MicRecorder {
  private uploader: StreamUploader;

  constructor() {
    this.uploader = new StreamUploader('mic');
    this.setupIPC();
  }

  private setupIPC() {
    ipcMain.on('media:start-stream', () => {
        this.uploader.connect();
    });

    ipcMain.on('media:stop-stream', () => {
        this.uploader.disconnect();
    });

    ipcMain.on('media:mic-chunk', async (_, chunk: ArrayBuffer) => {
      this.uploader.uploadChunk(chunk);
    });
  }
}

export const micRecorder = new MicRecorder();
