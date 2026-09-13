import{f as e,h as t,i as n,r,t as i}from"./jsx-runtime-BFsvmiJY.js";import{t as ee}from"./useIntl-BWNRJaAP.js";import{r as a}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as o}from"./requests-CQDHe7xd.js";import{t as s}from"./figmaAssets-DZM6ZDBD.js";import{u as c}from"./studentAvatar-DwvNfQ5r.js";import{n as l}from"./global-styles-8ZhPevyo.js";import{n as u,t as d}from"./studentApiResponse-BAEG6iMr.js";import{S as te}from"./index-DJ-Mxe_T.js";import{n as f}from"./styles-DnEtH5g-.js";var p=t(e());function m(e){return e===`class`?`class`:`school`}function h(e){return e===`month`||e===`all_time`?e:`week`}function g(e){return{rank:Number(e?.rank)||0,student_id:Number(e?.student_id)||0,name:typeof e?.name==`string`?e.name:``,photo_url:typeof e?.photo_url==`string`&&e.photo_url.trim()?e.photo_url:null,xp:Math.max(0,Number(e?.xp)||0),is_current:e?.is_current===!0}}function _(e){let t=e?.rank,n=e?.rank_delta;return{student_id:Number(e?.student_id)||0,name:typeof e?.name==`string`?e.name:``,photo_url:typeof e?.photo_url==`string`&&e.photo_url.trim()?e.photo_url:null,rank:t==null?null:Number(t)||null,rank_delta:n==null?null:Number(n),total_xp:Math.max(0,Number(e?.total_xp)||0),range_xp:Math.max(0,Number(e?.range_xp)||0),level:Math.max(1,Number(e?.level)||1),current_streak:Math.max(0,Number(e?.current_streak)||0)}}function v(e){let t=m(e?.tabs?.active_scope),n=h(e?.tabs?.active_range),r=Array.isArray(e?.items)?e.items.map(g):[];return{current_user_summary:_(e?.current_user_summary),tabs:{active_scope:t,active_range:n},items:r}}async function ne(e={}){return v(u(await o(`leaderboard`,{scope:e.scope??`school`,range:e.range??`week`},void 0,e.signal),`leaderboard`,`Invalid leaderboard response`))}var re=[`school`,`class`],ie=[`week`,`month`,`all_time`];function y(e){return e===`class`?`class`:`school`}function b(e){return e===`month`||e===`all_time`?e:`week`}function ae(e){return{scope:y(e.get(`scope`)),range:b(e.get(`range`))}}function oe(e,t,n){let r=new URLSearchParams(e);return t===`school`?r.delete(`scope`):r.set(`scope`,t),n===`week`?r.delete(`range`):r.set(`range`,n),r}function se(e){return e===`class`?`leaderboard-scope-class`:`leaderboard-scope-school`}function x(e){return e===`month`?`leaderboard-range-month`:e===`all_time`?`leaderboard-range-all-time`:`leaderboard-range-week`}function S(e){return e===`class`?`leaderboard-summary-class`:`leaderboard-summary-school`}function ce(e){return e===`class`?`leaderboard-hero-class-line-1`:`leaderboard-hero-school-line-1`}function le(e){return e===`class`?`leaderboard-hero-class-line-2`:`leaderboard-hero-school-line-2`}function ue(e){return e===`class`?`leaderboard-title-class`:`leaderboard-title-school`}function de(e){return!Array.isArray(e)||e.length===0}function fe(e){if(e==null||!Number.isFinite(e)||e<=0)return`—`;let t=Math.floor(e),n=t%100;if(n>=11&&n<=13)return`${t}th`;switch(t%10){case 1:return`${t}st`;case 2:return`${t}nd`;case 3:return`${t}rd`;default:return`${t}th`}}function pe(e){if(e==null||!Number.isFinite(e))return{visible:!1,direction:null,places:0};let t=Math.abs(Math.trunc(e));return t===0?{visible:!0,direction:`flat`,places:0}:{visible:!0,direction:e>0?`up`:`down`,places:t}}function me(e){return`+${Math.max(0,Math.floor(Number(e)||0))} XP`}function he(e){return`+${Math.max(0,Math.floor(Number(e)||0))}`}function ge(e){return e===1?`gold`:e===2?`silver`:e===3?`bronze`:null}var C=a.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr) ${299}px;
	gap: ${24}px;
	align-items: start;
	min-width: 0;
	width: 100%;
	font-family: ${l.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`,w=a.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${l.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`,_e=a.header`
	position: relative;
	min-height: 300px;
	padding: 12px 0 0 28px;
	box-sizing: border-box;
	overflow: hidden;

	@media (max-width: 720px) {
		min-height: 0;
		padding: 16px 16px 0;
	}
`,T=a.div`
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
`,E=a.h1`
	margin: 0;
	padding: 0;
	font-family: ${l.fonts.Fredoka};
	font-weight: 600;
	font-style: normal;
	font-size: 104px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${l.colours.white};
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
`,D=a.span`
	display: block;
	white-space: nowrap;
`,O=a.p`
	margin: 0;
	font-family: ${l.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`,k=a.p`
	margin: 6px 0 0;
	font-family: ${l.fonts.Fredoka};
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
`,A=a.div`
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
`,j=a.img`
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
`,M=a.img`
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	user-select: none;
	pointer-events: none;
`,N=a.section`
	position: relative;
	z-index: 2;
	margin: 0 20px 20px;
	padding: 18px 22px 22px;
	border-radius: 24px 24px 20px 20px;
	background: ${l.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 14px 12px 16px;
	}
`,P=a(r)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 14px;
	font-family: ${l.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.2;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: #1ebba3;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 6px;
	}
`,F=a.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px 16px;
	margin-bottom: 14px;
	border-bottom: 1px solid #ececec;
`,I=a.div`
	display: flex;
	align-items: stretch;
	gap: 22px;
`,ve=a.button`
	appearance: none;
	border: none;
	background: transparent;
	padding: 0 0 10px;
	margin: 0;
	cursor: pointer;
	font-family: ${l.fonts.Nunito};
	font-weight: ${({$active:e})=>e?800:600};
	font-size: 15px;
	line-height: 1.2;
	color: ${({$active:e})=>e?`#1f1e1e`:`#9c9b9b`};
	border-bottom: 3px solid ${({$active:e})=>e?`#4C8DFF`:`transparent`};
	margin-bottom: -1px;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 4px;
	}
`,ye=a.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: transparent;
	max-width: 100%;
	overflow-x: auto;
`,be=a.button`
	appearance: none;
	border: none;
	cursor: pointer;
	white-space: nowrap;
	padding: 8px 14px;
	border-radius: 999px;
	font-family: ${l.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1;
	color: ${({$active:e})=>e?`#1E4FBF`:`#9c9b9b`};
	background: ${({$active:e})=>e?`#DCE9FF`:`transparent`};
	transition: background 0.15s ease, color 0.15s ease;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`,xe=a.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: min(620px, 62vh);
	overflow-y: auto;
	padding-inline-end: 2px;
`,Se=a.div`
	display: grid;
	grid-template-columns: 48px 48px minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	min-height: 66px;
	padding: 10px 14px;
	border-radius: 16px;
	box-sizing: border-box;
	background: ${({$tier:e})=>e===`gold`?`#FFF6CF`:e===`silver`?`#E9EDF5`:e===`bronze`?`#F7E2D0`:`#ffffff`};
	border: ${({$current:e,$tier:t})=>e?`2px solid #4C8DFF`:t?`1px solid transparent`:`1px solid #f0f0f0`};
	box-shadow: ${({$current:e})=>e?`0 0 0 1px rgba(76, 141, 255, 0.18)`:`none`};

	@media (max-width: 520px) {
		grid-template-columns: 40px 40px minmax(0, 1fr);
		grid-template-rows: auto auto;
		row-gap: 6px;

		& > :last-child {
			grid-column: 3 / 4;
			justify-self: end;
		}
	}
`,Ce=a.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
`,we=a.span`
	font-family: ${l.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1;
	color: #4C8DFF;
`,Te=a.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	font-family: ${l.fonts.Fredoka};
	font-weight: 700;
	font-size: 15px;
	line-height: 1;
	color: #442817;
	background: ${({$tier:e})=>e===`gold`?`radial-gradient(circle at 35% 30%, #FFE999 0%, #F5C518 55%, #E0A800 100%)`:e===`silver`?`radial-gradient(circle at 35% 30%, #F4F7FA 0%, #C5D0DB 55%, #9AABC0 100%)`:`radial-gradient(circle at 35% 30%, #F6D3B0 0%, #D4A06E 55%, #B87A45 100%)`};
	box-shadow:
		inset 0 -2px 0 rgba(0, 0, 0, 0.1),
		0 2px 4px rgba(0, 0, 0, 0.08);
`,Ee=a.img`
	width: 44px;
	height: 44px;
	border-radius: 50%;
	object-fit: cover;
	background: #f3f4f6;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
`,De=a.div`
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`,Oe=a.strong`
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	line-height: 1.25;
	color: #1f1e1e;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
`,ke=a.span`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	background: #1ebba3;
	color: ${l.colours.white};
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1.2;
`,Ae=a.span`
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	color: #6b5c4e;
	white-space: nowrap;
	unicode-bidi: isolate;
	direction: ltr;
`,je=a.p`
	margin: 28px 8px;
	text-align: center;
	font-family: ${l.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.45;
	color: #8a7568;
`,L=a.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin: 16px 20px 0;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-size: 14px;

	button {
		border: none;
		background: transparent;
		color: #1ebba3;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
`,Me=a.aside`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18px;
	padding: 22px 20px 20px;
	border-radius: 24px;
	background: ${l.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`,Ne=a.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	text-align: center;
`,Pe=a.h2`
	margin: 0;
	width: 100%;
	font-family: ${l.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: #1f1e1e;
	text-align: center;
`,Fe=a.p`
	margin: 4px 0 0;
	width: 100%;
	font-family: ${l.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	color: #1ebba3;
	text-transform: capitalize;
	text-align: center;
`,Ie=a.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
`,Le=a.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100px;
	height: 98px;
	line-height: 0;
`,Re=a.img`
	width: 100%;
	height: 100%;
	border-radius: 0;
	object-fit: contain;
	display: block;
	background: transparent;
`,ze=a.span`
	position: absolute;
	left: 50%;
	bottom: -10px;
	transform: translateX(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 72px;
	padding: 4px 12px;
	border-radius: 10px;
	background: #1ebba3;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1.2;
	color: #ffe566;
	white-space: nowrap;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.08);
`,Be=a.strong`
	margin-top: 6px;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 20px;
	line-height: 1.2;
	color: #1f1e1e;
	text-align: center;
	text-transform: capitalize;
`,Ve=a.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px 16px;
`,R=a.div`
	min-width: 0;
`,z=a.span`
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #1f1e1e;
`,B=a.strong`
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #1f1e1e;
`,V=a.p`
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 4px;
`,H=a.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 6px;
	font-family: ${l.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1.2;
	color: ${({$direction:e})=>e===`up`?`#1ebba3`:e===`down`?`#c47a47`:`#8a7568`};
`,U=a.img`
	width: 12px;
	height: 12px;
	object-fit: contain;
	transform: ${({$down:e})=>e?`rotate(180deg)`:`none`};
	filter: ${({$down:e})=>e?`invert(48%) sepia(42%) saturate(650%) hue-rotate(346deg) brightness(95%) contrast(85%)`:`none`};
`,He=a.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 48px;
	padding: 10px 16px;
	border-radius: 16px;
	background: #fff4d6;
	box-sizing: border-box;

	img {
		width: 42px;
		height: 42px;
		object-fit: contain;
		flex-shrink: 0;
	}

	span {
		font-family: ${l.fonts.Nunito};
		font-weight: 800;
		font-size: 15px;
		line-height: 1.2;
		color: #c47a47;
	}
`,Ue=a(r)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 2px;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1.2;
	color: #4c8dff;
	text-decoration: none;
	text-transform: uppercase;
	letter-spacing: 0.02em;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 4px;
	}
`,W=i(),We=s(`leaderboard-bird-trophy.png`),Ge=s(`leaderboard-spark.png`),Ke=s(`bomb-explode-5.svg`),G=s(`progress-arrow-up.svg`);function qe(e){if(!e||typeof e!=`object`)return!1;let t=e;return t.code===`ERR_CANCELED`||t.name===`CanceledError`||t.name===`AbortError`}function K(){let{formatMessage:e,locale:t}=ee(),[r,i]=n(),{scope:a,range:o}=ae(r),[s,l]=(0,p.useState)(null),[u,m]=(0,p.useState)(!0),[h,g]=(0,p.useState)(null),_=(0,p.useRef)(0),v=(0,p.useRef)(null),y=(0,p.useRef)(!1),b=(0,p.useCallback)((e,t)=>{i(oe(r,e,t),{replace:!0})},[r,i]),K=(0,p.useCallback)(async()=>{let t=++_.current;v.current?.abort();let n=new AbortController;v.current=n,y.current||m(!0);try{let e=await ne({scope:a,range:o,signal:n.signal});if(t!==_.current)return;y.current=!0,l(e),g(null)}catch(n){if(qe(n)||t!==_.current)return;g(d(n,e({id:`leaderboard-load-error`})))}finally{t===_.current&&m(!1)}},[a,o,e]);(0,p.useEffect)(()=>(K(),()=>{v.current?.abort()}),[K]);let q=(0,p.useCallback)(()=>{K()},[K]);if(u&&!s)return(0,W.jsxs)(C,{children:[(0,W.jsx)(w,{children:(0,W.jsx)(te,{})}),(0,W.jsx)(f,{"aria-hidden":!0})]});if(!s)return(0,W.jsxs)(C,{children:[(0,W.jsx)(w,{children:(0,W.jsxs)(L,{role:`alert`,children:[(0,W.jsx)(`span`,{children:h??e({id:`leaderboard-load-error`})}),h?(0,W.jsx)(`button`,{type:`button`,onClick:q,children:e({id:`dashboard-retry`})}):null]})}),(0,W.jsx)(f,{"aria-hidden":!0})]});let J=s.current_user_summary,Y=s.items,X=de(Y),Z=pe(J.rank_delta),Je=t?.toLowerCase().startsWith(`ar`)&&J.rank!=null?String(J.rank):fe(J.rank),Q=J.rank!=null,Ye=Q?e({id:ce(a)},{rank:Je}):e({id:`leaderboard-hero-unranked`}),$=Q?e({id:le(a)}):null;return(0,W.jsxs)(C,{children:[(0,W.jsxs)(w,{children:[h?(0,W.jsxs)(L,{role:`alert`,children:[(0,W.jsx)(`span`,{children:h}),(0,W.jsx)(`button`,{type:`button`,onClick:q,children:e({id:`dashboard-retry`})})]}):null,(0,W.jsxs)(_e,{children:[(0,W.jsxs)(T,{children:[(0,W.jsxs)(E,{children:[(0,W.jsx)(D,{children:Ye}),$?(0,W.jsx)(D,{children:$}):null]}),Q?(0,W.jsx)(O,{children:e({id:`leaderboard-hero-subtitle`})}):null,(0,W.jsx)(k,{children:e({id:ue(a)})})]}),(0,W.jsxs)(A,{"aria-hidden":!0,children:[(0,W.jsx)(j,{src:Ge,alt:``}),(0,W.jsx)(M,{src:We,alt:``})]})]}),(0,W.jsxs)(N,{"aria-label":e({id:`nav-leaderboard`}),children:[(0,W.jsx)(P,{to:`/learn`,children:e({id:`todo-back-dashboard`})}),(0,W.jsxs)(F,{children:[(0,W.jsx)(I,{role:`tablist`,"aria-label":e({id:`leaderboard-scope-label`}),children:re.map(t=>(0,W.jsx)(ve,{type:`button`,role:`tab`,"aria-selected":a===t,$active:a===t,onClick:()=>b(t,o),children:e({id:se(t)})},t))}),(0,W.jsx)(ye,{role:`group`,"aria-label":e({id:`leaderboard-range-label`}),children:ie.map(t=>(0,W.jsx)(be,{type:`button`,"aria-pressed":o===t,$active:o===t,onClick:()=>b(a,t),children:e({id:x(t)})},t))})]}),X?(0,W.jsx)(je,{children:e({id:`leaderboard-empty`})}):(0,W.jsx)(xe,{children:Y.map(t=>{let n=ge(t.rank);return(0,W.jsxs)(Se,{$tier:n,$current:t.is_current,children:[(0,W.jsx)(Ce,{children:n?(0,W.jsx)(Te,{$tier:n,"aria-label":`#${t.rank}`,children:t.rank}):(0,W.jsx)(we,{children:t.rank})}),(0,W.jsx)(Ee,{src:c({photoUrl:t.photo_url}),alt:``,width:44,height:44}),(0,W.jsxs)(De,{children:[(0,W.jsx)(Oe,{children:t.name}),t.is_current?(0,W.jsx)(ke,{children:e({id:`leaderboard-you`})}):null]}),(0,W.jsx)(Ae,{children:me(t.xp)})]},`${t.student_id}-${t.rank}`)})})]})]}),(0,W.jsx)(f,{children:(0,W.jsxs)(Me,{"aria-label":e({id:S(a)}),children:[(0,W.jsxs)(Ne,{children:[(0,W.jsx)(Pe,{children:e({id:S(a)})}),(0,W.jsx)(Fe,{children:e({id:x(o)})})]}),(0,W.jsxs)(Ie,{children:[(0,W.jsxs)(Le,{children:[(0,W.jsx)(Re,{src:c({photoUrl:J.photo_url}),alt:``,width:100,height:98}),(0,W.jsx)(ze,{children:e({id:`leaderboard-level-badge`},{level:J.level})})]}),(0,W.jsx)(Be,{children:J.name})]}),(0,W.jsxs)(Ve,{children:[(0,W.jsxs)(R,{children:[(0,W.jsxs)(V,{children:[(0,W.jsxs)(z,{children:[e({id:`leaderboard-rank-label`}),`:`]}),(0,W.jsx)(B,{children:J.rank==null?`—`:`#${J.rank}`})]}),Z.visible?(0,W.jsxs)(H,{$direction:Z.direction??`flat`,children:[Z.direction===`up`?(0,W.jsx)(U,{src:G,alt:``}):Z.direction===`down`?(0,W.jsx)(U,{src:G,alt:``,$down:!0}):null,(0,W.jsx)(`span`,{children:Z.direction===`flat`?e({id:`leaderboard-places-flat`}):e({id:Z.direction===`up`?`leaderboard-places-up`:`leaderboard-places-down`},{count:Z.places})})]}):null]}),(0,W.jsxs)(R,{children:[(0,W.jsxs)(V,{children:[(0,W.jsxs)(z,{children:[e({id:`dashboard-total-points`}),`:`]}),(0,W.jsx)(B,{children:J.total_xp})]}),(0,W.jsxs)(H,{$direction:`up`,children:[(0,W.jsx)(U,{src:G,alt:``}),(0,W.jsx)(`span`,{children:e({id:`leaderboard-points-delta`},{points:he(J.range_xp)})})]})]})]}),(0,W.jsxs)(He,{children:[(0,W.jsx)(`img`,{src:Ke,alt:``}),(0,W.jsx)(`span`,{children:e({id:`leaderboard-streak`},{count:J.current_streak})})]}),(0,W.jsx)(Ue,{to:`/profile`,children:e({id:`leaderboard-view-profile`})})]})})]})}export{K as default};