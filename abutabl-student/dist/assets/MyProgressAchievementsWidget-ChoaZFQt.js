import{r as e,t}from"./jsx-runtime-BFsvmiJY.js";import{t as n}from"./useIntl-BWNRJaAP.js";import{r}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as i}from"./figmaAssets-DZM6ZDBD.js";import{n as a}from"./global-styles-8ZhPevyo.js";import{i as o,n as s,r as ee,t as te}from"./myProgressBarUtils-Nmi-83O5.js";import{s as ne,t as re}from"./myProgressUtils-Cs40We8S.js";var c=r.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr) ${299}px;
	gap: ${24}px;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	font-family: ${a.fonts.Nunito};

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`,l=r.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${a.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
`,u=r.section`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 24px;
	margin: 0 20px 20px;
	padding: 18px 22px 22px;
	border-radius: 24px 24px 20px 20px;
	background: ${a.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 14px 12px 16px;
	}
`,d=r.header`
	position: relative;
	min-height: 300px;
	padding: 12px 0 0 28px;
	box-sizing: border-box;
	overflow: hidden;

	@media (max-width: 720px) {
		min-height: 0;
		padding: 16px 16px 0;
	}
`,f=r.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	max-width: min(720px, 78%);
	padding-top: 10px;
	padding-bottom: 28px;
	text-align: start;

	@media (max-width: 720px) {
		max-width: 100%;
		padding-bottom: 12px;
	}
`,p=r.h1`
	margin: 0;
	padding: 0;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-style: normal;
	font-size: 104px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${a.colours.white};
	-webkit-text-stroke: 1px #000000;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #000000,
		-1px 0 0 #000000,
		0 1px 0 #000000,
		0 -1px 0 #000000,
		1px 1px 0 #000000,
		-1px 1px 0 #000000,
		1px -1px 0 #000000,
		-1px -1px 0 #000000;

	@media (max-width: 1100px) {
		font-size: clamp(56px, 8.5vw, 104px);
	}

	@media (max-width: 720px) {
		font-size: clamp(40px, 12vw, 64px);
	}
`,m=r.span`
	display: block;
	white-space: nowrap;
`,h=r.p`
	margin: 0;
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`,g=r.p`
	margin: 6px 0 0;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(28px, 3.6vw, 40px);
	line-height: 1.15;
	color: #ffb300;
	-webkit-text-stroke: 1px #000000;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #000000,
		-1px 0 0 #000000,
		0 1px 0 #000000,
		0 -1px 0 #000000;
`,_=r.div`
	position: absolute;
	z-index: 1;
	inset-inline-end: -18px;
	bottom: -36px;
	width: min(460px, 52%);
	aspect-ratio: 530 / 420;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		position: relative;
		inset-inline-end: auto;
		bottom: auto;
		width: min(280px, 90%);
		margin: 0 auto -20px;
	}
`,v=r.img`
	position: absolute;
	left: 50%;
	top: 40%;
	width: 150%;
	max-width: none;
	aspect-ratio: 1;
	transform: translate(-50%, -50%);
	object-fit: contain;
	opacity: 0.88;
	mix-blend-mode: screen;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`,y=r.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	user-select: none;
	pointer-events: none;
`,b=r.aside`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 991px) {
		width: 100%;
	}
`,x=r.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fde8e8;
	color: #b42318;
	font-weight: 600;
	font-size: 14px;

	button {
		border: none;
		background: transparent;
		color: #408fd1;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`,S=r.div`
	margin: 0;
	padding: 24px;
	text-align: center;
	color: #9a9288;
	font-weight: 600;

	button {
		border: none;
		background: transparent;
		color: #408fd1;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`,C=r.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
`,w=r.h2`
	margin: 0;
	font-family: ${a.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;
`,T=r.div`
	background: ${a.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 24px;
	box-sizing: border-box;
`,E=r(e)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 8px;
	font-family: ${a.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: #408fd1;
	text-decoration: none;

	&:hover {
		filter: brightness(1.05);
	}
`,D=r.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px;
	grid-template-rows: auto auto;
	column-gap: 12px;
	row-gap: 4px;
	box-sizing: border-box;
	width: 100%;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`,O=r.div`
	position: relative;
	width: 100%;
	max-width: 720px;
	background: ${a.colours.white};
	border-radius: 16px;
	padding: 16px 32px 18px;
	box-sizing: border-box;
	clip-path: inset(0 -16px -16px -16px);
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);

	@media (max-width: 767px) {
		padding: 14px 16px 16px;
	}
`,k=r.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	transform: translateY(-8px);

	@media (max-width: 640px) {
		flex-wrap: wrap;
		transform: none;
	}
`,A=r.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`,j=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`,M=r.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${a.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${a.colours.white};
`,N=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`,P=r.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	white-space: nowrap;

	img {
		width: 26px;
		height: 24px;
		object-fit: contain;
	}
`,F=r.div`
	grid-column: 1;
	grid-row: 2;
	position: relative;
	width: 100%;
	max-width: 568px;
	line-height: 0;
	align-self: end;
	transform: translateY(-15px);

	@media (max-width: 640px) {
		max-width: 100%;
		transform: none;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		isolation: isolate;
	}
`,I=r.div`
	position: absolute;
	left: ${s}%;
	top: ${ee}%;
	height: ${te}%;
	width: calc(${o}% * ${({$percent:e})=>e/100});
	border-radius: 6px;
	background: linear-gradient(
		90deg,
		#72d8b9 16.83%,
		#d5b454 38.94%,
		#d1b658 60.1%,
		#eac65c 77.4%,
		#e5b314 100%
	);
	pointer-events: none;
`,L=r.div`
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	transform: translateY(20px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
		justify-content: flex-start;
		transform: none;
	}
`,R=r.img`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({$unlocked:e})=>e?`none`:`grayscale(1) brightness(0.92)`};
`,z=r.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-15px);
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: #937c61;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 4;
		justify-self: start;
		transform: none;
	}
`,B=r.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
	max-width: 720px;
	margin-top: 16px;
`,V=r.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	min-width: 0;
	flex: 1 1 auto;
	font-family: ${a.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.4;
	color: #ea780c;

	img {
		width: 23px;
		height: 23px;
		object-fit: contain;
		flex-shrink: 0;
	}
`,H=r.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	white-space: nowrap;
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`,U=r.img`
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	object-fit: contain;
	transform: ${({$trend:e})=>e===`down`?`rotate(180deg)`:`none`};
	filter: ${({$trend:e})=>e===`down`?`brightness(0) saturate(100%) invert(40%) sepia(62%) saturate(1400%) hue-rotate(330deg)`:`none`};
`,W=r.strong`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 8px;
	font-family: ${a.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	background: ${({$trend:e})=>e===`up`?`#d8f4ee`:`#fde8e8`};
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`,G=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.25;
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`,K=r.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 780px) {
		grid-template-columns: 1fr;
	}
`,q=r.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 72px;
	padding: 12px 16px;
	border-radius: 16px;
	background: linear-gradient(135deg, #42b5a1 0%, #399f8d 100%);
	box-sizing: border-box;

	img {
		width: 34px;
		height: 34px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		display: block;
		font-family: ${a.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
	}

	.value {
		display: block;
		font-family: ${a.fonts.Fredoka};
		font-weight: 500;
		font-size: 22px;
		line-height: 1.15;
		color: ${a.colours.white};
	}
`,J=r.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`,Y={lavender:{shell:`#EACBFC40`,shellBorder:`#dfbefa`,panelBorder:`#d8cff3`,title:`#3D2A5C`,subtitle:`#5C4A7A`,units:`#7B61FF`,bar:`linear-gradient(90deg, #7B61FF 0%, #B8A6FF 100%)`,iconBg:`#7B61FF`,goalBg:`#E6D9F8`,goalBorder:`#d8cff3`,cta:`#7B61FF`},cream:{shell:`#F8EFD880`,shellBorder:`#EED9A4`,panelBorder:`#EED9A4`,title:`#442817`,subtitle:`#6B635A`,units:`#C9A227`,bar:`linear-gradient(90deg, #E8A317 0%, #F0C66A 100%)`,iconBg:`#E8A317`,goalBg:`#F8EFD8`,goalBorder:`#EED9A4`,cta:`#20B8A0`},mint:{shell:`#F0F7E3`,shellBorder:`#DDEAC8`,panelBorder:`#DDEAC8`,title:`#3A4A28`,subtitle:`#5C6B4A`,units:`#9ec851`,bar:`linear-gradient(90deg, #9ec851 0%, #b8d86e 100%)`,iconBg:`#9ec851`,goalBg:`#e3eecd`,goalBorder:`#DDEAC8`,cta:`#9ec851`},pink:{shell:`#FFF5F8`,shellBorder:`#FAD2E1`,panelBorder:`#F8B4CB`,title:`#7A2240`,subtitle:`#9A4A62`,units:`#E85A9B`,bar:`linear-gradient(90deg, #E85A9B 0%, #F5A0C4 100%)`,iconBg:`#E85A9B`,goalBg:`#FFE4EF`,goalBorder:`#F8B4CB`,cta:`#E85A9B`}},X=r.article`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px;
	border-radius: 28px;
	background: ${({$theme:e})=>Y[e]?.shell??Y.lavender.shell};
	border: 2px solid
		${({$theme:e})=>Y[e]?.shellBorder??Y.lavender.shellBorder};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;
	overflow: hidden;
`,ie=r.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 112px;
	padding: 18px 20px;
	border-radius: 20px;
	overflow: hidden;
	box-sizing: border-box;
	isolation: isolate;
	background: ${({$theme:e})=>e===`lavender`?`#efe6ff`:e===`cream`?`#f7efdb`:e===`mint`?`#e8f2d8`:`#FFF5F8`};
`,ae=r.img`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: fill;
	pointer-events: none;
	user-select: none;
	z-index: 0;
	opacity: ${({$opacity:e})=>e??1};
`,oe=r.img`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 86px;
	object-fit: cover;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	flex-shrink: 0;
`,se=r.div`
	position: relative;
	z-index: 1;
	width: 64px;
	height: 86px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	flex-shrink: 0;
`,ce=r.div`
	position: relative;
	z-index: 1;
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
`,le=r.h3`
	margin: 0;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: ${({$theme:e})=>Y[e]?.title??Y.lavender.title};
`,ue=r.p`
	margin: 0;
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: ${({$theme:e})=>Y[e]?.subtitle??Y.lavender.subtitle};
`,de=r.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	align-self: flex-start;
	margin-top: 4px;
`,fe=r.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 33px;
	flex-shrink: 0;
	filter: ${({$filled:e})=>e?`none`:`grayscale(1)`};

	img {
		width: 30px;
		height: 33px;
		object-fit: contain;
		display: block;
	}
`,pe=r.div`
	padding: 14px 16px;
	border-radius: 18px;
	border: 2px solid
		${({$theme:e})=>Y[e??`lavender`]?.panelBorder??Y.lavender.panelBorder};
	background: ${a.colours.white};
	box-sizing: border-box;
`,me=r.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
`,he=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	color: #2a2438;
`,ge=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	color: ${({$theme:e})=>Y[e]?.units??Y.lavender.units};
	white-space: nowrap;
`,_e=r.div`
	width: 100%;
	height: 14px;
	border-radius: 999px;
	background: #ece8f2;
	overflow: hidden;
`,ve=r.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: ${({$theme:e})=>Y[e]?.bar??Y.lavender.bar};
`,ye=r.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	gap: 10px;
	width: 100%;

	/* 1 / 2 / 3 visible chips share one row evenly */
	& > [data-metric] {
		flex: 1 1 0;
		min-width: 0;
	}
`,be=r.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 8px;
	min-height: 108px;
	padding: 12px 10px 14px;
	border-radius: 20px;
	border: 2px solid
		${({$theme:e})=>Y[e]?.panelBorder??Y.lavender.panelBorder};
	background: ${a.colours.white};
	box-sizing: border-box;

	.top {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-width: 0;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: ${({$theme:e})=>Y[e]?.iconBg??Y.lavender.iconBg};
		flex-shrink: 0;

		img,
		svg {
			width: 22px;
			height: 22px;
			display: block;
		}
	}

	.icon-badge {
		width: 40px;
		height: 40px;
		object-fit: contain;
		flex-shrink: 0;
		display: block;
	}

	.value {
		font-family: ${a.fonts.Fredoka};
		font-weight: 600;
		font-size: clamp(14px, 2.4vw, 18px);
		line-height: 1.15;
		color: #2a2438;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.divider {
		display: block;
		width: 100%;
		height: 1px;
		background: #e6e1ec;
		flex-shrink: 0;
	}

	.label {
		font-family: ${a.fonts.Nunito};
		font-weight: 700;
		font-size: clamp(11px, 1.8vw, 13px);
		line-height: 1.2;
		color: #8a8494;
		text-align: center;
		min-width: 0;
		overflow-wrap: anywhere;
	}
`,xe=r.div`
	position: relative;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px 18px;
	min-height: 143px;
	padding: 18px 22px 28px;
	border-radius: 20px;
	border: 2px solid
		${({$theme:e})=>Y[e??`lavender`]?.goalBorder??Y.lavender.goalBorder};
	background: ${({$theme:e})=>Y[e??`lavender`]?.goalBg??Y.lavender.goalBg};
	overflow: hidden;
	box-sizing: border-box;
	isolation: isolate;
`,Se=r.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	flex: 1 1 260px;

	.bird {
		width: 106px;
		height: 103px;
		object-fit: contain;
		object-position: left bottom;
		flex-shrink: 0;
		margin-bottom: -10px;
	}

	.copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-width: 0;
	}

	.eyebrow {
		margin: 0;
		font-family: ${a.fonts.Fredoka};
		font-weight: 600;
		font-size: 18px;
		line-height: 1.2;
		color: ${({$theme:e})=>e===`pink`?`#7A2240`:e===`cream`||e===`mint`?`#442817`:`#3d2a5c`};
	}

	.title {
		margin: 0;
		font-family: ${a.fonts.Nunito};
		font-weight: 700;
		font-size: 15px;
		line-height: 1.35;
		color: ${({$theme:e})=>e===`pink`?`#9A4A62`:e===`cream`||e===`mint`?`#6B635A`:`#4a3b66`};
	}

	.reward {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-top: 4px;
		font-family: ${a.fonts.Nunito};
		font-weight: 700;
		font-size: 14px;
		line-height: 1.2;
		color: ${({$theme:e})=>e===`pink`?`#B06A80`:e===`cream`||e===`mint`?`#8A7350`:`#5c4a7a`};

		img {
			width: 20px;
			height: 18px;
			object-fit: contain;
			opacity: 1;
		}
	}
`,Ce=r(e)`
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 14px 22px;
	border-radius: 999px;
	background: ${({$theme:e})=>Y[e]?.cta??Y.lavender.cta};
	color: ${a.colours.white};
	font-family: ${a.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	text-decoration: none;
	white-space: nowrap;
	flex-shrink: 0;
	box-shadow: ${({$theme:e})=>e===`mint`?`0 4px 0 #719537`:e===`cream`?`0 4px 12px rgba(32, 184, 160, 0.35)`:e===`pink`?`0 4px 12px rgba(232, 90, 155, 0.35)`:`0 4px 12px rgba(123, 97, 255, 0.35)`};

	&:hover {
		filter: brightness(1.05);
	}
`,we=r.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`,Te=r.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`,Ee=r.img`
	width: 72px;
	height: 72px;
	flex-shrink: 0;
	object-fit: contain;
	border-radius: 16px;
	opacity: ${({$earned:e})=>e?1:.88};
	filter: ${({$earned:e})=>e?`none`:`grayscale(0.2)`};
`,De=r.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`,Oe=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #1f1e1e;
`,ke=r.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: #ebe7e1;
	overflow: hidden;
`,Ae=r.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: #f5c518;
`,je=r.span`
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #9a9288;
`,Z=t(),Me=i(`achievements-badge.png`),Ne=i(`hex-star-gold.png`),Q=4,Pe=r(T)`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 18px 18px;
	text-align: center;
`,$=r.h2`
	margin: 0 0 16px;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: #442817;
`,Fe=r.img`
	display: block;
	width: min(168px, 78%);
	aspect-ratio: 1;
	object-fit: contain;
	border-radius: 22px;
	margin: 0 auto 14px;
`,Ie=r.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin: 0 0 6px;
`,Le=r.span`
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1;
	color: #442817;
`,Re=r.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 36px;
	height: 28px;
	padding: 0 10px;
	border-radius: 999px;
	background: #1ebba3;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: ${a.colours.white};
`,ze=r.p`
	margin: 0;
	font-family: ${a.fonts.Fredoka};
	font-weight: 600;
	font-size: 28px;
	line-height: 1.15;
	color: #442817;
`,Be=r.p`
	margin: 4px 0 12px;
	font-family: ${a.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9a9288;
`,Ve=r.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin-bottom: 16px;
`,He=r.span`
	display: inline-flex;
	width: 28px;
	height: 30px;
	flex-shrink: 0;
	filter: ${({$filled:e})=>e?`none`:`grayscale(1) opacity(0.55)`};

	img {
		width: 28px;
		height: 30px;
		object-fit: contain;
		display: block;
	}
`,Ue=r.a`
	display: block;
	margin-top: 2px;
	font-family: ${a.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
	cursor: pointer;
`;function We({hero:e,items:t,onViewAll:r}){let{formatMessage:i}=n(),a=re(t,Q),o=ne(e.level_badge_label)||i({id:`my-progress-student-fallback`});return(0,Z.jsxs)(Pe,{"aria-label":i({id:`my-progress-achievements-widget`}),children:[(0,Z.jsx)($,{children:i({id:`my-progress-achievements-widget`})}),(0,Z.jsx)(Fe,{src:Me,alt:``}),(0,Z.jsxs)(Ie,{children:[(0,Z.jsx)(Le,{children:i({id:`dashboard-level`})}),(0,Z.jsx)(Re,{children:e.level})]}),(0,Z.jsx)(ze,{children:o}),(0,Z.jsx)(Be,{children:i({id:`my-progress-your-current-badge`})}),(0,Z.jsx)(Ve,{"aria-label":i({id:`my-progress-book-stars`},{filled:a,total:Q}),children:Array.from({length:Q},(e,t)=>(0,Z.jsx)(He,{$filled:t<a,children:(0,Z.jsx)(`img`,{src:Ne,alt:``,"aria-hidden":!0})},t))}),r?(0,Z.jsx)(Ue,{href:`#my-progress-achievements`,onClick:e=>{e.preventDefault(),r()},children:i({id:`my-progress-view-all`})}):null]})}export{h as $,S as A,be as B,ie as C,J as D,le as E,j as F,O as G,Se as H,A as I,_ as J,D as K,k as L,B as M,fe as N,T as O,M as P,v as Q,V as R,ue as S,ce as T,xe as U,ye as V,c as W,f as X,y as Y,g as Z,F as _,P as _t,Ee as a,C as at,oe as b,ke as c,q as ct,L as d,ge as dt,p as et,z as f,_e as ft,I as g,W as gt,N as h,G as ht,Ae as i,me as it,x as j,Ce as k,we as l,K as lt,E as m,H as mt,De as n,he as nt,Te as o,w as ot,b as p,U as pt,d as q,je as r,pe as rt,Oe as s,de as st,We as t,m as tt,R as u,ve as ut,u as v,ae as w,se as x,X as y,l as z};