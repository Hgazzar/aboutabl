import ProfileImg from './ProfileImg';
import studyIcon from 'assets/images/png/icon.png';
import certificateIcon from 'assets/images/svg/certificate.svg';
import editIcon from 'assets/images/png/edit.svg';
import lockIcon from 'assets/images/png/lock.png';
import logoutIcon from 'assets/images/png/logoutIcon.png';
import ProfileModule from './ProfileModule';
import { types } from '../types';
import { useIntl } from 'react-intl';

type ComponentProps = {
	setActive: React.Dispatch<React.SetStateAction<types>>;
	active: types;
	open: () => void;
	setPasswordModalOpened?: React.Dispatch<React.SetStateAction<boolean>>;
	setLogoutModalOpened?: React.Dispatch<React.SetStateAction<boolean>>;
};

function ProfileAside({ setActive, active, open, setPasswordModalOpened, setLogoutModalOpened }: ComponentProps) {
	const { formatMessage } = useIntl();
	return (
		<section className="profile w-1/3 h-full hidden lg:flex flex-col border-[1px] border-[#eee]">
			<ProfileImg />
			<div className="mx-8 mt-6 mb-2">
				<p className="text-[#5F5E5E]">{formatMessage({ id: 'My-study' })}</p>
			</div>
			<ProfileModule
				open={open}
				icon={studyIcon}
				type={'progress'}
				title={formatMessage({ id: 'My-Progress' })}
				setActive={setActive}
				active={active}
			/>
			<ProfileModule
				open={open}
				icon={studyIcon}
				type="assignments"
				title={formatMessage({ id: 'My-assignments' })}
				setActive={setActive}
				active={active}
			/>
			<ProfileModule
				open={open}
				icon={certificateIcon}
				type="certificates"
				title={formatMessage({ id: 'My-certificates' })}
				setActive={setActive}
				active={active}
			/>
			<div className="mx-8 mt-6 mb-2">
				<p className="text-[#5F5E5E]">{formatMessage({ id: 'My-assignments' })}</p>
			</div>
			<ProfileModule
				icon={editIcon}
				type={'edit'}
				title={formatMessage({ id: 'Edit-profile' })}
				setActive={setActive}
				active={active}
				open={open}
			/>
			<ProfileModule
				icon={lockIcon}
				type={'password'}
				title={formatMessage({ id: 'Change-password' })}
				setActive={setActive}
				active={active}
				setPasswordModalOpened={setPasswordModalOpened}
			/>
			<ProfileModule
				icon={logoutIcon}
				type={'logout'}
				title={formatMessage({ id: 'Logout' })}
				setActive={setActive}
				active={active}
				setLogoutModalOpened={setLogoutModalOpened}
			/>
		</section>
	);
}

export default ProfileAside;
