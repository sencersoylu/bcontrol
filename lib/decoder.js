const { ANALOG, READ } = require('./registerMap');
const MSGS = require('./messages');

const toInt16 = (u) => (u & 0x8000 ? u - 0x10000 : u);

// Combine two 16-bit words into a 32-bit unsigned. Gateways differ on word order,
// so wordSwap lets you flip it without touching the rest of the code.
function toUint32(hi, lo, wordSwap = false) {
  return wordSwap ? ((lo << 16) >>> 0) + hi : ((hi << 16) >>> 0) + lo;
}

// regs: raw array starting at READ.analog.start (reg 0). Returns { key: {value,unit,label} }.
function decodeAnalog(regs, { wordSwap = false } = {}) {
  const base = READ.analog.start;
  const out = {};
  for (const d of ANALOG) {
    const i = d.reg - base;
    let raw;
    if (d.type === 'int16') raw = toInt16(regs[i]);
    else if (d.type === 'uint16') raw = regs[i];
    else if (d.type === 'uint32') raw = toUint32(regs[i], regs[i + 1], wordSwap);
    const value = d.type === 'uint32' ? raw : +(raw * d.scale).toFixed(6);
    out[d.key] = { value, unit: d.unit, label: d.label };
  }
  return out;
}

// regs: raw array starting at READ.status.start (reg 50). Returns list of ACTIVE messages.
function decodeStatus(regs, { profile = 'COMP' } = {}) {
  const table = MSGS[profile] || MSGS.COMP;
  const active = [];
  for (let r = 0; r < regs.length; r++) {
    const word = regs[r];
    if (!word) continue;
    for (let b = 0; b < 16; b++) {
      if (!(word & (1 << b))) continue;
      const bitIndex = r * 16 + b; // == document "total message no"
      const m = table[bitIndex];
      if (m && m.inUse !== false) {
        active.push({ no: bitIndex, reg: m.reg, bit: m.bit, typ: m.typ, en: m.en, de: m.de });
      } else {
        active.push({ no: bitIndex, reg: 50 + r, bit: b, typ: 'unknown', en: `Undefined bit ${bitIndex}`, de: '' });
      }
    }
  }
  return {
    operating: active.filter((m) => m.typ === 'operation'),
    failures:  active.filter((m) => m.typ === 'failure'),
    warnings:  active.filter((m) => m.typ === 'warning'),
    other:     active.filter((m) => m.typ === 'unknown'),
  };
}

module.exports = { decodeAnalog, decodeStatus, toInt16, toUint32 };
