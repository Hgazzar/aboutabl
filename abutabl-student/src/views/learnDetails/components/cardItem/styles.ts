import { theme } from 'global-styles';
import styled from 'styled-components';

export const CardsWrapper = styled.div`
	// border: 1px solid green;
`;

export const FilterWrapper = styled.div`
	// border: 1px solid red;
	border-radius: 36px;
`;

export const ClassNumber = styled.span`
	display: flex;
	padding: 8px 16px;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	background: white;
	border-radius: 40px;
	border: 1px solid #eee;
`;

export const CardWrapper = styled.div`
	border-radius: 20px;
	border: 2px solid ${theme.colours.Platinum};
	box-shadow: 0px 6px 0px 0px ${theme.colours.Platinum};
	padding: 24px;
	// height:300px
`;

export const ImgWrapper = styled.div`
	padding: 24px;
	 height:180px
`;

export const Details = styled.div`
	width: 100%;
`;

export const Title = styled.h4`
	font-family: ${theme.fonts.Medium};
	font-size: 18px;
	line-height: normal;
`;

export const Unit = styled.p`
	font-size: 14px;
	font-weight: 400;
	line-height: normal;
	color: ${theme.colours.black};
	opacity: 0.5;
	font-family: ${theme.fonts.Regular};
	`;

export const ProgressWrapper = styled.div`
	width: 100%;
	`;
export const Percentage = styled.span`
	font-family: ${theme.fonts.Regular};
	color: ${theme.colours.black};
	opacity: 0.5;
	font-size: 14px;
	font-weight: 400;
`;
