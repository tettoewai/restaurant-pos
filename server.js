const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/socket.io')) {
      // Let Socket.IO handle it
      return;
    }
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    // Handle order updates
    socket.on('join-order-room', (tableId) => {
      socket.join(`order-${tableId}`);
    });

    socket.on('new-order', (data) => {
      // Broadcast to backoffice
      io.emit('order-update', data);
    });

    socket.on('order-status-update', (data) => {
      // Broadcast to specific table room
      io.to(`order-${data.tableId}`).emit('order-status-changed', data);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});