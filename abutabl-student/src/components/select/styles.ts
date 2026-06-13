import styled from 'styled-components';
import { theme } from 'global-styles';

export const SelectWrapper = styled.div`
	margin-bottom: ${theme.space_size};
	label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		border: 1px solid ${theme.colours.BrightGray};
		height: 72px;
		border-radius: 16px;
		box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		.mantine-Input-icon {
			width: 40px;
			height: 40px;
			border-right: 1px solid #f0eeed;
		}
		p {
			font-family: ${theme.fonts.Regular};
			font-weight: 400;
			font-size: 12px;
			color: ${theme.colours['Spanish Gray']};
			left: 55px;
			width: fit-content;
			top: 5px;
			span {
				color: ${theme.colours.error};
			}
		}
		.mantine-Select-root {
			cursor: pointer;
			input {
				width: 100%;
				font-family: ${theme.fonts.Bold};
				font-size: 14px;
				font-weight: 500;
				color: rgb(0, 0, 0);
				border: none;
				outline: none;
				margin-bottom: 9px;
				&::placeholder {
					color: ${theme.colours.SpanishGray};
				}
				&[data-with-icon] {
					padding-left: 55px;
				}
			}
			.mantine-Select-rightSection {
				&:lang(ar) {
					left: 0;
					right: auto;
				}
			}
		}
		&.disabled {
			background-color: ${theme.colours.BrightGray};
			input{
				background-color: ${theme.colours.BrightGray};
			}
		}
	}
`;
