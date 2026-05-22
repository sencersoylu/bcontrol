# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm test                          # runs lib/decoder.js against fixed fixtures, exits non-zero on failure
npm run sim                        # fake gateway on :502 — run in its own terminal
GW_HOST=127.0.0.1 npm start        # bridge against the simulator
GW_HOST=192.168.1.50 npm start     # bridge against the real gateway
```

There is no lint step and no test runner — `npm test` is a plain `node` script (`test/decode.test.js`) with a single test file. To add a test, append assertions to that file; there is no per-test selection.

## Architecture

A one-process bridge: it polls a Modbus TCP gateway and rebroadcasts decoded telemetry over socket.io. Data flows one direction for reads, the reverse for control:

```
gateway :502 ──FC3──> modbusClient ──> decoder ──> server.js ──socket.io──> client
client ──'control'──> server.js ──> modbusClient ──FC6──> gateway reg 80
```

- **`server.js`** — wires `BControlBridge` to socket.io. Caches the last telemetry frame in `last` so a newly-connected client gets state immediately instead of waiting for the next poll.
- **`lib/modbusClient.js`** — owns the Modbus connection, the poll loop, auto-reconnect, and `sendCommand`. The poll loop is re-entrancy guarded (`_busy`) so a slow read never overlaps the next tick. A failed read flips `connected = false` and triggers `_reconnect()`, which retries every `reconnectMs`.
- **`lib/decoder.js`** — pure functions, no I/O. This is what `npm test` exercises. `decodeAnalog` scales raw registers to engineering units; `decodeStatus` walks the 192-bit field and returns only *active* messages, bucketed by `typ`.
- **`lib/registerMap.js`** — the single source of truth for register addresses, types, and scale factors. Change addressing/offsets here, not in the decoder.
- **`lib/messages.js`** — the COMP and BDET status-bit dictionaries, generated from the OC10223723 V4 spec in `docs/`.

## Domain rules that are easy to get wrong

- **Status bit indexing is linear**: global bit `= (reg − 50) × 16 + bitInReg`, which equals the spec's "total message no" and the key into `messages.js`. Don't introduce per-register offsets.
- **Two message profiles.** The *same bit* means different things on a compressor (`PROFILE=COMP`) vs a B-Detection unit (`PROFILE=BDET`). Entries marked `inUse:false` are decoded but treated as undefined.
- **Control writes are pulses**, not levels. `sendCommand` sets `1 << bit` in reg 80, holds `pulseMs`, then writes 0. Only the low byte of reg 80 reaches CAN.
- **Serial number** (reg 9–10) is the only multi-register value (UINT32). 32-bit word order varies by gateway — flip it with `WORD_SWAP=1`, never by editing the decoder.
- **If everything reads 0 or shifted by one**, the gateway uses a different address base — adjust `READ.*.start` in `registerMap.js`.

## Conventions

- CommonJS (`require`/`module.exports`), no build step, Node only — except `public/useBControl.js`, which is an ES-module React/React-Native hook meant to be copied into a client project (not part of the server bundle).
- All configuration is environment variables resolved in `config.js`; nothing else reads `process.env`.
- The decoder must stay I/O-free so `npm test` can run without hardware or a network.
