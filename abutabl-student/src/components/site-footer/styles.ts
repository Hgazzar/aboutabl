import styled from 'styled-components';
import { theme } from 'global-styles';

export const SiteFooterRoot = styled.footer<{ $variant: 'page' | 'shell' }>`
	width: 100%;
	box-sizing: border-box;
	background: ${theme.colours.PaoloVeroneseGreen};
	color: ${theme.colours.white};
	padding: 18px 24px;
	flex-shrink: 0;
	/* Figma: straight top edge, rounded bottom corners */
	border-radius: 0 0 20px 20px;

	${({ $variant }) =>
		$variant === 'shell'
			? `
		margin-top: auto;
	`
			: `
		/* Inset on full-bleed teal pages so bottom radius reads against the page */
		width: auto;
		margin: 0 24px 24px;

		@media (max-width: 640px) {
			margin: 0 16px 16px;
		}
	`}

	@media (max-width: 767px) {
		padding: 16px;
	}
`;

export const SiteFooterInner = styled.div`
	width: 100%;
	max-width: 1100px;
	margin: 0 auto;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 14px 20px;
`;

export const SiteFooterLinks = styled.nav`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 18px 22px;

	a {
		color: inherit;
		text-decoration: none;
		font-family: ${theme.fonts.Nunito};
		font-size: 13px;
		font-weight: 700;
		line-height: 1.2;
		white-space: nowrap;

		&:hover {
			text-decoration: underline;
		}
	}
`;

export const SiteFooterSocial = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

export const SiteFooterSocialLink = styled.a`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 999px;
	color: ${theme.colours.white};
	text-decoration: none;
	opacity: 0.95;

	&:hover {
		opacity: 1;
		filter: brightness(1.08);
	}
`;

export const SiteFooterCopy = styled.p`
	margin: 0;
	margin-inline-start: auto;
	font-family: ${theme.fonts.Nunito};
	font-size: 12px;
	font-weight: 600;
	line-height: 1.35;
	opacity: 0.92;
	text-align: end;

	@media (max-width: 720px) {
		width: 100%;
		margin-inline-start: 0;
		text-align: center;
	}
`;
