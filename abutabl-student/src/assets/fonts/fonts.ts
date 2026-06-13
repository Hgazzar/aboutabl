import { css } from 'styled-components';

import ExtraBold_woff2 from './Nunito-ExtraBold.woff2';
import ExtraBold_woff from './Nunito-ExtraBold.woff';

import Bold_woff2 from './Nunito-Bold.woff2';
import Bold_woff from './Nunito-Bold.woff';

import ComicBold_woff2 from './Comic-Sans-MS-Bold.woff2';
import ComicBold_woff from './Comic-Sans-MS-Bold.woff';

import Medium_woff from './Nunito-Medium.woff';
import Medium_woff2 from './Nunito-Medium.woff2';

import Regular_woff from './Nunito-Regular.woff';
import Regular_woff2 from './Nunito-Regular.woff2';

import ComicRegular_woff2 from './Comic-Sans-MS-V3.woff2';
import ComicRegular_woff from './Comic-Sans-MS-V3.woff';

import SemiBold_woff from './Nunito-SemiBold.woff';
import SemiBold_woff2 from './Nunito-SemiBold.woff2';

export const fonts = css`
	@font-face {
		font-family: 'ExtraBold';
		src: url(${ExtraBold_woff});
		src: url(${ExtraBold_woff2}) format('woff2'), url(${ExtraBold_woff}) format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'SemiBold';
		src: url(${SemiBold_woff});
		src: url(${SemiBold_woff2}) format('woff2'), url(${SemiBold_woff}) format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Bold';
		src: url(${Bold_woff});
		src: url(${Bold_woff2}) format('woff2'), url(${Bold_woff}) format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'CommicBold';
		src: url(${ComicBold_woff});
		src: url(${ComicBold_woff2}) format('woff2'), url(${ComicBold_woff}) format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Regular';
		src: url(${Regular_woff});
		src: url(${Regular_woff2}) format('woff2'), url(${Regular_woff}) format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'CommicRegular';
		src: url(${ComicRegular_woff});
		src: url(${ComicRegular_woff2}) format('woff2'), url(${ComicRegular_woff}) format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Medium';
		src: url(${Medium_woff});
		src: url(${Medium_woff2}) format('woff2'), url(${Medium_woff}) format('woff');
		font-weight: 500;
		font-style: normal;
		font-display: swap;
	}
`;
