import { useIntl } from 'react-intl';
import styled from 'styled-components';
import Modal from 'components/modal';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from 'redux-toolkit/reducer/LogputReducer';
import type { Ilogin } from 'views/auth/types/login.type';

type LogoutProps = {
	logoutModalOpened: boolean;
	setLogoutModalOpened: React.Dispatch<React.SetStateAction<boolean>>;
};

const LOGOUT_ICON = figmaProfileAssetUrl('logout-icon.png');
const LOGOUT_RED = '#BA0C12';
const LOGOUT_RED_DARK = '#950a0f';
const PROFILE_TEAL = '#24b5a0';
const PROFILE_TEAL_DARK = '#1a8878';

const DialogShell = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18px;
	width: min(100%, 380px);
	margin: 0 auto;
`;

const DialogHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const TitleIconWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(186, 12, 18, 0.12);
	flex-shrink: 0;

	img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
`;

const DialogTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 24px;
	line-height: 1.2;
	color: ${LOGOUT_RED};
`;

const DialogMessage = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.55;
	color: #4a4a4a;
`;

const FormDivider = styled.hr`
	width: 100%;
	height: 0;
	margin: 2px 0 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`;

const modalButtonBase = `
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 50px;
	padding: 0 24px;
	border-radius: 16px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease,
		transform 0.1s ease;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}

	&:active {
		transform: translateY(2px);
	}
`;

const ActionStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`;

const LogoutConfirmButton = styled.button`
	${modalButtonBase}
	border: 2px solid ${LOGOUT_RED};
	background: ${LOGOUT_RED};
	color: ${theme.colours.white};
	box-shadow: 0 4px 0 ${LOGOUT_RED_DARK};

	&:hover {
		background: #d10e15;
		border-color: #d10e15;
	}

	&:active {
		box-shadow: 0 2px 0 ${LOGOUT_RED_DARK};
	}
`;

const DiscardButton = styled.button`
	${modalButtonBase}
	border: 2px solid ${PROFILE_TEAL};
	background: ${PROFILE_TEAL};
	color: ${theme.colours.white};
	box-shadow: 0 4px 0 ${PROFILE_TEAL_DARK};

	&:hover {
		background: #28c4ad;
		border-color: #28c4ad;
	}

	&:active {
		box-shadow: 0 2px 0 ${PROFILE_TEAL_DARK};
	}
`;

function Logout({ logoutModalOpened, setLogoutModalOpened }: LogoutProps) {
	const { formatMessage } = useIntl();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const handleConfirmLogout = async () => {
		try {
			await dispatch(logout({ code: 0, password: '' } as Ilogin));
		} catch {
			/* session cleared in logout thunk finally */
		}
		setLogoutModalOpened(false);
		navigate('/login', { replace: true });
	};

	return (
		<Modal
			radius="20px"
			opened={logoutModalOpened}
			onClose={() => setLogoutModalOpened(false)}
			withCloseButton={false}
			size={420}
			padding="32px 28px 28px"
			overlayProps={{ opacity: 0.5, blur: 3 }}
			title={null}
			styles={{
				content: {
					borderRadius: 20,
					boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
				},
				body: {
					paddingTop: 4,
				},
			}}
		>
			<DialogShell>
				<DialogHeader>
					<TitleIconWrap>
						<img src={LOGOUT_ICON} alt="" />
					</TitleIconWrap>
					<DialogTitle>{formatMessage({ id: 'Logout' })}</DialogTitle>
				</DialogHeader>

				<DialogMessage>{formatMessage({ id: 'Logout-desc' })}</DialogMessage>

				<FormDivider aria-hidden />

				<ActionStack>
					<LogoutConfirmButton type="button" onClick={handleConfirmLogout}>
						{formatMessage({ id: 'Logout' })}
					</LogoutConfirmButton>
					<DiscardButton type="button" onClick={() => setLogoutModalOpened(false)}>
						{formatMessage({ id: 'Discard' })}
					</DiscardButton>
				</ActionStack>
			</DialogShell>
		</Modal>
	);
}

export default Logout;
