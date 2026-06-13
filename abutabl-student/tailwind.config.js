/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			boxShadow: {
				'custom-sm': '0px 4px 0px 0px #E5E5E5;',
				'custom-sm-green': '0px 4px 0px 0px #1B9582;',
				'custom-sm-warning': '0px 4px 0px 0px #FFAD0D;',
				'custom-sm-blue': '0px 4px 0px 0px #3B82F6',
				'custom-sm-red': '0px 4px 0px 0px #E52C34',
			},
			backgroundImage: {
				lines: "url('./src/assets/images/png/lines.png')",
			},
			colors: {
				Warning: '#FFAD0D',
				blue: '#ECF3FF',
				lightGray: '#FCFCFC',
				white: '#FFFFFF',
				EerieBlack: '#1F1E1E',
				black: '#000000',
				black_2: '#161618',
				error: '#FFEEEE',
				AntiFlashWhite: '#F2F2F2',
				Cultured: '#F4F4F4',
				Danger: '#DC3545',
				DavysGrey: '#5A5A5A',
				gray: '#B8BBC2',
				gray2: '#666666',
				'Grey-body': '#5F5E5E',
				'Morning-Blue': '#8E9AA0',
				'warm-red': '#F64C4C',
				'Spanish-Gray': '#9C9B9B',
				'Space-Cadet': '#172B4D',
				silverChalice: '#ABABAB',
				PermanentGeraniumLake: '#DC2D2D',
				Lotion: '#EBF9F7',
				SpanishGray: '#9E9E9E',
				LightSeaGreen: '#1EBBA3',
				PaoloVeroneseGreen: '#00907A',
				CharlestonGreen: '#292D32',
				Platinum: '#E5E5E5',
				Keppel: '#3BB4A1',
				Sunglow: '#FFC234',
				New: '#F3F0FF',
				TextNew: '#5E4DB2',



			},
			transitionProperty: {
				background: 'background',
			},
		},
	},
	plugins: [],
};
