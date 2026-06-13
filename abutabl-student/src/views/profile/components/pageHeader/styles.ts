import { theme } from 'global-styles';
import styled from 'styled-components';

export const HeaderWrapper = styled.section`
	position: relative;
	background-color: ${theme.colours.PaoloVeroneseGreen};
	@media (min-width: 767px) {
		padding: 20px 0px;
		height: 135px;
	}
	h1 {
		color: #fff;
		font-size: 32px;
		font-weight: 600;
		font-family: ${theme.fonts.Bold};
	}
`;
