declare module 'cloudflare:workers' {
  export class DurableObject {
    protected readonly ctx: any;
    protected readonly env: any;
    constructor(ctx: any, env: any);
  }
}

interface WebSocket {
  serializeAttachment?(value: unknown): void;
  deserializeAttachment?(): unknown;
}

interface ResponseInit {
  webSocket?: WebSocket;
}
