import{c as e,f as t,h as n,i as r,r as i,t as a}from"./jsx-runtime-BFsvmiJY.js";import{t as o}from"./useIntl-BWNRJaAP.js";import{r as s}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as c,t as l}from"./figmaAssets-DZM6ZDBD.js";import{n as u}from"./global-styles-8ZhPevyo.js";import{S as d}from"./index-DJ-Mxe_T.js";import{n as f}from"./styles-DnEtH5g-.js";import{t as p}from"./useDashboardData-C7NZYEuh.js";import{n as m,t as h}from"./TopRankingWidget-DEhNPUkR.js";import{o as g}from"./topRankingUtils-CmVn6Cmd.js";import{n as _}from"./profileApi-CKj-G933.js";import{t as v}from"./MyProgressAchievementsWidget-ChoaZFQt.js";var y=n(t(),1),b=a(),x=c(`hero-spark.png`),S=s.img`
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
`;function C({className:e}){return(0,b.jsx)(S,{className:e,src:x,alt:``,"aria-hidden":!0,decoding:`async`})}var w=l(`todo-bird-reading.svg`),T=s.section`
	position: relative;
	min-height: 308px;
	padding: 0 25px;
	overflow: visible;
	box-sizing: border-box;
`,E=s.div`
	position: relative;
	justify-self: end;
	width: min(433px, 100%);
	min-height: 343px;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		justify-self: center;
	}
`,D=s.div`
	position: relative;
	z-index: 1;
	width: 100%;
	aspect-ratio: 433 / 343;
	margin-top: 8px;
	margin-bottom: -44px;
	overflow: visible;

	@media (max-width: 720px) {
		margin-bottom: -28px;
	}
`,O=s.img`
	position: relative;
	z-index: 1;
	width: 100%;
	height: 100%;
	display: block;
	object-fit: contain;
	object-position: center bottom;
`,k=s.div`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(260px, 48%);
	align-items: start;
	gap: 8px;
	min-height: 308px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`,A=s.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding-top: 4px;
	max-width: 100%;
	text-align: start;
`,j=s.div`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	width: fit-content;
	max-width: 100%;
`,M=s.h1`
	margin: 0;
	padding: 0;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 64px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${u.colours.white};
	-webkit-text-stroke: 1px #492613;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #492613,
		-1px 0 0 #492613,
		0 1px 0 #492613,
		0 -1px 0 #492613,
		1px 1px 0 #492613,
		-1px 1px 0 #492613,
		1px -1px 0 #492613,
		-1px -1px 0 #492613;
`,N=s.span`
	display: block;
`,P=s.p`
	margin: 0;
	width: fit-content;
	max-width: 100%;
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`,F=s.h2`
	margin: 8px 0 0;
	font-family: ${u.fonts.Fredoka};
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
`;function I(){let{formatMessage:e,locale:t}=o(),n=(0,y.useRef)(null),r=(0,y.useRef)(null),i=(0,y.useRef)(null),a=e({id:`todo-got-this-line-1`}),s=e({id:`todo-got-this-line-2`}),c=e({id:`todo-got-this-subtitle`});return(0,y.useLayoutEffect)(()=>{let e=n.current,t=r.current;if(!e||!t)return;let a=()=>{let e=n.current,t=r.current,a=i.current;if(!e||!t||!a)return;let o=e.getBoundingClientRect().width;if(o<=0)return;let s=48,c=180,l=s;for(;s<=c;){let e=Math.floor((s+c)/2);t.style.fontSize=`${e}px`,a.getBoundingClientRect().width<=o?(l=e,s=e+1):c=e-1}t.style.fontSize=`${l}px`};a();let o=new ResizeObserver(a);return o.observe(e),()=>o.disconnect()},[t,a,s,c]),(0,b.jsx)(T,{"aria-label":e({id:`todo-got-this-title`}),children:(0,b.jsxs)(k,{children:[(0,b.jsxs)(A,{children:[(0,b.jsxs)(j,{children:[(0,b.jsxs)(M,{ref:r,children:[(0,b.jsx)(N,{children:a}),(0,b.jsx)(N,{ref:i,children:s})]}),(0,b.jsx)(P,{ref:n,children:c})]}),(0,b.jsx)(F,{children:e({id:`todo-my-assignments`})})]}),(0,b.jsx)(E,{"aria-hidden":!0,children:(0,b.jsxs)(D,{children:[(0,b.jsx)(C,{}),(0,b.jsx)(O,{src:w,alt:``,decoding:`async`})]})})]})})}var L=`tab`;function R(e){return e===`past_due`||e===`completed`?e:`todo`}function z(e){return e===`todo`?null:e}function B(e){return R(e.get(L))}function V(e,t){let n=new URLSearchParams(e),r=z(t);return r?n.set(L,r):n.delete(L),n}var H=s.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr) ${299}px;
	gap: ${24}px;
	min-width: 0;
	width: 100%;
	font-family: ${u.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 991px) {
		grid-template-columns: 1fr;
	}
`,U=s.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: hidden;
	background: ${u.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`,W=s.section`
	position: relative;
	z-index: 2;
	margin: 0 20px 20px;
	padding: 20px 24px 24px;
	border-radius: 20px;
	background: ${u.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 16px;
	}
`,G=s(i)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 16px;
	font-family: ${u.fonts.Nunito};
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
`;s.footer`
	padding: 8px 24px 20px;
	text-align: center;
	font-family: ${u.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: rgba(255, 255, 255, 0.88);
`;var K=s.div`
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
`,q=s.p`
	margin: 24px;
	font-family: ${u.fonts.Nunito};
	font-size: 15px;
	line-height: 1.5;
	color: ${u.colours.white};
	text-align: center;
`;function J(){let{formatMessage:t}=o(),n=e(),[i,a]=r(),s=B(i),{data:c,initialLoading:l,error:u,retry:x}=p(`week`),[S,C]=(0,y.useState)([]);(0,y.useEffect)(()=>{let e=!1;return _().then(t=>{e||C(t)}).catch(()=>{e||C([])}),()=>{e=!0}},[]);let w=(0,y.useMemo)(()=>c?c.assignments.tabs[s]??[]:[],[c,s]);return l&&!c?(0,b.jsxs)(H,{children:[(0,b.jsx)(U,{children:(0,b.jsx)(d,{})}),(0,b.jsx)(f,{"aria-hidden":!0})]}):c?(0,b.jsxs)(H,{children:[(0,b.jsxs)(U,{children:[u?(0,b.jsxs)(K,{role:`alert`,children:[(0,b.jsx)(`span`,{children:u}),(0,b.jsx)(`button`,{type:`button`,onClick:x,children:t({id:`dashboard-retry`})})]}):null,(0,b.jsx)(I,{}),(0,b.jsxs)(W,{children:[(0,b.jsx)(G,{to:`/learn`,children:t({id:`todo-back-dashboard`})}),(0,b.jsx)(m,{idPrefix:`todo`,embedded:!0,listMode:`full`,activeTab:s,items:w,onTabChange:e=>{a(V(i,e),{replace:!0})},onActionComplete:x})]})]}),(0,b.jsxs)(f,{children:[(0,b.jsx)(v,{hero:{level:c.xp.level,level_badge_label:c.xp.level_badge_label},items:S,onViewAll:()=>{n(`/progress#my-progress-achievements`)}}),(0,b.jsx)(h,{rankings:c.rankings}),(0,b.jsx)(g,{streak:c.streak})]})]}):(0,b.jsxs)(H,{children:[(0,b.jsx)(U,{children:(0,b.jsxs)(q,{children:[u??t({id:`dashboard-load-error`}),u?(0,b.jsxs)(b.Fragment,{children:[` `,(0,b.jsx)(`button`,{type:`button`,onClick:x,children:t({id:`dashboard-retry`})})]}):null]})}),(0,b.jsx)(f,{"aria-hidden":!0})]})}export{J as default};