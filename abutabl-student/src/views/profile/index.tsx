import React, { useState } from 'react';
import ProfileAside from './components/ProfileAside';
import Preview from './components/Preview';
import ModuleView from 'components/module-view';
import { types } from './types';
import { useDisclosure } from '@mantine/hooks';
import EditProfile from './components/editProfile/EditProfile';
import ProfileNav from './components/ProfileNav';
import ChangePassword from './components/ChangePassword/ChangePassword';
import PageHeader from './components/pageHeader';
import Logout from './components/logout/Logout';

export default function Profile() {
	const [active, setActive] = useState<types>('progress');
	const [opened, { open, close }] = useDisclosure(false);
	const [passwordModalOpened, setPasswordModalOpened] = useState(false);
	const [logoutModalOpened, setLogoutModalOpened] = useState(false);

	return (
		<>
			<PageHeader />
			<ModuleView>
				<>
					<EditProfile opened={opened} close={close} />
					<ChangePassword passwordModalOpened={passwordModalOpened} setPasswordModalOpened={setPasswordModalOpened} />
					<Logout logoutModalOpened={logoutModalOpened} setLogoutModalOpened={setLogoutModalOpened} />
					<ProfileNav
						active={active}
						setActive={setActive}
						open={open}
						setPasswordModalOpened={setPasswordModalOpened}
						setLogoutModalOpened={setLogoutModalOpened}
					/>
					<div className="flex h-full">
						<ProfileAside
							active={active}
							setActive={setActive}
							open={open}
							setPasswordModalOpened={setPasswordModalOpened}
							setLogoutModalOpened={setLogoutModalOpened}
						/>
						<Preview active={active} setActive={setActive} />
					</div>
				</>
			</ModuleView>
		</>
	);
}
