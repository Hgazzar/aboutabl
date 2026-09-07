/**
 * Helpers for Laravel GeneralTrait JSON: { status, errNum, msg, [key]: payload }.
 */

type GeneralTraitBody = {
	status?: boolean;
	errNum?: string;
	msg?: string;
	[key: string]: unknown;
};

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
	if (!error) {
		return fallback;
	}

	if (error instanceof Error && error.message) {
		if (
			import.meta.env.DEV &&
			(error.message.includes('API server unavailable') ||
				error.message.includes('Network Error') ||
				error.message.includes('502'))
		) {
			return 'API server unavailable — start Laravel: cd abutabl-backend && php artisan serve --host=127.0.0.1 --port=8000';
		}

		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (typeof error === 'object') {
		const err = error as {
			msg?: string;
			message?: string;
			data?: { msg?: string; message?: string };
		};

		return (
			err.data?.msg ??
			err.data?.message ??
			err.msg ??
			err.message ??
			fallback
		);
	}

	return fallback;
}

export function parseStudentApiPayload<T>(
	response: unknown,
	key: string,
	fallbackMessage = 'Invalid API response'
): T {
	const body = response as GeneralTraitBody | null | undefined;

	if (!body || typeof body !== 'object') {
		throw new Error(fallbackMessage);
	}

	if (body.status === false) {
		throw new Error(typeof body.msg === 'string' && body.msg ? body.msg : fallbackMessage);
	}

	const nested = body.data;
	const fromNested =
		nested && typeof nested === 'object' && !Array.isArray(nested)
			? (nested as Record<string, unknown>)[key]
			: undefined;

	const payload = fromNested ?? body[key];

	if (payload === undefined || payload === null) {
		throw new Error(fallbackMessage);
	}

	return payload as T;
}
