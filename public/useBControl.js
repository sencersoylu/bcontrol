// React hook for the bridge. Works in React and React Native (CoralFlow).
//   npm i socket.io-client
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useBControl(url = 'http://localhost:3001') {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState(null); // { ts, analog, status }
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(url, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('telemetry', (data) => setTelemetry(data));
    socket.on('status', (s) => { if (s.connected === false) setConnected(false); });

    return () => socket.disconnect();
  }, [url]);

  // sendCommand('ON' | 'OFF' | 'RESET') -> resolves with ack
  const sendCommand = useCallback(
    (cmd) =>
      new Promise((resolve) => {
        const s = socketRef.current;
        if (!s) return resolve({ ok: false, error: 'no socket' });
        s.emit('control', { cmd }, (ack) => resolve(ack));
      }),
    []
  );

  return { connected, telemetry, sendCommand };
}

/* Usage:

function Panel() {
  const { connected, telemetry, sendCommand } = useBControl();
  if (!telemetry) return <p>Connecting… ({connected ? 'ws up' : 'ws down'})</p>;
  const { analog, status } = telemetry;
  return (
    <div>
      <h3>Final pressure 1: {analog.finalPressure1.value} {analog.finalPressure1.unit}</h3>
      <h3>O2: {analog.o2.value} {analog.o2.unit}</h3>
      {status.failures.map(m => <div key={m.no} style={{color:'red'}}>{m.en}</div>)}
      {status.warnings.map(m => <div key={m.no} style={{color:'orange'}}>{m.en}</div>)}
      <button onClick={() => sendCommand('ON')}>ON</button>
      <button onClick={() => sendCommand('OFF')}>OFF</button>
      <button onClick={() => sendCommand('RESET')}>RESET</button>
    </div>
  );
}
*/
