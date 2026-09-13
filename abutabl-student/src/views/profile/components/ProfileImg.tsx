import { useState, useEffect } from 'react';
import badge from 'assets/images/png/badge.png';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import { theme } from 'global-styles';
import { useIntl } from 'react-intl';
import { getRequest } from 'lib/requests';

function ProfileImg() {
	const { formatMessage } = useIntl();
	const [profile, setProfile] = useState<{ name?: string; code?: string; photo?: string | null } | null>(null);

	useEffect(() => {
		getRequest('profile')
			.then((res: { data?: { profile?: Record<string, unknown> }; profile?: Record<string, unknown> }) => {
				const p = res?.data?.profile ?? res?.profile ?? null;
				if (p) {
					const code = (p.code ?? p.memberShip ?? p.username ?? '') as string;
					setProfile({
						name: (p.name as string) ?? '',
						code: String(code),
						photo: p.photo ? String(p.photo) : null,
					});
				}
			})
			.catch(() => {});
	}, []);

	const userInfo = (() => {
		try {
			const raw = localStorage.getItem('user_info');
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	})();

	const displayName = profile?.name ?? userInfo?.name ?? '';
	// Prefer login code (user_info.code) so real student code e.g. 428943 is never lost
	const displayCode = userInfo?.code ?? profile?.code ?? '';
	const photoSrc = resolveStudentAvatarSrc({ photoUrl: profile?.photo });

	return (
		<div className="p-8 flex gap-6 flex-col justify-start items-center">
			<div className="w-[120px] h-[120px] flex justify-center relative items-center">
				<img
					className="absolute w-10 bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 tra"
					src={badge}
					alt="badge"
				/>
				<img src={photoSrc} alt="avatar" className="w-[120]" />
			</div>
			<div>
				<h3 className="text-[20px]" style={{ fontFamily: `${theme.fonts.CommicBold}` }}>
					{displayName}
				</h3>
				<p className={`text-sm text-[#9C9B9B] `}>
					{formatMessage({ id: 'Student-Code' })}: {displayCode || '—'}
				</p>
			</div>
		</div>
	);
}

export default ProfileImg;
