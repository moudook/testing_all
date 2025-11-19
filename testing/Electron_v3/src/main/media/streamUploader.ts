export class StreamUploader {
  private ws: WebSocket | null = null;
  private type: 'screen' | 'mic' | 'system';
  private url: string;

  constructor(type: 'screen' | 'mic' | 'system') {
    this.type = type;
    this.url = `ws://localhost:8000/stream/upload/${type}`;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => console.log(`[StreamUploader] ${this.type} connected`);
    this.ws.onerror = (e) => console.error(`[StreamUploader] ${this.type} error`, e);
  }

  uploadChunk(chunk: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
