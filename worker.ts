// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as handler } from './.open-next/worker.js';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};
