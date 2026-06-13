import styled from 'styled-components';
import { theme } from 'global-styles';

export const LoginWrapper = styled.div`
	width: 100%;
	form {
		display: flex;
		flex-direction: column;
		gap: 20px;
		.wellcome_wrapper {
			h1 {
				font-family: ${theme.fonts.Bold};
				font-weight: 700;
				font-size: 25px;
			}
			h3 {
				color: ${theme.colours.SpanishGray};
				font-family: ${theme.fonts.Bold};
				font-weight: 700;
				font-size: 15px;
			}
			p {
				color: ${theme.colours['Grey-body']};
				font-family: ${theme.fonts.Regular};
				font-weight: 400;
				font-size: 14px;
			}
		}
		label {
			p {
				left: unset;
				top: unset;
				padding: 0 8px;
				padding-top: 8px;
				&:lang(ar) {
					right: unset;
				}
			}
			.mantine-PasswordInput-input {
				input {
					&:lang(ar) {
						padding-right: 12px;
					}
				}
			}
			.mantine-Input-rightSection {
				&:lang(ar) {
					left: 0;
					right: unset;
				}
			}
			input {
				&:lang(ar) {
					text-align: right;
				}
			}
		}
		.mantine-Checkbox-body{
			gap: 4px;
		}
	}
`;
