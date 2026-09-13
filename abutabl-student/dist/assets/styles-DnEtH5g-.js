import{r as e}from"./jsx-runtime-BFsvmiJY.js";import{r as t}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as n}from"./figmaAssets-DZM6ZDBD.js";import{n as r}from"./global-styles-8ZhPevyo.js";var i=t.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr) ${299}px;
	gap: ${24}px;
	min-width: 0;
	width: 100%;
	font-family: ${r.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`,a=t.main`
	display: flex;
	flex-direction: column;
	gap: 24px;
	min-width: 0;
	box-sizing: border-box;
	padding: ${24}px;
	background: ${r.colours.Lotion};
	border-radius: 20px;
`,o=t.aside`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 991px) {
		width: 100%;
	}
`,s=t.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: flex-start;
	gap: ${({$gap:e})=>e}px;
	width: 100%;
	max-width: ${({$maxWidth:e})=>e}px;
	box-sizing: border-box;

	@media (max-width: 780px) {
		flex-wrap: wrap;
		max-width: 100%;
	}
`,c=t.section`
	background: ${r.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 24px;
`;t.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;

	h1 {
		margin: 0;
		font-family: ${r.fonts.Fredoka};
		font-size: clamp(28px, 4vw, 40px);
		color: ${r.colours.black_2};
		text-transform: capitalize;
	}
`,t.div`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`,t.div`
	position: relative;
	width: 88px;
	height: 88px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	.ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
	}
`,t.img`
	width: min(160px, 28vw);
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
`,t.div`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;

	button,
	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 50px;
		padding: 0 24px;
		border-radius: 25px;
		border: none;
		font-family: ${r.fonts.Nunito};
		font-size: 14px;
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
	}

	.btn-yellow {
		background: #ffc107;
		color: ${r.colours.black_2};
	}

	.btn-teal {
		background: ${r.colours.LightSeaGreen};
		color: ${r.colours.white};
	}

	.btn-purple {
		background: #7b61ff;
		color: ${r.colours.white};
	}

	.dashboard-btn {
		font-family: ${r.fonts.Nunito} !important;
	}
`,t.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
`,t.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	border-radius: 16px;
	background: ${r.colours.AntiFlashWhite};
	min-width: 180px;

	strong {
		display: block;
		font-family: ${r.fonts.Fredoka};
		font-size: 18px;
		color: ${r.colours.black_2};
	}

	span {
		font-family: ${r.fonts.Nunito};
		font-size: 12px;
		color: ${r.colours[`Grey-body`]};
	}
`,t(c)`
	position: relative;
	overflow: hidden;
`,t.img`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.08;
	pointer-events: none;
`,t.div`
	position: relative;
	z-index: 1;
`,t.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	margin-top: 8px;
`,t.img`
	width: 120px;
	height: auto;
	object-fit: contain;
`,t.div`
	height: 12px;
	border-radius: 999px;
	background: ${r.colours.Platinum};
	overflow: hidden;
	margin-top: 12px;

	div {
		height: 100%;
		border-radius: 999px;
		background: ${r.colours.LightSeaGreen};
	}
`;var l=t(c)`
	h2 {
		margin: 0 0 16px;
		font-family: ${r.fonts.Fredoka};
		font-size: 18px;
		text-transform: capitalize;
	}
`;t(l)`
	background-image: url(${n(`goal-frame.png`)});
	background-repeat: no-repeat;
	background-position: top center;
	background-size: 100% auto;
	padding-top: 48px;
`,t.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12px;

	img {
		width: 72px;
		height: auto;
		object-fit: contain;
	}
`,t(l)`
	.streak-icons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 12px;

		img {
			object-fit: contain;
		}

		.flash {
			width: 36px;
			height: auto;
		}

		.bomb {
			width: 48px;
			height: auto;
		}
	}

	.streak-visual {
		width: 100%;
		height: auto;
		border-radius: 12px;
	}
`,t.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 16px;

	button {
		border: none;
		background: transparent;
		padding: 8px 16px;
		border-radius: 999px;
		font-family: ${r.fonts.Nunito};
		cursor: pointer;
		color: ${r.colours[`Grey-body`]};

		&.active {
			background: ${r.colours.LightSeaGreen};
			color: ${r.colours.white};
		}
	}
`,t.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 0;
	border-bottom: 1px solid ${r.colours.Platinum};

	&:last-child {
		border-bottom: none;
	}

	strong {
		font-family: ${r.fonts.Fredoka};
		font-size: 16px;
		color: ${r.colours.black_2};
	}
`,t.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 0;

	.rank {
		width: 28px;
		text-align: center;
		font-family: ${r.fonts.Fredoka};
	}

	strong {
		font-family: ${r.fonts.Fredoka};
		font-size: 15px;
		color: ${r.colours.black_2};
	}
`,t.footer`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	justify-content: center;
	padding: 24px 0 8px;
	font-family: ${r.fonts.Nunito};
	font-size: 14px;
	color: ${r.colours[`Grey-body`]};

	a {
		color: inherit;
		text-decoration: none;
	}
`,t.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 0;
	border-bottom: 1px solid ${r.colours.Platinum};

	&:last-child {
		border-bottom: none;
	}

	strong {
		font-family: ${r.fonts.Fredoka};
		font-size: 15px;
		color: ${r.colours.black_2};
	}
`,t.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;
`,t(e)`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	border-radius: 16px;
	background: ${r.colours.AntiFlashWhite};
	text-decoration: none;
	color: inherit;
	min-height: 100px;

	strong {
		font-family: ${r.fonts.Fredoka};
		font-size: 15px;
		color: ${r.colours.black_2};
	}

	span {
		font-family: ${r.fonts.Nunito};
		font-size: 13px;
		color: ${r.colours[`Grey-body`]};
	}
`,t.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
	padding: 16px;
	border-radius: 16px;
	background: ${r.colours.AntiFlashWhite};

	strong {
		font-family: ${r.fonts.Fredoka};
		font-size: 16px;
		color: ${r.colours.black_2};
	}
`,t.div`
	text-align: center;
	margin-bottom: 8px;

	strong {
		display: block;
		font-family: ${r.fonts.Fredoka};
		font-size: 36px;
		color: ${r.colours.LightSeaGreen};
		line-height: 1;
	}

	span {
		font-family: ${r.fonts.Nunito};
		font-size: 13px;
		color: ${r.colours[`Grey-body`]};
	}
`,t.h2`
	margin: 0 0 12px;
	font-family: ${r.fonts.Fredoka};
	font-size: 20px;
	color: ${r.colours.black_2};
`;var u=t.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-family: ${r.fonts.Nunito};
	font-size: 14px;
	line-height: 1.4;

	button {
		flex-shrink: 0;
		border: 0;
		border-radius: 999px;
		padding: 6px 14px;
		background: #8b2e2e;
		color: ${r.colours.white};
		font-family: ${r.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		cursor: pointer;
	}
`,d=t.p`
	margin: 0;
	font-family: ${r.fonts.Nunito};
	color: ${r.colours[`Grey-body`]};
	font-size: 14px;
`;export{i as a,a as i,o as n,d as o,u as r,s,c as t};