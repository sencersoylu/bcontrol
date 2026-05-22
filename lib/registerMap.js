// Analog values — Modbus FC3 (Holding Registers), from OC10223723 V4.
// type: how to interpret the raw register(s). scale: multiply raw by this to get the engineering value.
// span: how many 16-bit registers the value occupies (2 for UINT32).

const ANALOG = [
  { reg: 0,  key: 'finalPressure1',  span: 1, type: 'int16',  scale: 0.1,   unit: 'bar',    label: 'Final pressure 1' },
  { reg: 1,  key: 'finalPressure2',  span: 1, type: 'int16',  scale: 0.1,   unit: 'bar',    label: 'Final pressure 2' },
  { reg: 2,  key: 'intakePressure',  span: 1, type: 'int16',  scale: 0.01,  unit: 'bar',    label: 'Intake pressure' },
  { reg: 3,  key: 'oilPressure',     span: 1, type: 'int16',  scale: 0.01,  unit: 'bar',    label: 'Oil pressure' },
  { reg: 4,  key: 'crankcasePress',  span: 1, type: 'int16',  scale: 0.001, unit: 'bar',    label: 'Blow down / crankcase pressure' },
  { reg: 5,  key: 'dewPoint',        span: 1, type: 'int16',  scale: 0.1,   unit: '°C',     label: 'Pressure dew point' },
  { reg: 6,  key: 'gasBalloonLevel', span: 1, type: 'int16',  scale: 0.1,   unit: '%',      label: 'Level gas balloon' },
  { reg: 7,  key: 'coolingAirTemp',  span: 1, type: 'int16',  scale: 0.1,   unit: '°C',     label: 'Cooling air temperature' },
  { reg: 8,  key: 'lastStageTemp',   span: 1, type: 'int16',  scale: 0.1,   unit: '°C',     label: 'Last stage temperature' },
  { reg: 9,  key: 'serialNumber',    span: 2, type: 'uint32', scale: 1,     unit: '',       label: 'Serial number' },
  { reg: 11, key: 'operatingHours',  span: 1, type: 'uint16', scale: 1,     unit: 'h',      label: 'Operating hours' },
  { reg: 12, key: 'co2',             span: 1, type: 'int16',  scale: 0.1,   unit: 'ppm',    label: 'CO2' },
  { reg: 13, key: 'o2',              span: 1, type: 'int16',  scale: 0.01,  unit: '%',      label: 'O2' },
  { reg: 14, key: 'co',              span: 1, type: 'int16',  scale: 0.01,  unit: 'ppm',    label: 'CO' },
  { reg: 15, key: 'humidity',        span: 1, type: 'int16',  scale: 0.1,   unit: 'mg/m³',  label: 'Humidity' },
  { reg: 16, key: 'voc',             span: 1, type: 'int16',  scale: 0.01,  unit: 'mg/m³',  label: 'VOC' },
  { reg: 17, key: 'spare1',          span: 1, type: 'int16',  scale: 1,     unit: '',       label: 'Spare 1' },
  { reg: 18, key: 'spare2',          span: 1, type: 'int16',  scale: 1,     unit: '',       label: 'Spare 2' },
  { reg: 19, key: 'spare3',          span: 1, type: 'int16',  scale: 1,     unit: '',       label: 'Spare 3' },
];

// Read blocks (start, count) for FC3. Analog 0..19, status bitfield 50..61.
const READ = {
  analog:  { start: 0,  count: 20 },   // regs 0-19
  status:  { start: 50, count: 12 },   // regs 50-61 -> 192 bits
};

// Control — FC6 write single register. Only the LOW byte is mapped to CAN.
const CONTROL = {
  reg: 80,
  bits: { ON: 0, OFF: 1, RESET: 2 }, // all pulse commands
};

module.exports = { ANALOG, READ, CONTROL };
