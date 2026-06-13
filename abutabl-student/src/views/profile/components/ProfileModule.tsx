import Cookies from 'js-cookie';
import { types } from './../types';
import { langState } from 'store';
import { useRecoilValue } from 'recoil';

type modalTypes = 'editProfile' | 'changePassword';

type ProfileModuleProps = {
	icon: string;
	type?: types;
	title: string;
	setActive?: React.Dispatch<React.SetStateAction<types>>;
	active: types;
	open?: (type: modalTypes) => void;
	setPasswordModalOpened?: React.Dispatch<React.SetStateAction<boolean>>;
	setLogoutModalOpened?: React.Dispatch<React.SetStateAction<boolean>>;
};

function ProfileModule({
	icon,
	type,
	title,
	setActive,
	active,
	open,
	setPasswordModalOpened,
	setLogoutModalOpened,
}: ProfileModuleProps) {
	const langType = useRecoilValue(langState);

	const handleModuleClick = () => {
		if (setActive) {
			if (type == 'progress') setActive('progress');
			else if (type == 'assignments') setActive('assignments');
			else if (type == 'certificates') setActive('certificates');
		}
		if (open) {
			if (type == 'edit') open('editProfile');
		}
		if (setPasswordModalOpened) {
			if (type == 'password') setPasswordModalOpened(true);
		}
		if (setLogoutModalOpened) {
			if (type == 'logout') setLogoutModalOpened(true);
		}
	};
	return (
		<button
			onClick={handleModuleClick}
			className={`px-8 hover:bg-[#f3fffa] py-6 flex gap-4 transition-background ${
				(type == 'progress' || type == 'assignments' || type == 'certificates') && type == active
					? langType == 'en'
						? 'border-l-4 border-l-LightSeaGreen bg-[#f3fffa]'
						: 'border-r-4 border-r-LightSeaGreen bg-[#f3fffa]'
					: ''
			}`}
		>
			<img src={icon} alt="icon" />
			<p className={`${type == 'logout' ? 'text-warm-red' : ''}`}>{title}</p>
		</button>
	);
}

export default ProfileModule;
