import type { Server } from 'node:http';

import { WebSocketServer } from 'ws';

import { registerWs } from '../router/ws/momotalk/index.js';

export async function withWsServer(app: Server) {
  const wsServer = new WebSocketServer({
    noServer: true,
  });

  wsServer.on('connection', (ws, request) => {
    if (!request.url) {
      return;
    }
    const path = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (path === '/ws/momotalk') {
      registerWs(ws);
    }
  });

  app.on('upgrade', (req, socket, head) => {
    if (!req.url) {
      return;
    }
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (path.startsWith('/ws/')) {
      wsServer.handleUpgrade(req, socket, head, (ws) => {
        wsServer.emit('connection', ws, req);
      });
    }
  });
}
