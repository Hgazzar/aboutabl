import { useIntl } from 'react-intl';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import {
	GoToDashboard,
	HeaderBird,
	HeaderCopy,
	ProfileHeaderRow,
	ProfileTitle,
} from './profileLayout';

const BIRD = figmaProfileAssetUrl('bird-peek.png');

export default function ProfileHeader() {
	const { formatMessage } = useIntl();

	return (
		<ProfileHeaderRow>
			<HeaderCopy>
				<GoToDashboard to="/learn">
					{formatMessage({ id: 'profile-go-to-dashboard' })}
				</GoToDashboard>
				<ProfileTitle>{formatMessage({ id: 'Profile' })}</ProfileTitle>
			</HeaderCopy>
			<HeaderBird src={BIRD} alt="" />
		</ProfileHeaderRow>
	);
}
