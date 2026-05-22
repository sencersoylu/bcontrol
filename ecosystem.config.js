// PM2 process config for the bcontrol-bridge.
//
//   npm i -g pm2
//   pm2 start ecosystem.config.js
//   pm2 logs bcontrol-bridge
//   pm2 save
//
// Defaults (host 192.168.3.65, port 502, unit 1, COMP profile, :3001) come
// from config.js. Override here per environment if needed.

module.exports = {
	apps: [
		{
			name: 'bcontrol-bridge',
			script: 'server.js',
			cwd: __dirname,
			autorestart: true,
			watch: false,
			max_restarts: 50,
			restart_delay: 3000,
			max_memory_restart: '200M',
			out_file: './logs/bridge.out.log',
			error_file: './logs/bridge.err.log',
			time: true,
			env: {
				NODE_ENV: 'production',
				// Uncomment to override config.js defaults:
				// GW_HOST: '192.168.3.65',
				// GW_PORT: '502',
				// GW_UNIT: '1',
				// PROFILE: 'COMP',        // 'COMP' compressor / 'BDET' B-Detection
				// POLL_MS: '1000',
				// WS_PORT: '3001',
			},
			// Sim profile for hardware-free testing: `pm2 start ecosystem.config.js --only bcontrol-bridge-sim`
			// (the sim itself runs separately: `pm2 start sim/modbusServer.js --name bcontrol-sim`)
		},
	],
};
