import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import { theme } from 'global-styles';

export const LayoutWrapper = styled.div`
	display: flex;
	direction: rtl;
	min-height: 100dvh;
	transition: all 0.5s;
	&:lang(en) {
		direction: ltr;
	}
`;
export const SecondLayoutWrapper = styled.div`
	transition: all 0.5s;
	main {
		height: 100dvh;
		overflow-y: scroll;
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-thumb {
			background-color: #004d34;
		}
		&::-webkit-scrollbar-thumb:hover {
			background-color: #1ebba3;
		}
	}
`;
export const LayoutContainer = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	transition: all 0.5s;
	background-color: ${theme.colours.PaoloVeroneseGreen};
	main {
		height: 100%;
		margin: ${theme.space_size};
		overflow: hidden;
		& > div {
			width: 100%;
			display: flex;
			flex-grow: 1;
			margin: 0;
		}
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-thumb {
			background-color: #004d34;
		}
		&::-webkit-scrollbar-thumb:hover {
			background-color: #1ebba3;
		}
		@media (min-width: 767px) {
			padding: 0 70px;
		}
	}
`;

export const ToastContainerWrapper = styled(ToastContainer)`
	position: unset;
`;
