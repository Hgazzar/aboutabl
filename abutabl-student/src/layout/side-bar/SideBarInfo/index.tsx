import { studentBrandLogoUrl } from 'config/figmaAssets';
import { SideBarInfo } from '../styles';

const LOGO = studentBrandLogoUrl();

export default function SideBarInfoSection() {
	return (
		<SideBarInfo>
			<div className="LogoWrapper">
				<img src={LOGO} alt="ABOUTABL" />
			</div>
		</SideBarInfo>
	);
}
