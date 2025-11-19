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
            
            // Filter out empty or very short names
            if (!source.name || source.name.trim().length < 2) return false;
            
            // Filter out system and driver overlays
            if (name === 'ashdrcontrol') return false;
            if (name.includes('nvidia')) return false;
            if (name.includes('amd')) return false;
            if (name.includes('radeon')) return false;
            if (name.includes('intel')) return false;
            
            // Filter out overlays and system UI
            if (name.includes('overlay')) return false;
            if (name.includes('screen recording')) return false;
            if (name.includes('permission')) return false;
            if (name.includes('notification')) return false;
            if (name.includes('task view')) return false;
            if (name.includes('cortana')) return false;
            if (name.includes('windows shell')) return false;
            
            // Filter out browser dev tools and extensions
            if (name.includes('devtools')) return false;
            if (name.includes('developer tools')) return false;
            if (name.includes('chromium')) return false;
            
            // Filter out protected/DRM content indicators
            if (name.includes('protected')) return false;
            if (name.includes('drm')) return false;
            
            // Prioritize actual screens and useful windows
            return true;
        })
        // Sort to show screens first, then windows
        .sort((a, b) => {
            const aIsScreen = a.name.toLowerCase().includes('screen') || a.name.toLowerCase().includes('display');
            const bIsScreen = b.name.toLowerCase().includes('screen') || b.name.toLowerCase().includes('display');
            if (aIsScreen && !bIsScreen) return -1;
            if (!aIsScreen && bIsScreen) return 1;
            return 0;
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
