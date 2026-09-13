import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import { formatAssignmentsBadgeCount } from './newAssignmentsBannerUtils';
import {
	PARCHMENT_TEXTURE,
	ParchmentInner,
	ParchmentMountContent,
	ParchmentOuter,
	ParchmentTextureImg,
} from './parchmentMountStyles';

const CLIPBOARD = figmaDashboardAssetUrl('assignments-banner-clipboard.png');

/** Figma `bannerFrame` / `goalFrame` (2096:1734 → 2096:1739) — 804×218 outer, 764×178 inner. */
const BANNER_MIN_HEIGHT = 178;

const BannerInner = styled(ParchmentMountContent)`
	position: relative;
	display: flex;
	align-items: center;
	gap: 20px;
	min-height: ${BANNER_MIN_HEIGHT}px;
	padding: 20px 24px 16px;
	box-sizing: border-box;
	overflow: hidden;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: flex-start;
		padding: 0 4px;
		gap: 16px;
	}
`;

const Illustration = styled.img`
	width: 185px;
	height: 110px;
	flex-shrink: 0;
	object-fit: contain;
	object-position: left center;

	@media (max-width: 640px) {
		width: 150px;
		height: 89px;
		align-self: center;
	}
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	flex: 1;
	min-width: 0;
`;

const Title = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, 2.4vw, 28px);
	line-height: 1.2;
	color: #442817;
`;

const Subtitle = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: clamp(14px, 1.6vw, 16px);
	line-height: 1.4;
	color: #937c61;
`;

const CtaLink = styled(Link)`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 8px;
	min-height: 50px;
	padding: 0 28px;
	border-radius: 25px;
	border: 2px solid #f5d76e;
	background: linear-gradient(180deg, #ffd054 0%, #eeae3e 55%, #e89a28 100%);
	box-shadow: 0 3px 0 #c8841f;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: ${theme.colours.white};
	white-space: nowrap;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

const CountBadge = styled.span`
	position: absolute;
	top: -10px;
	inset-inline-end: -8px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 6px;
	border-radius: 999px;
	border: 2px solid ${theme.colours.white};
	background: #e53935;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: ${theme.colours.white};
	box-shadow: 0 2px 4px rgba(68, 40, 23, 0.2);
`;

type Props = {
	newCount: number;
};

export default function NewAssignmentsBanner({ newCount }: Props) {
	const { formatMessage } = useIntl();

	if (newCount <= 0) {
		return null;
	}

	const badgeLabel = formatAssignmentsBadgeCount(newCount)!;

	return (
		<ParchmentOuter aria-label={formatMessage({ id: 'dashboard-new-assignments' }, { count: newCount })}>
			<ParchmentInner $minHeight={BANNER_MIN_HEIGHT}>
				<ParchmentTextureImg src={PARCHMENT_TEXTURE} alt="" aria-hidden />
				<BannerInner>
				<Illustration src={CLIPBOARD} alt="" aria-hidden />
				<Content>
					<Title>{formatMessage({ id: 'dashboard-new-assignments' }, { count: newCount })}</Title>
					<Subtitle>{formatMessage({ id: 'dashboard-start-earn' })}</Subtitle>
					<CtaLink to="/todo">
						{formatMessage({ id: 'dashboard-view-assignments' })}
						<CountBadge aria-hidden>{badgeLabel}</CountBadge>
					</CtaLink>
				</Content>
				</BannerInner>
			</ParchmentInner>
		</ParchmentOuter>
	);
}
