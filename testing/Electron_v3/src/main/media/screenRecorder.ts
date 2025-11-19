import { ipcMain, desktopCapturer } from 'electron';
import { StreamUploader } from './streamUploader';

class ScreenRecorder {
  private uploader: StreamUploader;

  constructor() {
    this.uploader = new StreamUploader('screen');
    this.setupIPC();
  }

  private setupIPC() {
    ipcMain.handle('media:get-screen-sources', async () => {
      const sources = await desktopCapturer.getSources({ 
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 300 } // Optimize thumbnail size
      });
      return sources
        .filter(source => {
            const name = source.name.toLowerCase();
            // Filter out useless sources
            if (name === 'ashdrcontrol') return false;
            if (name === '') return false;
            if (name.includes('nvidia overlay')) return false;
            if (name.includes('screen recording')) return false;
            if (name.includes('permission')) return false;
            return true;
        })
        .map(source => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL()
        }));
    });

    ipcMain.on('media:start-stream', () => {
        this.uploader.connect();
    });

    ipcMain.on('media:stop-stream', () => {
        this.uploader.disconnect();
    });

    ipcMain.on('media:screen-chunk', async (_, chunk: ArrayBuffer) => {
      this.uploader.uploadChunk(chunk);
    });
  }
}

export const screenRecorder = new ScreenRecorder();
