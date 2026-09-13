import axios from 'axios';

const apiSecret = import.meta.env.VITE_API_SECRET ?? 'OASzRok654E0AJ20KH';

export type StaffLoginResult =
	| {
			kind: 'staff';
			token: string;
			username: string;
			userId: string | number;
			type: string;
	  }
	| { kind: 'student'; token: string; user: Record<string, unknown> }
	| { kind: 'failed'; message: string };

/**
 * Try admin-api login with the same identifier the student form uses as `code`.
 * Admin backend may return `portal: "student"` (existing SSO path) or a staff user.
 */
export async function attemptStaffOrSsoLogin(args: {
	identifier: string;
	password: string;
	remember?: boolean;
}): Promise<StaffLoginResult> {
	try {
		const { data } = await axios.post(
			'/api/login',
			{
				username: args.identifier,
				password: args.password,
				remember: Boolean(args.remember),
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					apiSecret,
				},
				timeout: 20000,
			}
		);

		if (!data?.status) {
			return { kind: 'failed', message: data?.msg || 'Login failed' };
		}

		if (data.portal === 'student' && data.user?.api_token) {
			return { kind: 'student', token: data.user.api_token, user: data.user };
		}

		const token = data.user?.api_token;
		if (!token) {
			return { kind: 'failed', message: data?.msg || 'Login failed' };
		}

		return {
			kind: 'staff',
			token,
			username: data.user?.username ?? args.identifier,
			userId: data.user?.id ?? '',
			type: data.user?.type ?? 'admin',
		};
	} catch (error: any) {
		const message =
			error?.response?.data?.msg ||
			error?.message ||
			'Login failed. Check your connection and try again.';
		return { kind: 'failed', message };
	}
}

export function adminAppBaseUrl(): string {
	return (import.meta.env.VITE_ADMIN_APP_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
}

/** Redirect staff into the admin SPA with a one-time hash handoff. */
export function redirectStaffToAdminApp(args: {
	token: string;
	remember?: boolean;
	username?: string;
	userId?: string | number;
	type?: string;
}): void {
	const params = new URLSearchParams();
	params.set('access_token', args.token);
	params.set('remember', args.remember ? '1' : '0');
	if (args.username) params.set('username', String(args.username));
	if (args.userId != null && args.userId !== '') {
		params.set('user_id', String(args.userId));
	}
	if (args.type) params.set('type', String(args.type));

	window.location.assign(`${adminAppBaseUrl()}/#${params.toString()}`);
}
