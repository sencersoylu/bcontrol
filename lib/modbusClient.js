const ModbusRTU = require('modbus-serial');
const { READ, CONTROL } = require('./registerMap');
const { decodeAnalog, decodeStatus } = require('./decoder');

class BControlBridge {
  constructor(cfg) {
    this.cfg = cfg;
    this.client = new ModbusRTU();
    this.connected = false;
    this._timer = null;
    this._busy = false;
  }

  async connect() {
    await this.client.connectTCP(this.cfg.host, { port: this.cfg.port });
    this.client.setID(this.cfg.unitId);
    this.client.setTimeout(this.cfg.timeout);
    this.connected = true;
  }

  // One full read cycle. Reads analog + status blocks and decodes both.
  async readAll() {
    const a = await this.client.readHoldingRegisters(READ.analog.start, READ.analog.count);
    const s = await this.client.readHoldingRegisters(READ.status.start, READ.status.count);
    return {
      ts: Date.now(),
      analog: decodeAnalog(a.data, { wordSwap: this.cfg.wordSwap }),
      status: decodeStatus(s.data, { profile: this.cfg.profile }),
    };
  }

  startPolling(onData, onError) {
    const tick = async () => {
      if (this._busy || !this.connected) return;
      this._busy = true;
      try {
        onData(await this.readAll());
      } catch (e) {
        this.connected = false;
        onError && onError(e);
        this._reconnect();
      } finally {
        this._busy = false;
      }
    };
    this._timer = setInterval(tick, this.cfg.pollMs);
    tick();
  }

  async _reconnect() {
    try { this.client.close(() => {}); } catch (_) {}
    setTimeout(async () => {
      try { await this.connect(); } catch (_) { this._reconnect(); }
    }, this.cfg.reconnectMs);
  }

  // Pulse command: set the bit, hold, then clear. cmd: 'ON' | 'OFF' | 'RESET'.
  async sendCommand(cmd) {
    const bit = CONTROL.bits[cmd];
    if (bit === undefined) throw new Error(`Unknown command: ${cmd}`);
    if (!this.connected) throw new Error('Not connected');
    await this.client.writeRegister(CONTROL.reg, 1 << bit);
    await new Promise((r) => setTimeout(r, this.cfg.pulseMs));
    await this.client.writeRegister(CONTROL.reg, 0);
    return { cmd, bit, reg: CONTROL.reg };
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    try { this.client.close(() => {}); } catch (_) {}
  }
}

module.exports = BControlBridge;
