import styled from 'styled-components';
import { theme } from 'global-styles';

export const LoginFormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 32px;
	width: 100%;
	align-items: center;

	@media (min-width: 900px) {
		grid-template-columns: minmax(0, 1fr) 363px;
		gap: 48px;
	}
`;

export const LoginFormColumn = styled.div`
	width: 100%;
	max-width: 522px;
`;

export const LoginIllustration = styled.div`
	display: none;
	justify-content: center;
	align-items: center;

	@media (min-width: 900px) {
		display: flex;
	}

	img {
		width: 363px;
		height: auto;
		max-width: 100%;
		object-fit: contain;
	}
`;

export const LoginWrapper = styled.div`
	width: 100%;

	form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.wellcome_wrapper {
		margin-bottom: 4px;

		h1 {
			font-family: ${theme.fonts.Bold};
			font-weight: 700;
			font-size: 40px;
			line-height: 1.15;
			color: ${theme.colours.black_2};
			margin: 0;
		}

		h3 {
			color: ${theme.colours['Grey-body']};
			font-family: ${theme.fonts.Regular};
			font-weight: 400;
			font-size: 16px;
			margin: 0;
		}
	}

	.login-field {
		margin-bottom: 0;

		label {
			position: relative;
			display: flex;
			flex-direction: row;
			align-items: center;
			width: 100%;
			height: 73px;
			border-radius: 36px;
			border: 1px solid ${theme.colours.BrightGray};
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
			-webkit-box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
			-moz-box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
			padding: 0 24px;

			p {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			.mantine-Input-wrapper,
			.mantine-PasswordInput-root {
				flex: 1;
				width: 100%;
				min-width: 0;
			}

			input {
				width: 100%;
				font-family: ${theme.fonts.Regular};
				font-size: 16px;
				font-weight: 400;
				margin-bottom: 0;
				padding-left: 0 !important;
				padding-right: 0 !important;
				height: auto;
				min-height: unset;
				border: none;
				box-shadow: none;
				background: transparent;

				&::placeholder {
					color: ${theme.colours['Spanish Gray']};
					font-weight: 400;
				}
			}

			.mantine-PasswordInput-input {
				height: 44px;
				min-height: 44px;
				border: none !important;
				background: transparent !important;
				box-shadow: none !important;
				padding-left: 0 !important;
				padding-right: 36px !important;
			}

			.mantine-PasswordInput-innerInput {
				font-family: ${theme.fonts.Regular};
				font-size: 16px;
				font-weight: 400;
				opacity: 1;
				visibility: visible;

				&::placeholder {
					color: ${theme.colours['Spanish Gray']};
				}
			}

			.mantine-PasswordInput-visibilityToggle {
				color: ${theme.colours['Spanish Gray']};
			}
		}
	}

	.remember-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		font-size: 14px;
		margin-top: -4px;
	}

	.remember-checkbox {
		.remember-checkbox-input {
			background-color: ${theme.colours.white};
			border: 1px solid ${theme.colours['Spanish Gray']};
			border-radius: 4px;
			cursor: pointer;

			&:checked {
				background-color: ${theme.colours.LightSeaGreen};
				border-color: ${theme.colours.LightSeaGreen};
			}
		}

		.remember-label {
			color: ${theme.colours['Grey-body']};
			font-family: ${theme.fonts.Regular};
			font-size: 14px;
			cursor: pointer;
		}
	}

	.forget-link {
		color: ${theme.colours.LightSeaGreen};
		font-weight: 500;
		text-decoration: none;
		font-size: 14px;

		&:hover {
			text-decoration: underline;
		}
	}

	.login-submit {
		width: 100%;
		max-width: 518px;
		height: 50px;
		background-color: ${theme.colours.LightSeaGreen} !important;
		border: none;
		border-radius: 25px;
		font-family: ${theme.fonts.Bold};
		font-weight: 700;
		font-size: 16px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: ${theme.colours.Lotion};
		margin-top: 4px;

		&:hover {
			background-color: ${theme.colours.Keppel} !important;
		}
	}
`;
