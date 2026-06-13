import { Button, Divider, Flex } from '@mantine/core';
import Modal from 'components/modal';
import React from 'react';
import { useIntl } from 'react-intl';
import { EditContainer } from '../styles';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from 'redux-toolkit/reducer/LogputReducer';
import type { Ilogin } from 'views/auth/types/login.type';

type LogoutProps = {
	logoutModalOpened: boolean;
	setLogoutModalOpened: React.Dispatch<React.SetStateAction<boolean>>;
};

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
			radius="8px"
			opened={logoutModalOpened}
			onClose={() => setLogoutModalOpened(false)}
			title={formatMessage({ id: 'Logout' })}
			size="xl"
			padding={32}
		>
			<EditContainer>
				<p>{formatMessage({ id: 'Logout-desc' })}</p>
				<Divider mt={32} size="xs" />
				<Flex
					className="action_container"
					direction={{ base: 'column', sm: 'row' }}
					gap={22}
					justify={'space-between'}
					align={'center'}
				>
					<Button onClick={handleConfirmLogout}>{formatMessage({ id: 'Logout' })}</Button>
					<Button type="button" onClick={() => setLogoutModalOpened(false)}>
						{formatMessage({ id: 'Discard' })}
					</Button>
				</Flex>
			</EditContainer>
		</Modal>
	);
}

export default Logout;
