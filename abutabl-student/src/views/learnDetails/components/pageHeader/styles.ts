import { theme } from 'global-styles';
import styled from 'styled-components';

export const HeaderWrapper = styled.section`
	position: relative;
	padding: 20px 50px 20px 20px;
	background-color: ${theme.colours.PaoloVeroneseGreen};
	.wellcome_wrapper {
		position: relative;
		z-index: 10;
		color: ${theme.colours.white};
		text-shadow: 1px 1px 3px #000;
		h1 {
			font-size: 32px;
			font-family: ${theme.fonts.Bold};
		}
		p {
			font-size: 14px;
			font-family: ${theme.fonts.Medium};
		}
	}

	.notification {
		background-color: ${theme.colours.white};
		width: 38px;
		height: 38px;
		border-radius: 12px;
		border: 2px solid ${theme.colours.Platinum};
	}
`;
