import { SectionsWrapper, SideBarWrapper } from './styles';
import SideBarLinksSection from './SideBarLinks';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import { useRecoilValue } from 'recoil';

export default function SideBar() {
	const isSideBarOpen = useRecoilValue(isSideBarOpenAtom);

	return (
		<SideBarWrapper className={`${isSideBarOpen ? 'open' : 'close'}`}>
			<SectionsWrapper className={`${isSideBarOpen ? 'open' : 'close'}`}>
				<SideBarLinksSection />
			</SectionsWrapper>
		</SideBarWrapper>
	);
}
