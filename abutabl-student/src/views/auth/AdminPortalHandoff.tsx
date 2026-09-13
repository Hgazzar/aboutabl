import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { getRequest } from 'lib/requests';
import { withDefaultStudentAvatar } from 'lib/studentAvatar';
import LoadingPartially from 'components/loading-partially';

function decodeJwtPayload(token: string): { exp?: number; sub?: string | number } {
	const payloadBase64 = token.split('.')[1];
	const decodedPayload = atob(payloadBase64);
	return JSON.parse(decodedPayload) as { exp?: number; sub?: string | number };
}

/**
 * Admin portal redirects students here after login:
 * `/login/handoff#access_token=<token>&remember=0|1`
 */
export default function AdminPortalHandoff() {
	const navigate = useNavigate();

	useEffect(() => {
		const rawHash = window.location.hash.startsWith('#')
			? window.location.hash.slice(1)
			: window.location.hash;
		const params = new URLSearchParams(rawHash);
		const rawToken = params.get('access_token');
		const remember = params.get('remember') === '1';
		const apiToken = rawToken ? decodeURIComponent(rawToken) : null;

		if (!apiToken) {
			navigate('/login', { replace: true });
			return;
		}

		let payload: { exp?: number; sub?: string | number };
		try {
			payload = decodeJwtPayload(apiToken);
		} catch {
			navigate('/login', { replace: true });
			return;
		}

		const cookieOpts = remember ? { expires: 7 } : {};
		Cookies.set('token_', apiToken, cookieOpts);
		Cookies.set('expiration', String((payload.exp ?? 0) * 1000), cookieOpts);
		const sub = payload.sub != null ? String(payload.sub) : '';
		if (sub) {
			Cookies.set('abotable_id', sub, cookieOpts);
		}

		getRequest('profile')
			.then((res: { data?: { profile?: Record<string, unknown> }; profile?: Record<string, unknown> }) => {
				const profile = (res?.data?.profile ?? res?.profile) as Record<string, unknown> | null | undefined;
				if (!profile || profile.id == null) {
					throw new Error('profile');
				}
				const id = String(profile.id);
				const code = (profile.code ?? profile.memberShip ?? '') as string;
				Cookies.set('username', String(profile.name ?? code ?? ''), cookieOpts);
				Cookies.set('abotable_id', id, cookieOpts);

				localStorage.setItem(
					'user_info',
					JSON.stringify(
						withDefaultStudentAvatar({
						id: profile.id,
						name: profile.name,
						code,
						username: (profile.phone ?? profile.code ?? '') as string,
						verify: 1,
						api_token: apiToken,
						school_id: profile.school_id,
						school_name: profile.school_name,
						grade_id: profile.grade_id,
						grade_name: profile.grade_name,
						class_id: profile.class_id,
						class_name: profile.class_name,
						photo: profile.photo ?? null,
						name_ar: profile.name_ar,
						avatar_preset: profile.avatar_preset ?? null,
						needs_avatar_selection: profile.needs_avatar_selection === true,
					})
					)
				);

				window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
				const needsAvatar = profile.needs_avatar_selection === true;
				navigate(needsAvatar ? '/onboarding/avatar' : '/learn', { replace: true });
			})
			.catch(() => {
				Cookies.remove('token_');
				Cookies.remove('username');
				Cookies.remove('abotable_id');
				Cookies.remove('expiration');
				localStorage.removeItem('user_info');
				navigate('/login', { replace: true });
			});
	}, [navigate]);

	return (
		<div className="flex justify-center items-center min-h-[50vh]">
			<LoadingPartially />
		</div>
	);
}
