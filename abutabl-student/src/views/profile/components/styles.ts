import styled from 'styled-components';
import { theme } from 'global-styles';

export const LeftContainer = styled.div`
	button {
		&:last-child {
			border-top: 1px solid ${theme.colours.BrightGray};
			margin-top: auto;
		}
	}
`;
export const EditContainer = styled.div`
	form {
		label {
			direction: ltr;
			&:lang(ar) {
				padding: 4px 0;
				p {
					padding: 2px;
				}
			}
		}
		h4 {
			font-size: 14px;
			font-weight: 500;
		}
		.upload_container {
			img.uploadded_image {
				width: 120px;
				height: 120px;
				border-radius: 50%;
				border: 5px solid #1ebba3;
			}
		}
		.file_input_container {
			.mantine-Input-wrapper {
				display: none;
			}
			.mantine-FileInput-root {
				label {
					direction: ltr;
					font-family: ${theme.fonts.Medium};
					border: none;
					width: fit-content;
					padding: 0 15px;
					cursor: pointer;
					font-weight: 500;
					font-size: 14px;
					color: ${theme.colours.LightSeaGreen};
					&:lang(ar) {
						padding: 4px 0;
					}
				}
			}
		}
		.action_container {
			padding-top: 32px;
			button {
				height: 48px;
				padding: 0 32px;
				background-color: ${theme.colours.white};
				font-family: ${theme.fonts.Medium};
				font-weight: 500;
				font-size: 16px;
				border: 2px solid ${theme.colours.Platinum};
				border-radius: 16px;
				color: #1f1e1e;
				box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
				-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
				-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
				&[type='submit'] {
					border: none;
					background-color: ${theme.colours.Sunglow};
					box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
					-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
					-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
				}
				@media (max-width: 767px) {
					width: 100%;
				}
			}
		}
	}
`;

export const ActionContainer = styled.div`
	padding-top: 32px;
	button {
		height: 48px;
		padding: 0 32px;
		background-color: ${theme.colours.white};
		font-family: ${theme.fonts.Medium};
		font-weight: 500;
		font-size: 16px;
		border: 2px solid ${theme.colours.Platinum};
		border-radius: 16px;
		color: #1f1e1e;
		box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		&[type='submit'] {
			border: none;
			background-color: ${theme.colours.Sunglow};
			box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
			-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
			-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		}
	}
`;
