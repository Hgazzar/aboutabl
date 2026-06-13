import { theme } from '../../global-styles';
import styled from 'styled-components';

export const BurgerMenu = styled.div`
	button {
		position: fixed;
		z-index: 9999;
		left: 24px;
		top: 10px;
		display: block;
		background-color: ${theme.colours.AntiFlashWhite};
		padding: 10px;
		border-radius: 12px;
		width: 40px;
		height: 40px;
		&:hover {
			background-color: ${theme.colours.AntiFlashWhite};
		}
		@media (min-width: 768px) {
			display: none;
		}
	}
`;
