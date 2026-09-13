import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { resolveStudentAvatarSrc } from 'lib/studentAvatar';
import type { ProfileIdentity } from '../profileUtils';
import type { ProfilePanel } from '../types';

const PROGRESS_ICON = figmaProfileAssetUrl('progress-icon.png');
const EDIT_ICON = figmaProfileAssetUrl('edit-icon.png');
const LOCK_ICON = figmaProfileAssetUrl('lock-icon.png');
const LOGOUT_ICON = figmaProfileAssetUrl('logout-icon.png');
const LOGOUT_RED = '#BA0C12';

const Aside = styled.aside`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 28px 20px 24px;
	background: ${theme.colours.white};
	min-height: 100%;
`;

const Identity = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	margin-bottom: 28px;
`;

const Avatar = styled.img`
	width: 96px;
	height: 96px;
	border-radius: 50%;
	object-fit: cover;
	display: block;
`;

const StudentName = styled.h2`
	margin: 14px 0 4px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 28px;
	line-height: 1.2;
	color: #1f1e1e;
`;

const StudentCode = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	color: #9c9b9b;
`;

const NavList = styled.nav`
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1;
`;

const LogoutSection = styled.div`
	margin-top: auto;
	padding-top: 8px;
`;

const NavDivider = styled.hr`
	width: 100%;
	height: 0;
	margin: 8px 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`;

const SIDEBAR_ICON_SIZE = 22;
const SIDEBAR_ACTION_ICON_SIZE = 40;

const NavIcon = styled.img<{ $active?: boolean; $danger?: boolean; $emphasized?: boolean }>`
	width: ${({ $emphasized }) => ($emphasized ? SIDEBAR_ACTION_ICON_SIZE : SIDEBAR_ICON_SIZE)}px;
	height: ${({ $emphasized }) => ($emphasized ? SIDEBAR_ACTION_ICON_SIZE : SIDEBAR_ICON_SIZE)}px;
	object-fit: contain;
	flex-shrink: 0;
	opacity: ${({ $active, $danger }) => ($danger || $active ? 1 : 0.72)};
`;

const NavButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	border: 0;
	background: transparent;
	padding: 12px 8px;
	border-radius: 10px;
	cursor: pointer;
	text-align: start;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	color: ${({ $active, $danger }) =>
		$danger ? LOGOUT_RED : $active ? theme.colours.LightSeaGreen : '#1f1e1e'};
`;

type Props = {
	identity: ProfileIdentity;
	active: ProfilePanel;
	onSelectPanel: (panel: ProfilePanel) => void;
	onLogout: () => void;
};

export default function ProfileSidebar({
	identity,
	active,
	onSelectPanel,
	onLogout,
}: Props) {
	const { formatMessage } = useIntl();
	const avatarSrc = resolveStudentAvatarSrc({ photoUrl: identity.photo });

	return (
		<Aside>
			<Identity>
				<Avatar src={avatarSrc} alt="" />
				<StudentName>{identity.name || '—'}</StudentName>
				<StudentCode>
					{formatMessage({ id: 'Student-Code' })}: {identity.code || '—'}
				</StudentCode>
			</Identity>

			<NavList>
				<NavButton
					type="button"
					$active={active === 'progress'}
					onClick={() => onSelectPanel('progress')}
				>
					<NavIcon src={PROGRESS_ICON} alt="" $active={active === 'progress'} />
					{formatMessage({ id: 'My-Progress' })}
				</NavButton>
				<NavButton
					type="button"
					$active={active === 'assignments'}
					onClick={() => onSelectPanel('assignments')}
				>
					<NavIcon src={PROGRESS_ICON} alt="" $active={active === 'assignments'} />
					{formatMessage({ id: 'My-assignments' })}
				</NavButton>
				<NavDivider aria-hidden />
				<NavButton
					type="button"
					$active={active === 'edit'}
					onClick={() => onSelectPanel('edit')}
				>
					<NavIcon src={EDIT_ICON} alt="" $active={active === 'edit'} $emphasized />
					{formatMessage({ id: 'Edit-profile' })}
				</NavButton>
				<NavButton
					type="button"
					$active={active === 'password'}
					onClick={() => onSelectPanel('password')}
				>
					<NavIcon src={LOCK_ICON} alt="" $active={active === 'password'} $emphasized />
					{formatMessage({ id: 'Change-password' })}
				</NavButton>
			</NavList>

			<LogoutSection>
				<NavDivider aria-hidden />
				<NavButton type="button" $danger onClick={onLogout}>
					<NavIcon src={LOGOUT_ICON} alt="" $danger $emphasized />
					{formatMessage({ id: 'Logout' })}
				</NavButton>
			</LogoutSection>
		</Aside>
	);
}
