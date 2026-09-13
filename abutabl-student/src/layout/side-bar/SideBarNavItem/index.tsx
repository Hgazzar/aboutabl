import { Link, useLocation } from 'react-router-dom';
import { figmaSidebarIconUrl } from 'config/figmaAssets';
import { isShellNavActive, isShellNavNavigable, type ShellNavItem } from 'config/studentShellNav';
import { useIntl } from 'react-intl';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import { useSetRecoilState } from 'recoil';
import { NavItem } from '../styles';

type Props = {
	item: ShellNavItem;
};

export default function SideBarNavItem({ item }: Props) {
	const { formatMessage } = useIntl();
	const { pathname } = useLocation();
	const setSidebarOpen = useSetRecoilState(isSideBarOpenAtom);
	const active = isShellNavActive(item, pathname);
	const iconFile = active ? item.activeIconFile : item.iconFile;
	const label = formatMessage({ id: item.labelKey });
	const icon = <img src={figmaSidebarIconUrl(iconFile)} alt="" className="nav-icon" />;

	if (!isShellNavNavigable(item)) {
		return (
			<NavItem>
				<span aria-label={label} aria-disabled="true">
					{icon}
				</span>
			</NavItem>
		);
	}

	return (
		<NavItem>
			<Link
				to={item.path}
				onClick={() => setSidebarOpen(false)}
				aria-label={label}
				aria-current={active ? 'page' : undefined}
			>
				{icon}
			</Link>
		</NavItem>
	);
}
