// Fake B-Control gateway so you can run server.js without real hardware.
//   node sim/modbusServer.js   (listens on 502; use GW_HOST=127.0.0.1 for the bridge)
const ModbusRTU = require('modbus-serial');

const holding = new Array(128).fill(0);

// Plausible analog values (raw, i.e. already scaled-up integers)
holding[0] = 3200;   // final pressure 1 -> 320.0 bar
holding[1] = 3198;   // final pressure 2 -> 319.8 bar
holding[2] = 95;     // intake -> 0.95 bar
holding[3] = 450;    // oil -> 4.50 bar
holding[5] = -120;   // dew point -> -12.0 °C  (stored as uint16 two's complement)
holding[7] = 285;    // cooling air -> 28.5 °C
holding[8] = 1420;   // last stage -> 142.0 °C
holding[9] = 0x0001; holding[10] = 0x86A0; // serial 0x000186A0 = 100000
holding[11] = 4827;  // operating hours
holding[12] = 4200;  // CO2 -> 420.0 ppm
holding[13] = 2095;  // O2 -> 20.95 %
holding[14] = 50;    // CO -> 0.50 ppm

// Status bitfield (regs 50-61). Set a few demo bits:
// reg 50 bit0 = msg 0 "Anlage EIN" (operation)
// reg 50 bit3 = msg 3 "compressor on"
holding[50] = (1 << 0) | (1 << 3);
// reg 54 bit6 = msg 70 "Dew point high" (warning)
holding[54] = (1 << 6);

// two's complement fix for negatives
for (let i = 0; i < holding.length; i++) if (holding[i] < 0) holding[i] = holding[i] & 0xffff;

const vector = {
  getHoldingRegister: (addr) => holding[addr] || 0,
  setRegister: (addr, value) => {
    holding[addr] = value;
    if (addr === 80 && value) console.log(`[sim] control write reg80 = 0b${value.toString(2)}`);
  },
};

new ModbusRTU.ServerTCP(vector, { host: '0.0.0.0', port: 502, debug: false }, () =>
  console.log('[sim] fake B-Control gateway on :502')
);
