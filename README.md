# B-Control Bridge

Modbus TCP ↔ socket.io bridge for the **Bauer B-Control Micro +NET** controller
(register map OC10223723 V4). Node.js reads the gateway over Modbus TCP, decodes the
analog values and the 192-bit status field, and streams clean JSON to any React /
React Native client over socket.io. Control commands (ON / OFF / RESET) flow back the
same way and are written as pulses to register 80.

```
Gateway (Modbus TCP :502) ── modbus-serial ──> Node ── socket.io ──> React / CoralFlow
```

## Run

```bash
npm install

# 1) test the decoder (no hardware)
npm test

# 2) run against the simulator (no hardware)
npm run sim                 # terminal A — fake gateway on :502
GW_HOST=127.0.0.1 npm start # terminal B — bridge on :3001

# 3) run against the real gateway (default host is already 192.168.3.65)
npm start
# or override: GW_HOST=192.168.3.65 GW_PORT=502 GW_UNIT=1 npm start
```

## Config (env vars, see `config.js`)

| Var | Default | Notes |
|-----|---------|-------|
| `GW_HOST` | 192.168.3.65 | gateway IP (use 127.0.0.1 for the simulator) |
| `GW_PORT` | 502 | Modbus TCP port |
| `GW_UNIT` | 1 | slave address (gateway default = 1) |
| `POLL_MS` | 1000 | poll interval |
| `PROFILE` | COMP | `COMP` (compressor) or `BDET` (B-Detection) message table |
| `WORD_SWAP` | 0 | set `1` if the serial number reads wrong (32-bit word order) |
| `PULSE_MS` | 400 | ON/OFF/RESET pulse hold time |
| `WS_PORT` | 3001 | socket.io port |

## socket.io API

- `telemetry` (server → client): `{ ts, analog, status }`
  - `analog.<key> = { value, unit, label }` — already scaled (e.g. `finalPressure1.value = 320` bar)
  - `status = { operating[], failures[], warnings[], other[] }`, each item `{ no, reg, bit, typ, en, de }`
- `status` (server → client): `{ connected, profile }`
- `control` (client → server): `{ cmd: 'ON' | 'OFF' | 'RESET' }`, replies via ack `{ ok, cmd, reg }`

React usage: see `public/useBControl.js`.

## Notes from the register map

- **Reads** use FC3 (holding registers). Two blocks: analog `0–19`, status `50–61`.
- **Status decode** is linear: global bit `= (reg − 50) × 16 + bit`, which equals the
  document's "total message no". Bits `0–31` operating, `32–159` error/warning.
- **Serial number** (reg 9–10) is UINT32; everything else is single-register INT16/UINT16.
- **Control** writes FC6 to reg 80, **low byte only** — high byte is not mapped to CAN.
  All three commands are pulses (bridge sets the bit, holds `PULSE_MS`, clears).
- Two message profiles exist; the same bit means different things on a compressor vs a
  B-Detection unit. Pick the right one with `PROFILE`.

> Addressing caveat: some gateways present registers with a 4xxxx offset or 1-based
> numbering. If everything reads as 0 or shifted by one, adjust `READ.*.start` in
> `lib/registerMap.js`.
# bcontrol
