import { theme } from 'global-styles';
import styled from 'styled-components';

export const SearchWrapper = styled.div`
	flex: 1;
	.search_wrapper {
		padding: 3px;
		border-radius: 16px;
		background-color: ${theme.colours.white};
		input {
			font-family: ${theme.fonts.Medium};
			border: none;
			color: ${theme.colours.CharlestonGreen};
			::placeholder {
				color: ${theme.colours.SpanishGray};
			}
		}
		svg {
			path {
				stroke: ${theme.colours.CharlestonGreen};
			}
			&.active {
				cursor: pointer;
				pointer-events: auto;
				path {
					stroke: ${theme.colours.LightSeaGreen};
				}
			}
		}
	}
`;
