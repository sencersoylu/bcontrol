const http = require('http');
const { Server } = require('socket.io');
const cfg = require('./config');
const BControlBridge = require('./lib/modbusClient');

const server = http.createServer();
// allowEIO3 lets Engine.IO v3 clients (socket.io-client 2.x, e.g. MY_APP) connect
// to this 4.x server alongside modern 4.x clients.
const io = new Server(server, { cors: { origin: '*' }, allowEIO3: true });

const bridge = new BControlBridge(cfg);
let last = null; // cache so a fresh client gets state immediately

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.emit('status', { connected: bridge.connected, profile: cfg.profile });
  if (last) socket.emit('telemetry', last);

  // Control command from frontend: { cmd: 'ON' | 'OFF' | 'RESET' }
  socket.on('control', async ({ cmd } = {}, ack) => {
    try {
      const res = await bridge.sendCommand(cmd);
      console.log(`[ctrl] ${cmd} -> reg ${res.reg}`);
      ack && ack({ ok: true, ...res });
    } catch (e) {
      ack && ack({ ok: false, error: e.message });
    }
  });
});

async function main() {
  try {
    await bridge.connect();
    console.log(`[modbus] connected to ${cfg.host}:${cfg.port} (unit ${cfg.unitId}, profile ${cfg.profile})`);
  } catch (e) {
    console.error('[modbus] initial connect failed, will retry:', e.message);
  }

  bridge.startPolling(
    (data) => { last = data; io.emit('telemetry', data); },
    (err) => { console.error('[modbus] read error:', err.message); io.emit('status', { connected: false }); }
  );

  server.listen(cfg.wsPort, () => console.log(`[ws] socket.io on :${cfg.wsPort}`));
}

main();

process.on('SIGINT', () => { bridge.stop(); process.exit(0); });
