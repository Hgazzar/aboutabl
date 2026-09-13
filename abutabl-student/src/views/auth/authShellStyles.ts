import styled from 'styled-components';
import { theme } from 'global-styles';

export const AuthPageRoot = styled.div`
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	box-sizing: border-box;
	background-color: ${theme.colours.PaoloVeroneseGreen};
`;

export const AuthMain = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	box-sizing: border-box;
`;

export const AuthCard = styled.div`
	width: 100%;
	max-width: 1060px;
	min-height: 551px;
	background-color: ${theme.colours.white};
	border-radius: 32px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	padding: 32px 24px;

	@media (min-width: 768px) {
		padding: 56px 64px;
	}
`;
