import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Cookies from 'js-cookie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Pusher = Pusher;

function broadcastingRootUrl(): string {
	const base = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');
	return base.replace(/\/api\/student\/?$/, '').replace(/\/api\/?$/, '');
}

export function createStudentEcho() {
	const root = broadcastingRootUrl();

	return new Echo({
		broadcaster: 'pusher',
		key: import.meta.env.VITE_PUSHER_APP_KEY || '',
		cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
		wsHost: import.meta.env.VITE_PUSHER_HOST || '127.0.0.1',
		wsPort: Number(import.meta.env.VITE_PUSHER_PORT || 6001),
		wssPort: Number(import.meta.env.VITE_PUSHER_PORT || 6001),
		forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
		encrypted: import.meta.env.VITE_PUSHER_SCHEME === 'https',
		disableStats: true,
		enabledTransports: ['ws', 'wss'],
		authEndpoint: `${root}/broadcasting/auth`,
		auth: {
			headers: {
				apiSecret: import.meta.env.VITE_API_SECRET || '',
				Authorizations: `Bearer ${Cookies.get('token_') || ''}`,
			},
		},
	});
}
