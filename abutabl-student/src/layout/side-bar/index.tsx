import { SectionsWrapper, SideBarWrapper } from './styles';
import SideBarInfoSection from './SideBarInfo';
import SideBarLinksSection from './SideBarLinks';
import SideBarHelpersAction from './SideBarHelpersAction';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import { useRecoilValue } from 'recoil';

export default function SideBar() {
	/* ---------------------------------- Hooks --------------------------------- */

	/* ------------------------------- Global State ------------------------------ */
	const isSideBarOpen = useRecoilValue(isSideBarOpenAtom);

	return (
		<SideBarWrapper className={`${isSideBarOpen ? 'open' : 'close'}`}>
			<SectionsWrapper className={`${isSideBarOpen ? 'open' : 'close'}`}>
				<SideBarInfoSection />
				<SideBarLinksSection />
				<SideBarHelpersAction />
			</SectionsWrapper>
		</SideBarWrapper>
	);
}
