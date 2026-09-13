import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

	return {
		plugins: [react(), svgr(), tsconfigPaths()],
		test: {
			environment: 'node',
			include: ['src/**/*.test.ts'],
		},
		server: {
			host: '127.0.0.1',
			port: 5173,
			proxy: {
				// Avoid browser CORS blocks for apiSecret / Authorizations on local dev.
				'/api/student': {
					target: proxyTarget,
					changeOrigin: true,
					configure: (proxy) => {
						proxy.on('error', (err, _req, res) => {
							if (res && 'writeHead' in res && !res.headersSent) {
								res.writeHead(503, { 'Content-Type': 'application/json' });
								res.end(
									JSON.stringify({
										status: false,
										errNum: 'E503',
										msg: 'Local API server is not running. Start: cd abutabl-backend && php artisan serve --host=127.0.0.1 --port=8000',
									})
								);
							}
							console.error('[vite proxy] /api/student → backend unavailable:', err.message);
						});
					},
				},
				// Staff login from the shared Welcome Back form (student SPA → admin-api).
				'/api/login': {
					target: proxyTarget,
					changeOrigin: true,
				},
				// Assignment materials / my-work public disk files (same-origin for <img>/<audio>).
				'/storage': {
					target: proxyTarget,
					changeOrigin: true,
				},
			},
		},
		preview: {
			proxy: {
				'/api/student': {
					target: proxyTarget,
					changeOrigin: true,
				},
				'/api/login': {
					target: proxyTarget,
					changeOrigin: true,
				},
				'/storage': {
					target: proxyTarget,
					changeOrigin: true,
				},
			},
		},
	};
});
