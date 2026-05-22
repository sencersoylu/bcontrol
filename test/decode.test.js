const { decodeAnalog, decodeStatus } = require('../lib/decoder');
const { READ } = require('../lib/registerMap');

const analogRaw = new Array(READ.analog.count).fill(0);
analogRaw[0] = 3200;            // 320.0 bar
analogRaw[2] = 95;             // 0.95 bar
analogRaw[5] = 0xFF88;         // -120 -> -12.0 °C
analogRaw[9] = 0x0001; analogRaw[10] = 0x86A0; // serial 100000
analogRaw[13] = 2095;          // O2 20.95 %

const a = decodeAnalog(analogRaw);
const checks = [
  ['finalPressure1', a.finalPressure1.value, 320],
  ['intakePressure', a.intakePressure.value, 0.95],
  ['dewPoint', a.dewPoint.value, -12],
  ['serialNumber', a.serialNumber.value, 100000],
  ['o2', a.o2.value, 20.95],
];

const statusRaw = new Array(READ.status.count).fill(0);
statusRaw[0] = (1 << 0) | (1 << 3); // reg50: msg 0 + msg 3
statusRaw[4] = (1 << 6);            // reg54: msg 70 (warning)
const s = decodeStatus(statusRaw);

let fail = 0;
for (const [name, got, want] of checks) {
  const ok = Math.abs(got - want) < 1e-6;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${got}, want ${want}`);
}
console.log('operating:', s.operating.map((m) => `${m.no}:${m.en}`).join(' | '));
console.log('warnings :', s.warnings.map((m) => `${m.no}:${m.en}`).join(' | '));

const okStatus = s.operating.length === 2 && s.warnings.length === 1;
console.log(`${okStatus ? 'PASS' : 'FAIL'}  status counts (op=2, warn=1)`);
process.exit(fail || !okStatus ? 1 : 0);
