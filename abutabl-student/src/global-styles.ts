import { Link } from 'react-router-dom';
import { fonts } from './assets/fonts/fonts';
import styled, { createGlobalStyle, css } from 'styled-components';

export const theme = {
	dark: {},
	light: {},
	colours: {
		Warning: '#FFAD0D',
		lightGray: '#FCFCFC',
		white: '#FFFFFF',
		black: '#000000',
		black_2: '#161618',
		error: '#B11E1E',
		AntiFlashWhite: '#F2F2F2',
		Cultured: '#F4F4F4',
		Danger: '#DC3545',
		DavysGrey: '#5A5A5A',
		gray: '#B8BBC2',
		gray2: '#666666',
		'Grey-body': '#5F5E5E',
		'Spanish Gray': '#9C9B9B',
		silverChalice: '#ABABAB',
		PermanentGeraniumLake: '#DC2D2D',

		SpanishGray: '#9E9E9E',
		LightSeaGreen: '#1EBBA3',
		PaoloVeroneseGreen: '#00907A',
		CharlestonGreen: '#292D32',
		Platinum: '#E5E5E5',
		Keppel: '#3BB4A1',
		Sunglow: '#FFC234',
		BrightGray: '#EEEEEE',
		EerieBlack: '#1F1E1E',
		Lotion: '#FFFDFA',
		Marigold: '#E89D2C',
		ChineseWhite: '#E0E0E0',
	},
	fonts: {
		ExtraBold: 'ExtraBold',
		SemiBold: 'SemiBold',
		Bold: 'Bold',
		CommicBold: 'CommicBold',
		Regular: 'Regular',
		CommicRegular: 'CommicRegular',
		Medium: 'Medium',
	},
	space_size: '8px',
	brekpoints: {
		smallMobile: '360px',
		tablet: '768px',
		bigTablet: '1024px',
		desketop: '1280px',
	},
	Snippets: {
		textOverflowHide: css`
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		`,
	},
};

export const GlobalStyles = createGlobalStyle`
	${fonts}

	*{
	 position: relative;
		padding: 0;
		margin: 0;
		direction: rtl;
		box-sizing: border-box;
		&:lang(en) {
			direction: ltr; 
			text-align: left;
  	}
	};

	html, body, #root, .App{
		// min-height: 100vh;
	}
	.Bold{
		font-family: ${theme.fonts.Bold};
	}
	.CommicBold{
		font-family: ${theme.fonts.CommicBold};
	}
	.ExtraBold{
		font-family: ${theme.fonts.ExtraBold};
	}
    .SemiBold{
		font-family: ${theme.fonts.SemiBold};
	}
    .Regular{
		font-family: ${theme.fonts.Regular};
	}
    .CommicRegular{
		font-family: ${theme.fonts.CommicRegular};
	}
    .Medium{
		font-family: ${theme.fonts.Medium};
	}
	.ErrorMessageStyle{
		color: ${theme.colours.error};
		font-size: 12px;
		font-family: ${theme.fonts.Medium};
		min-height: 25px;
		display: flex;
		align-items: flex-end;
	}
	
	.mantine-Menu-dropdown {
		button {
			&:lang(ar) {
				text-align: right;
			}
		}
	}
	.platinum_shadow{
		box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Platinum};
	}
	.marigold_shadow{
		box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		-webkit-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
		-moz-box-shadow: 0px 4px 0px 0px ${theme.colours.Marigold};
	}
	.profile{
		font-family: ${theme.fonts.CommicRegular};
		button{
			font-family: ${theme.fonts.CommicRegular};
			&:last-child{
				margin-top: auto;
				border-top: 1px solid ${theme.colours.BrightGray}; ;
			}
		}
	}
	.mantine-Modal-header {
		border-bottom: 1px solid ${theme.colours.ChineseWhite};
		h2{
			font-size: 18px;
			font-weight: 500;
			color: #010101;
		}
		button{
			width: 32px;
			height: 32px;
			border-radius: 50%;
			border: 1px solid ${theme.colours.ChineseWhite};
			&:lang(ar){
				margin: 0;
			}
		}
	}
	.mantine-Modal-body{
		padding-top: 32px !important;
	}
`;

export const ViewDetails = styled(Link)`
	color: ${theme.colours.gray2};
	background-color: ${theme.colours.Cultured};
	width: 20px;
	height: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 50px;
`;
