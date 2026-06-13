import { NavItem } from 'layout/side-bar/styles';
import { Link, useLocation, matchPath } from 'react-router-dom';
import { IRoute } from 'routes';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import { useSetRecoilState } from 'recoil';

type TProps = {
	routes: IRoute;
	isMenuOpen?: boolean;
	dropdownIcon?: never;
	isDropdownOpen?: never;
	dropdownTitle?: never;
	handleDropdownState?: never;
	dropdownId?: never;
	className?: string;
	count?: number;
};

function SideBarItem({ routes, className, count }: TProps) {
	/* ------------------------------- Global State ------------------------------ */
	const setSidebarOpen = useSetRecoilState(isSideBarOpenAtom);
	const { pathname } = useLocation();



	function isLinkActive(paths: string | string[]): boolean {
		if (Array.isArray(paths)) {
			return paths.some((path) => isLinkActive(path));
		}

		// Check if the pathname includes any item in routes.subLinks
		if (routes.subLinks && routes.subLinks.length > 0) {
			const subLinksMatch = routes.subLinks.map((subLink) => {
				const formattedPath = `/${routes.path}/${subLink}`.replace(/\/+/g, '/');
				return pathname.split("/")[1].includes(formattedPath);
			});

			if (subLinksMatch.includes(true)) {
				return true;
			}
		}

		// console.log(pathname.split("/")[1] == paths, paths, "jjjjjj");
		// console.log(
		// 	matchPath(paths, pathname.split("/")[1]), "jjjjj"
		// );

		return (paths == pathname.split("/")[1]) ? true : false;
	}

	return (
		<NavItem className={className} activeLink={isLinkActive(routes.path)}>
			<Link to={routes.to()} onClick={() => setSidebarOpen(false)}>
				<div>{routes.icon}</div>
				{routes.sidebarTitle && <p>{routes.sidebarTitle()}</p>}
			</Link>
			{count && <span className="count">{count}</span>}
		</NavItem>
	);
}

export default SideBarItem;
