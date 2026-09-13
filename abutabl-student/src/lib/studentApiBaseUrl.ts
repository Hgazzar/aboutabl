const PRODUCTION_API = 'https://aboutabl.com/api/student';
const LOCAL_API = '/api/student';

/** Local dev uses Vite proxy; production uses configured or canonical host. */
export function resolveStudentApiBaseUrl(): string {
	const configured = import.meta.env.VITE_BASE_URL?.trim();
	if (configured) {
		return configured.replace(/\/+$/, '');
	}

	return import.meta.env.DEV ? LOCAL_API : PRODUCTION_API;
}
