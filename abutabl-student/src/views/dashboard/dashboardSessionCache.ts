import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import type { DashboardPayload } from 'lib/dashboardApi';

type DashboardCacheEntry = {
	studentId: string;
	payload: DashboardPayload;
};

let cache: DashboardCacheEntry | null = null;

function readUserInfoStudentId(): string | null {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) {
			return null;
		}

		const user = JSON.parse(raw) as { id?: number | string };
		if (user?.id === undefined || user?.id === null) {
			return null;
		}

		const id = String(user.id).trim();
		return id.length > 0 ? id : null;
	} catch {
		return null;
	}
}

function readTokenStudentSub(): string | null {
	try {
		const token = Cookies.get('token_');
		if (!token) {
			return null;
		}

		const decoded = jwtDecode<{ sub?: string | number }>(token);
		if (decoded.sub === undefined || decoded.sub === null) {
			return null;
		}

		const id = String(decoded.sub).trim();
		return id.length > 0 ? id : null;
	} catch {
		return null;
	}
}

/**
 * Resolves the active student id from existing session artifacts.
 * All available sources must agree; any mismatch returns null (no cache use).
 */
export function resolveSessionStudentId(): string | null {
	const candidates = [
		Cookies.get('abotable_id')?.trim() || null,
		readUserInfoStudentId(),
		readTokenStudentSub(),
	].filter((id): id is string => Boolean(id));

	if (candidates.length === 0) {
		return null;
	}

	const unique = new Set(candidates);
	if (unique.size > 1) {
		return null;
	}

	return candidates[0];
}

export function readDashboardSessionCache(): DashboardPayload | null {
	const studentId = resolveSessionStudentId();
	if (!studentId || !cache || cache.studentId !== studentId) {
		return null;
	}

	return cache.payload;
}

export function writeDashboardSessionCache(payload: DashboardPayload): void {
	const sessionStudentId = resolveSessionStudentId();
	const payloadStudentId = String(payload.student.id);

	if (!sessionStudentId || sessionStudentId !== payloadStudentId) {
		return;
	}

	cache = {
		studentId: sessionStudentId,
		payload,
	};
}

export function clearDashboardSessionCache(): void {
	cache = null;
}
