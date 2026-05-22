module.exports = {
  // Modbus TCP gateway (B-Control Micro +NET gateway)
  // Real gateway: 192.168.3.65 / 255.255.255.0 / gw 192.168.3.1.
  // Use GW_HOST=127.0.0.1 to run against the simulator instead.
  host: process.env.GW_HOST || '192.168.3.65',
  port: +(process.env.GW_PORT || 502),
  unitId: +(process.env.GW_UNIT || 1),     // default slave address = 1
  timeout: +(process.env.GW_TIMEOUT || 1000),

  // Polling
  pollMs: +(process.env.POLL_MS || 1000),
  reconnectMs: +(process.env.RECONNECT_MS || 3000),
  pulseMs: +(process.env.PULSE_MS || 400), // ON/OFF/RESET pulse hold time

  // Decode options
  profile: process.env.PROFILE || 'COMP',  // 'COMP' or 'BDET'
  wordSwap: process.env.WORD_SWAP === '1', // flip 32-bit word order if serial number looks wrong

  // socket.io server
  wsPort: +(process.env.WS_PORT || 3001),
};
