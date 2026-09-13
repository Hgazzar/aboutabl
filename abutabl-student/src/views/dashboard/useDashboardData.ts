import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { fetchStudentDashboard, type DashboardPayload } from 'lib/dashboardApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import {
	readDashboardSessionCache,
	writeDashboardSessionCache,
} from './dashboardSessionCache';

function isAbortError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}

	const candidate = error as { code?: string; name?: string };
	return (
		candidate.code === 'ERR_CANCELED' ||
		candidate.name === 'CanceledError' ||
		candidate.name === 'AbortError'
	);
}

export function useDashboardData(range = 'week') {
	const { formatMessage } = useIntl();
	const [data, setData] = useState<DashboardPayload | null>(() => readDashboardSessionCache());
	const [initialLoading, setInitialLoading] = useState(() => readDashboardSessionCache() === null);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);

	const load = useCallback(async () => {
		const requestId = ++requestIdRef.current;
		abortRef.current?.abort();

		const controller = new AbortController();
		abortRef.current = controller;

		const hasExistingData = readDashboardSessionCache() !== null;
		if (!hasExistingData) {
			setInitialLoading(true);
		}

		try {
			const payload = await fetchStudentDashboard(range, { signal: controller.signal });

			if (requestId !== requestIdRef.current) {
				return;
			}

			writeDashboardSessionCache(payload);
			setData(payload);
			setError(null);
		} catch (err) {
			if (isAbortError(err) || requestId !== requestIdRef.current) {
				return;
			}

			setError(
				getApiErrorMessage(err, formatMessage({ id: 'dashboard-load-error' }))
			);
		} finally {
			if (requestId === requestIdRef.current) {
				setInitialLoading(false);
			}
		}
	}, [formatMessage, range]);

	useEffect(() => {
		void load();

		return () => {
			abortRef.current?.abort();
		};
	}, [load]);

	const retry = useCallback(() => {
		void load();
	}, [load]);

	return {
		data,
		initialLoading,
		error,
		retry,
	};
}
