import { STUDENT_SHELL_NAV } from 'config/studentShellNav';
import { SideBarLinks } from '../styles';
import SideBarNavItem from '../SideBarNavItem';

export default function SideBarLinksSection() {
	return (
		<SideBarLinks>
			{STUDENT_SHELL_NAV.map((item) => (
				<SideBarNavItem key={item.id} item={item} />
			))}
		</SideBarLinks>
	);
}
