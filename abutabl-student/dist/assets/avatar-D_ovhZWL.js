import{c as e,f as t,h as n,t as r}from"./jsx-runtime-BFsvmiJY.js";import{t as i}from"./useIntl-BWNRJaAP.js";import{r as a}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as o}from"./js.cookie-DyR7vJ7e.js";import{o as s}from"./requests-CQDHe7xd.js";import{s as c}from"./figmaAssets-DZM6ZDBD.js";import{a as l,l as u,n as d}from"./studentAvatar-DwvNfQ5r.js";import{n as f}from"./global-styles-8ZhPevyo.js";var p=n(t()),m=`/assets/bg-avatar-CiTmmATv.png`,h=`#1EBBA3`,g=a.div`
	position: fixed;
	inset: 0;
	z-index: 20;
	width: 100%;
	min-height: 100dvh;
	box-sizing: border-box;
	overflow-x: hidden;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 24px 40px;
	/* Single bg image — no tile; white shows behind/around it */
	background-color: #ffffff;
	background-image: url(${m});
	background-repeat: no-repeat;
	background-position: center center;
	background-size: cover;
	font-family: ${f.fonts.Nunito};
`,_=a.div`
	position: relative;
	width: 100%;
	max-width: 1040px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 22px;
	padding-top: 8px;
`,v=a.div`
	position: absolute;
	top: 0;
	inset-inline-start: 0;
	z-index: 2;
`,y=a.div`
	display: grid;
	grid-template-columns: minmax(150px, 200px) 1fr minmax(150px, 200px);
	align-items: start;
	width: 100%;
	gap: 12px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
		justify-items: center;
	}
`,b=a.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 14px;
	justify-self: start;

	@media (max-width: 720px) {
		align-items: center;
		justify-self: center;
	}
`,x=a.div`
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding-top: 4px;
`,S=a.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 18px;
	border-radius: 16px;
	/* Figma logo pill — light mint cyan from Choose Avatar */
	background: #e0feff;
	box-shadow: 0 4px 12px rgba(0, 144, 122, 0.12);

	img {
		height: 40px;
		width: auto;
		object-fit: contain;
		display: block;
	}
`;a.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	text-align: center;
`;var C=a.h1`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-size: clamp(32px, 4.6vw, 48px);
	font-weight: 700;
	letter-spacing: 0.04em;
	line-height: 1;
	color: #3b82f6;
	text-transform: uppercase;
	text-shadow: none;
	-webkit-text-stroke: 2px #0a0a0a;
	paint-order: stroke fill;
`,w=a.span`
	color: ${f.colours.LightSeaGreen};
	text-shadow: none;
	-webkit-text-stroke: 2px #0a0a0a;
	paint-order: stroke fill;
`,T=a.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 38px;
	padding: 0 16px;
	border-radius: 12px;
	border: 1.5px solid ${h};
	background: ${f.colours.white};
	color: ${h};
	font-family: ${f.fonts.Nunito};
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	box-shadow: 0 6px 14px rgba(30, 187, 163, 0.45);

	&:hover {
		background: ${h};
		color: #ffffff;
		box-shadow: 0 6px 14px rgba(30, 187, 163, 0.45);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`,E=a(T)``,D=a.button`
	flex: 1 1 0;
	align-self: center;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	min-width: 0;
	width: 100%;
	max-width: 48%;
	height: 52px;
	padding: 0 22px;
	border-radius: 14px;
	border: 1.5px solid ${h};
	background: #ffffff;
	color: ${h};
	font-family: ${f.fonts.Nunito};
	font-size: 17px;
	font-weight: 800;
	line-height: 1;
	white-space: nowrap;
	cursor: pointer;
	box-shadow: 0 6px 10px rgba(183, 230, 222, 0.95), 0 2px 4px rgba(30, 187, 163, 0.18);
	transition: background-color 0.15s ease, color 0.15s ease;

	&:hover {
		background: ${h};
		color: #ffffff;
		box-shadow: 0 6px 10px rgba(183, 230, 222, 0.95), 0 2px 4px rgba(30, 187, 163, 0.18);
	}

	&:active {
		transform: translateY(1px);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 900px) {
		height: 46px;
		max-width: 50%;
		padding: 0 16px;
		font-size: 15px;
	}
`,O=a.div`
	width: 100%;
	max-width: 1040px;
	box-sizing: border-box;
	margin: 6px auto 0;
	padding: 28px;
	border-radius: 40px;
	background: #ffffff;
	box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);

	@media (max-width: 767px) {
		padding: 16px;
		border-radius: 28px;
	}
`,k=a.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14px 14px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
		gap: 12px;
	}
`,A=a.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	gap: 14px;
	box-sizing: border-box;
	width: 100%;
	padding: 12px 14px;
	border-radius: 18px;
	background: #ffffff;
	box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
	border: 1px solid rgba(0, 0, 0, 0.06);
`,j=a.img`
	display: block;
	flex: 0 0 auto;
	width: min(132px, 48%);
	height: auto;
	border-radius: 0;
	object-fit: contain;
	object-position: center;
	image-rendering: auto;
	filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.22));
`,M=a.div`
	width: 100%;
	max-width: 560px;
	margin: 148px auto 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22px;
	padding-inline: 8px;
	box-sizing: border-box;
`,N=a.div`
	position: relative;
	width: min(320px, 70vw);
	margin: 0 auto;
`,P=a.div`
	position: absolute;
	top: 0;
	/* Sit just outside the card on the inline-start side (left in LTR). */
	inset-inline-end: calc(100% + 12px);
	z-index: 1;
	white-space: nowrap;

	@media (max-width: 640px) {
		position: static;
		inset-inline-end: auto;
		margin-bottom: 12px;
		width: 100%;
		display: flex;
		justify-content: flex-start;
	}
`,F=a.div`
	width: 100%;
	aspect-ratio: 1;
	display: grid;
	place-items: center;
	padding: 22px;
	border-radius: 36px;
	background: #ffffff;
	box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
	box-sizing: border-box;
	overflow: hidden;
`,I=a.img`
	display: block;
	width: 100%;
	height: 100%;
	margin: 0 auto;
	border-radius: 22px;
	object-fit: contain;
	object-position: center center;
	image-rendering: auto;
`,L=a.p`
	margin: 2px 0 0;
	font-family: ${f.fonts.Fredoka};
	font-size: clamp(30px, 5vw, 44px);
	font-weight: 700;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: ${h};
	-webkit-text-stroke: 3px #ffffff;
	paint-order: stroke fill;
	text-shadow: 0 3px 0 #0f766e;
	text-align: center;
`,R=a(T)`
	min-width: 220px;
	min-height: 48px;
	font-size: 14px;
	margin-top: 2px;
`,z=a.p`
	margin: 14px 0 0;
	color: #b91c1c;
	font-size: 14px;
	font-weight: 700;
	text-align: center;
`,B=r(),V=c();function H(){let{formatMessage:t}=i(),n=e(),[r,a]=(0,p.useState)(`pick`),[c,f]=(0,p.useState)(null),[m,h]=(0,p.useState)(!1),[H,U]=(0,p.useState)(null);(0,p.useEffect)(()=>{let e=document.documentElement,t=document.body,n=e.style.backgroundColor,r=t.style.backgroundColor;return e.style.backgroundColor=`#ffffff`,t.style.backgroundColor=`#ffffff`,()=>{e.style.backgroundColor=n,t.style.backgroundColor=r}},[]);let W=()=>{o.remove(`token_`),o.remove(`username`),o.remove(`abotable_id`),o.remove(`expiration`),localStorage.removeItem(`user_info`),n(`/`,{replace:!0})},G=async e=>{if(!m){h(!0),U(null);try{let t=await s(`avatar/select`,{avatar_preset:e});if(!t?.status)throw Error(t?.msg||`Failed to save avatar`);l(e),f(e),a(`success`)}catch(e){let n=e;U(n?.response?.data?.msg||n?.message||t({id:`avatar-onboarding-error`}))}finally{h(!1)}}},K=u(c)??d[0].url;return r===`success`?(0,B.jsx)(g,{"data-testid":`avatar-onboarding-success`,children:(0,B.jsxs)(_,{children:[(0,B.jsx)(v,{children:(0,B.jsx)(S,{children:(0,B.jsx)(`img`,{src:V,alt:`ABOUTABL`})})}),(0,B.jsxs)(M,{children:[(0,B.jsxs)(N,{children:[(0,B.jsx)(P,{children:(0,B.jsx)(T,{type:`button`,onClick:()=>a(`pick`),disabled:m,children:t({id:`avatar-onboarding-change`})})}),(0,B.jsx)(F,{children:(0,B.jsx)(I,{src:K,alt:``,decoding:`async`,loading:`eager`})})]}),(0,B.jsxs)(L,{children:[t({id:`avatar-onboarding-great-choice`}),` 🎉`]}),(0,B.jsx)(R,{type:`button`,onClick:()=>n(`/learn`,{replace:!0}),children:t({id:`avatar-onboarding-start`})})]})]})}):(0,B.jsx)(g,{"data-testid":`avatar-onboarding-pick`,children:(0,B.jsxs)(_,{children:[(0,B.jsx)(v,{children:(0,B.jsx)(S,{children:(0,B.jsx)(`img`,{src:V,alt:`ABOUTABL`})})}),(0,B.jsxs)(y,{children:[(0,B.jsxs)(b,{children:[(0,B.jsx)(`div`,{"aria-hidden":!0,style:{height:60}}),(0,B.jsx)(E,{type:`button`,onClick:W,children:t({id:`avatar-onboarding-home`})})]}),(0,B.jsx)(x,{children:(0,B.jsxs)(C,{children:[t({id:`avatar-onboarding-title-pick`}),` `,(0,B.jsx)(w,{children:t({id:`avatar-onboarding-title-hero`})})]})}),(0,B.jsx)(`span`,{"aria-hidden":!0})]}),(0,B.jsxs)(O,{children:[(0,B.jsx)(k,{children:d.map(e=>(0,B.jsxs)(A,{children:[(0,B.jsx)(j,{src:e.url,alt:``}),(0,B.jsx)(D,{type:`button`,disabled:m,onClick:()=>G(e.id),children:t({id:`navbar-select-avatar`})})]},e.id))}),H?(0,B.jsx)(z,{role:`alert`,children:H}):null]})]})})}export{H as default};