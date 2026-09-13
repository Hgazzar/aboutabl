import{d as e,f as t,h as n,r,t as i}from"./jsx-runtime-BFsvmiJY.js";import{t as a}from"./useIntl-BWNRJaAP.js";import{n as o,r as s}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as c}from"./requests-CQDHe7xd.js";import{t as l}from"./figmaAssets-DZM6ZDBD.js";import{t as u,u as d}from"./studentAvatar-DwvNfQ5r.js";import{n as f}from"./global-styles-8ZhPevyo.js";import{n as p}from"./studentApiResponse-BAEG6iMr.js";import{t as m}from"./styles-DnEtH5g-.js";import{l as h}from"./myProgressBarUtils-Nmi-83O5.js";var g=n(t(),1),_=360,v=e=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 36' preserveAspectRatio='none'><path d='M0 22 C60 8 120 30 180 18 C240 6 300 28 360 14 L360 36 L0 36 Z' fill='${e}'/></svg>`)}")`,y={mint:o`
		background: linear-gradient(180deg, #e8f7f3 0%, #dff3ef 58%, #d4eee9 100%);

		&::after {
			background-image: ${v(`#b8e5dc`)};
		}
	`,cream:o`
		background: linear-gradient(180deg, #fff9eb 0%, #fdf2d8 72%, #f8ebc8 100%);

		&::after {
			background-image: ${v(`#efd9a8`)};
		}
	`,lavender:o`
		background: linear-gradient(180deg, #f3eefb 0%, #ebe3f8 72%, #e2d8f2 100%);

		&::after {
			background-image: ${v(`#d2c4ea`)};
		}
	`},b=o`
	position: relative;
	display: block;
	width: 100%;
	max-width: ${_}px;
	min-height: ${126}px;
	border-radius: 20px;
	overflow: hidden;
	box-shadow: 0 2px 14px rgba(68, 40, 23, 0.08);
	text-decoration: none;
	color: inherit;
	box-sizing: border-box;

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 36px;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		pointer-events: none;
	}
`,x=s(r)`
	${b};
	${({$theme:e})=>y[e]};
`,S=s.div`
	${b};
	min-height: ${70}px;
	max-width: ${356}px;
	border-radius: 16px;
	${({$theme:e})=>y[e]};

	&::after {
		height: 22px;
	}
`,C=s.div`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: 108px minmax(0, 1fr);
	grid-template-rows: 1fr auto;
	align-items: end;
	min-height: ${126}px;
	padding: 12px 16px 14px 8px;
	box-sizing: border-box;
`,w=s.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: ${70}px;
	padding: 10px 14px 10px 10px;
	box-sizing: border-box;
`,T=s.img`
	grid-row: 1 / span 2;
	grid-column: 1;
	width: 108px;
	height: 104px;
	object-fit: contain;
	object-position: left bottom;
	align-self: end;
`,E=s.img`
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	object-fit: contain;
`,D=s.div`
	grid-column: 2;
	grid-row: 1;
	align-self: center;
	padding-top: 4px;
	padding-inline-end: 56px;
`,O=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.35;
	color: #442817;

	strong {
		font-weight: 800;
		color: ${({$accent:e})=>e===`purple`?`#8e24aa`:`#23b8a2`};
	}
`,k=s.span`
	position: absolute;
	top: 14px;
	inset-inline-end: 16px;
	z-index: 2;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: #23b8a2;
`,ee=s.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: end;
	margin-top: 6px;
`,A=o`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 34px;
	padding: 0 16px;
	border-radius: 999px;
	font-family: ${f.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1;
	letter-spacing: 0.02em;
	text-transform: none;
	color: ${f.colours.white};
	white-space: nowrap;
`,j=s.span`
	${A};
	background: linear-gradient(180deg, #29c4ad 0%, #23b8a2 100%);
	box-shadow: 0 2px 0 #1a9a87;
`,te=s.span`
	${A};
	background: linear-gradient(180deg, #ffd054 0%, #eeae3e 100%);
	box-shadow: 0 2px 0 #c8841f;
`,ne=s.span`
	${A};
	background: linear-gradient(180deg, #ba68c8 0%, #8e24aa 100%);
	box-shadow: 0 2px 0 #6a1b9a;
`,re=s.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
`,ie=s.h2`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`,M=s.span`
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: #23b8a2;
`,ae=s.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
	padding-inline-end: 52px;
`,oe=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.3;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	strong {
		font-weight: 800;
		color: #23b8a2;
	}
`,se=s.span`
	font-family: ${f.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.2;
	color: #937c61;
`,ce=s.span`
	position: absolute;
	top: 12px;
	inset-inline-end: 14px;
	z-index: 2;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: #23b8a2;
`,le=s.div`
	margin-bottom: 14px;
`,ue=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-size: 14px;
	line-height: 1.4;
	color: #937c61;
`,de=n(e(),1);async function fe(e){let t=p(await c(`friends`,void 0,void 0,e),`friends`);return{available:t.available===!0,items:Array.isArray(t.items)?t.items.map(pe):[]}}function pe(e){let t=Math.max(0,Number(e.current_streak)||0);return{student_id:Number(e.student_id)||0,name:typeof e.name==`string`?e.name:``,photo_url:typeof e.photo_url==`string`&&e.photo_url.trim()?e.photo_url:null,current_streak:t,streak_active:e.streak_active===!0||t>0}}async function me(e,t,n){return p(await c(`/student/streak/calendar`,{year:e,month:t},void 0,n),`streak_calendar`)}function he(e){return e.available===!0&&e.current_streak>0}function N(e){return he(e)}function P(e){return!e.available||e.current_streak<=0?`dashboard-streak-empty`:e.today_completed?`dashboard-streak-done-today`:`dashboard-streak-extend`}function F(e){return!e||e.length===0?I():e.slice(0,7)}function I(){return[`M`,`T`,`W`,`T`,`F`,`S`,`S`].map(e=>({label:e,date:``,completed:!1,is_today:!1}))}var L=[`M`,`T`,`W`,`T`,`F`,`S`,`S`];function R(e,t){return(new Date(e,t-1,1).getDay()+6)%7}function ge(e,t){return new Date(e,t,0).getDate()}function _e(e,t,n){let r=new Map(n.map(e=>[e.date,e.status])),i=R(e,t),a=ge(e,t),o=[];for(let e=0;e<i;e++)o.push({day:null,date:null,status:null});for(let n=1;n<=a;n++){let i=`${e}-${String(t).padStart(2,`0`)}-${String(n).padStart(2,`0`)}`;o.push({day:n,date:i,status:r.get(i)??null})}for(;o.length%7!=0;)o.push({day:null,date:null,status:null});return o}function ve(e,t,n=new Date){let r=n.getFullYear(),i=n.getMonth()+1;return e<r?!0:e===r?t<i:!1}function z(e,t,n){let r=new Date(e,t-1+n,1);return{year:r.getFullYear(),month:r.getMonth()+1}}function B(){return{status:`idle`,payload:null,error:null}}function ye(e,t){return e!==`friends`||t.status===`loading`||t.status===`success`||t.status===`error`?!1:t.status===`idle`}function be(e){return!!e&&Array.isArray(e.items)&&e.items.length===0}function xe(e){return!e||!Array.isArray(e.items)?[]:e.items.filter(e=>e.student_id>0)}var V=i(),Se=l(`bomb-explode-5.svg`),Ce=l(`streak-friends.png`),we=l(`streak-no-friends.png`),Te=l(`streak-friend-flame.png`),H=`#F3AF8B`,U=`#23B8A2`,W=`#111111`,Ee=`#D55816`,De=`#B0B0B0`,Oe=`#CCCCCC`,ke=s.div`
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	background: rgba(18, 12, 8, 0.55);
	box-sizing: border-box;
`,Ae=s.div`
	position: relative;
	width: min(${({$friends:e})=>e?`372px`:`390px`}, calc(100vw - 32px));
	max-height: calc(100vh - 48px);
	overflow: hidden;
	border-radius: ${({$friends:e})=>e?`28px`:`24px`};
	background: ${({$friends:e})=>e?H:`#ffffff`};
	box-shadow: 0 18px 48px rgba(68, 40, 23, 0.22);
	display: flex;
	flex-direction: column;
`,je=s.div`
	position: relative;
	z-index: 3;
	padding: ${({$friends:e})=>e?`14px 14px 0`:`18px 18px 0`};
	background: ${({$friends:e})=>e?H:`#fff8ef`};
`,Me=s.button`
	position: absolute;
	z-index: 5;
	left: ${({$friends:e})=>e?`10px`:`14px`};
	top: ${({$friends:e})=>e?`10px`:`14px`};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({$friends:e})=>e?`30px`:`32px`};
	height: ${({$friends:e})=>e?`30px`:`32px`};
	padding: 0;
	border: none;
	border-radius: 50%;
	background: #ffffff;
	color: ${({$friends:e})=>e?`#9a9a9a`:`#6b5a4a`};
	font-family: ${f.fonts.Nunito};
	font-size: ${({$friends:e})=>e?`20px`:`22px`};
	font-weight: 800;
	line-height: 1;
	cursor: pointer;
	box-shadow: ${({$friends:e})=>e?`0 1px 4px rgba(0, 0, 0, 0.08)`:`0 2px 8px rgba(68, 40, 23, 0.12)`};

	&:focus-visible {
		outline: 2px solid ${f.colours.LightSeaGreen};
		outline-offset: 2px;
	}
`,Ne=s.h2`
	margin: ${({$friends:e})=>e?`0 0 10px`:`0 0 14px`};
	padding-top: 4px;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: ${({$friends:e})=>e?`24px`:`22px`};
	line-height: 1.2;
	color: ${({$friends:e})=>e?W:`#442817`};
	text-align: center;
`,Pe=s.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	border-bottom: ${({$friends:e})=>e?`none`:`1px solid rgba(68, 40, 23, 0.12)`};
`,G=s.button`
	padding: ${({$friendsChrome:e})=>e?`10px 8px 11px`:`10px 8px 12px`};
	border: none;
	background: transparent;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: ${({$friendsChrome:e})=>e?`12px`:`11px`};
	letter-spacing: 0.06em;
	color: ${({$active:e,$friendsChrome:t})=>t?e?U:W:e?f.colours.LightSeaGreen:`#442817`};
	cursor: pointer;
	border-bottom: ${({$active:e,$friendsChrome:t})=>t?e?`3px solid ${U}`:`1px solid rgba(0, 0, 0, 0.12)`:e?`3px solid ${f.colours.LightSeaGreen}`:`3px solid rgba(68, 40, 23, 0.12)`};
	margin-bottom: ${({$friendsChrome:e,$active:t})=>e&&!t?`2px`:`0`};

	&:focus-visible {
		outline: 2px solid ${f.colours.LightSeaGreen};
		outline-offset: -2px;
	}
`,K=s.div`
	position: relative;
	min-height: ${({$friends:e,$empty:t})=>e?t?`168px`:`138px`:`108px`};
	padding: ${({$friends:e,$empty:t})=>e?t?`10px 12px 0`:`4px 8px 8px`:`18px 20px`};
	background: ${({$friends:e})=>e?H:`#fff4d6`};
	overflow: hidden;
	display: flex;
	align-items: ${({$friends:e})=>e?`flex-end`:`center`};
	justify-content: ${({$friends:e})=>e?`center`:`flex-start`};
`,Fe=s.img`
	position: absolute;
	right: -8px;
	top: 50%;
	transform: translateY(-50%);
	width: 120px;
	height: 120px;
	opacity: 0.35;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
`,q=s.p`
	position: relative;
	z-index: 1;
	margin: 0;
	max-width: 62%;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 28px;
	line-height: 1.15;
	color: #d9a56d;
`,Ie=s.img`
	display: block;
	width: ${({$empty:e})=>e?`132px`:`min(300px, 90%)`};
	height: auto;
	max-height: ${({$empty:e})=>e?`152px`:`126px`};
	object-fit: contain;
	object-position: center bottom;
	pointer-events: none;
	user-select: none;
	/* Empty: keep green bottom flush with peach→white edge (no sink into white). */
	transform: none;
	margin-bottom: 0;
`,J=s.div`
	padding: ${({$friends:e,$empty:t})=>e?t?`20px 14px 30px`:`14px 14px 18px`:`18px 18px 22px`};
	overflow-y: auto;
	background: #ffffff;
	border-radius: ${({$friends:e})=>e?`18px 18px 0 0`:`20px 20px 0 0`};
	margin-top: ${({$friends:e,$empty:t})=>e?t?`0`:`-8px`:`-12px`};
	position: relative;
	z-index: 1;
	flex: 1;
	min-height: 0;
`,Le=s.h3`
	margin: 0 0 12px;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.2;
	color: #442817;
`,Re=s.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18px;
	margin-bottom: 14px;
`,Y=s.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	border: none;
	background: transparent;
	color: #b7a996;
	font-size: 20px;
	line-height: 1;
	cursor: pointer;

	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid ${f.colours.LightSeaGreen};
		outline-offset: 2px;
		border-radius: 4px;
	}
`,ze=s.span`
	min-width: 120px;
	text-align: center;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.08em;
	color: #9a8775;
`,Be=s.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	margin-bottom: 8px;
`,Ve=s.span`
	text-align: center;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	color: #c9b9a8;
`,He=s.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	row-gap: 10px;
`,Ue=s.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 34px;
`,We=s.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: ${({$status:e})=>e===`completed`||e===`today_pending`?`#ffffff`:`#b7a996`};
	background: ${({$status:e})=>e===`completed`?`#e86f2a`:e===`today_pending`?`#4a4a4a`:`transparent`};
`,X=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-size: 13px;
	color: #937c61;
	text-align: center;
`,Ge=s.h3`
	margin: 4px 0 10px;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.2;
	color: ${W};
`,Ke=s.ul`
	list-style: none;
	margin: 0;
	padding: 0 10px;
	border: 1px solid ${Oe};
	border-radius: 12px;
	background: #ffffff;
	max-height: min(360px, 48vh);
	overflow-y: auto;
`,qe=s.li`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 2px;

	&:not(:last-child) {
		border-bottom: 1px solid #e0e0e0;
	}
`,Je=s.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
	background: #efe8ff;
	box-shadow: 0 2px 8px rgba(68, 40, 23, 0.18);
`,Ye=s.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`,Xe=s.span`
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.15;
	color: ${W};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`,Ze=s.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	color: ${({$active:e})=>e?Ee:De};
`,Qe=s.img`
	width: 13px;
	height: 15px;
	object-fit: contain;
	filter: ${({$active:e})=>e?`none`:`grayscale(1) opacity(0.72) brightness(1.2)`};
`,$e=s.h3`
	margin: 14px 0 12px;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: ${W};
	text-align: center;
`,et=s.p`
	margin: 0 auto;
	max-width: 320px;
	font-family: ${f.fonts.Nunito};
	font-weight: 500;
	font-size: 14px;
	line-height: 1.45;
	color: ${W};
	text-align: center;
`;function tt(e,t,n){let r=new Date(e,t-1,1);return new Intl.DateTimeFormat(n,{month:`long`,year:`numeric`}).format(r).toUpperCase()}function nt(e){return e?.trim()?d({photoUrl:e}):u}function Z({opened:e,onClose:t,streak:n}){let{formatMessage:r,locale:i}=a(),o=(0,g.useMemo)(()=>new Date,[e]),[s,c]=(0,g.useState)(`personal`),[l,u]=(0,g.useState)(o.getFullYear()),[d,f]=(0,g.useState)(o.getMonth()+1),[p,m]=(0,g.useState)(null),[h,_]=(0,g.useState)(!1),[v,y]=(0,g.useState)(null),[b,x]=(0,g.useState)(B),S=(0,g.useRef)(!1);(0,g.useEffect)(()=>{if(!e)return;let t=document.body.style.overflow;return document.body.style.overflow=`hidden`,()=>{document.body.style.overflow=t}},[e]),(0,g.useEffect)(()=>{e&&(c(`personal`),u(o.getFullYear()),f(o.getMonth()+1),x(B()),S.current=!1)},[e,o]),(0,g.useEffect)(()=>{if(!e||s!==`personal`)return;let t=new AbortController;return _(!0),y(null),me(l,d,t.signal).then(e=>{m(e)}).catch(e=>{t.signal.aborted||(y(e instanceof Error?e.message:r({id:`dashboard-streak-popup-load-error`})),m(null))}).finally(()=>{t.signal.aborted||_(!1)}),()=>t.abort()},[e,s,l,d,r]),(0,g.useEffect)(()=>{if(!e||s!==`friends`||S.current||!ye(s,b))return;let t=new AbortController;return x({status:`loading`,payload:null,error:null}),fe(t.signal).then(e=>{S.current=!0,x({status:`success`,payload:e,error:null})}).catch(e=>{t.signal.aborted||(S.current=!0,x({status:`error`,payload:null,error:e instanceof Error?e.message:r({id:`dashboard-streak-friends-load-error`})}))}),()=>t.abort()},[e,s,r]);let C=(0,g.useMemo)(()=>p?_e(p.year,p.month,p.days):[],[p]),w=N(n),T=ve(l,d,o),E=xe(b.payload),D=be(b.payload),O=s===`friends`,k=O&&b.status===`success`&&D;return e?(0,de.createPortal)((0,V.jsx)(ke,{role:`presentation`,onMouseDown:e=>{e.target===e.currentTarget&&t()},children:(0,V.jsxs)(Ae,{role:`dialog`,"aria-modal":`true`,$friends:O,"aria-label":r({id:`dashboard-streak-popup-title`}),onMouseDown:e=>e.stopPropagation(),children:[(0,V.jsxs)(je,{$friends:O,children:[(0,V.jsx)(Me,{type:`button`,$friends:O,onClick:t,"aria-label":r({id:`dashboard-streak-popup-close`}),children:`×`}),(0,V.jsx)(Ne,{$friends:O,children:r({id:`dashboard-streak-popup-title`})}),(0,V.jsxs)(Pe,{$friends:O,children:[(0,V.jsx)(G,{type:`button`,$active:s===`personal`,$friendsChrome:O,"aria-current":s===`personal`?`page`:void 0,onClick:()=>c(`personal`),children:r({id:`dashboard-streak-tab-personal`})}),(0,V.jsx)(G,{type:`button`,$active:s===`friends`,$friendsChrome:O,"aria-current":s===`friends`?`page`:void 0,onClick:()=>c(`friends`),children:r({id:`dashboard-streak-tab-friends`})})]})]}),s===`personal`?(0,V.jsxs)(V.Fragment,{children:[(0,V.jsxs)(K,{children:[(0,V.jsx)(Fe,{src:Se,alt:``,"aria-hidden":!0}),w?(0,V.jsx)(q,{children:r({id:`dashboard-streak-days`},{count:n.current_streak})}):(0,V.jsx)(q,{children:r({id:`dashboard-streak-empty`})})]}),(0,V.jsxs)(J,{children:[(0,V.jsx)(Le,{children:r({id:`dashboard-streak-calendar-heading`})}),(0,V.jsxs)(Re,{children:[(0,V.jsx)(Y,{type:`button`,"aria-label":r({id:`dashboard-streak-calendar-prev`}),onClick:()=>{let e=z(l,d,-1);u(e.year),f(e.month)},children:`‹`}),(0,V.jsx)(ze,{children:tt(l,d,i)}),(0,V.jsx)(Y,{type:`button`,"aria-label":r({id:`dashboard-streak-calendar-next`}),disabled:!T,onClick:()=>{if(!T)return;let e=z(l,d,1);u(e.year),f(e.month)},children:`›`})]}),(0,V.jsx)(Be,{children:L.map((e,t)=>(0,V.jsx)(Ve,{children:e},`${e}-${t}`))}),h?(0,V.jsx)(X,{children:r({id:`dashboard-streak-calendar-loading`})}):v?(0,V.jsx)(X,{children:v}):(0,V.jsx)(He,{children:C.map((e,t)=>(0,V.jsx)(Ue,{children:e.day?(0,V.jsx)(We,{$status:e.status,children:e.day}):null},e.date??`pad-${t}`))})]})]}):(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(K,{$friends:!0,$empty:k,children:(0,V.jsx)(Ie,{$empty:k,src:k?we:Ce,alt:``,"aria-hidden":!0})}),(0,V.jsx)(J,{$friends:!0,$empty:k,children:b.status===`loading`||b.status===`idle`?(0,V.jsx)(X,{children:r({id:`dashboard-streak-friends-loading`})}):b.status===`error`?(0,V.jsx)(X,{children:b.error}):D?(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)($e,{children:r({id:`dashboard-streak-no-friends-title`})}),(0,V.jsx)(et,{children:r({id:`dashboard-streak-no-friends-body`})})]}):(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(Ge,{children:r({id:`dashboard-streak-friend-streaks`})}),(0,V.jsx)(Ke,{children:E.map(e=>(0,V.jsxs)(qe,{children:[(0,V.jsx)(Je,{src:nt(e.photo_url),alt:``}),(0,V.jsxs)(Ye,{children:[(0,V.jsx)(Xe,{children:e.name}),(0,V.jsxs)(Ze,{$active:e.streak_active,children:[(0,V.jsx)(Qe,{src:Te,$active:e.streak_active,alt:``,"aria-hidden":!0}),e.current_streak]})]})]},e.student_id))})]})})]})]})}),document.body):null}var rt=l(`bomb-explode-5.svg`),it=l(`ellipse-649.svg`),at=l(`ellipse-650.svg`),ot=s(m)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 20px 18px 18px;
`,st=s.h2`
	margin: 0 0 16px;
	font-family: ${f.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;
	text-align: center;
	text-transform: none;
`,Q=s.div`
	background: #f9f3e3;
	border-radius: 16px;
	padding: 14px 14px 12px;
`,ct=s(Q)`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
`,lt=s.img`
	width: ${({$size:e=56})=>e}px;
	height: ${({$size:e=56})=>e}px;
	flex-shrink: 0;
	object-fit: contain;
`,ut=s.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
`,dt=s.p`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: #e86f2a;
`,ft=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.35;
	color: #6b5a4a;
`,pt=s(Q)`
	padding: 12px 10px 10px;
`,mt=s.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	column-gap: 4px;
`,ht=s.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	min-width: 0;
`,gt=s.span`
	display: block;
	width: 100%;
	text-align: center;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: ${({$completed:e})=>e?`#e86f2a`:`#d4c4a8`};
`,_t=s.img`
	width: 34px;
	height: 34px;
	object-fit: contain;
	display: block;
`,vt=s.div`
	display: flex;
	justify-content: center;
	margin-top: 14px;
`,yt=s.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${f.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;function $({day:e}){return(0,V.jsxs)(ht,{children:[(0,V.jsx)(gt,{$completed:e.completed,children:e.label}),(0,V.jsx)(_t,{src:e.completed?it:at,alt:``,"aria-hidden":!0})]})}function bt({days:e}){return(0,V.jsx)(pt,{children:(0,V.jsx)(mt,{children:e.map(e=>(0,V.jsx)($,{day:e},e.date||e.label))})})}function xt({streak:e}){let{formatMessage:t}=a(),[n,r]=(0,g.useState)(!1),i=F(e.weekly_days),o=P(e),s=N(e);return(0,V.jsxs)(V.Fragment,{children:[(0,V.jsxs)(ot,{"aria-label":t({id:`dashboard-streak`}),children:[(0,V.jsx)(st,{children:t({id:`dashboard-streak`})}),(0,V.jsxs)(ct,{children:[(0,V.jsx)(lt,{src:rt,alt:``,"aria-hidden":!0}),(0,V.jsxs)(ut,{children:[s?(0,V.jsx)(dt,{children:t({id:`dashboard-streak-days`},{count:e.current_streak})}):null,(0,V.jsx)(ft,{children:t({id:o})})]})]}),(0,V.jsx)(bt,{days:i}),(0,V.jsx)(vt,{children:(0,V.jsx)(yt,{type:`button`,onClick:()=>r(!0),"aria-label":t({id:`dashboard-recent-view-more`}),children:(0,V.jsx)(M,{children:t({id:`dashboard-recent-view-more`})})})})]}),(0,V.jsx)(Z,{opened:n,onClose:()=>r(!1),streak:e})]})}var St=3;function Ct(e){return e.available===!0&&(e.items?.length??0)>0}function wt(e){return e.slice(0,St)}function Tt(e){return e===1?`gold`:e===2?`silver`:e===3?`bronze`:null}function Et(e){return h(e??0)}function Dt(e){return e===`gold`?`#e8c84a`:e===`silver`?`#b8c4d0`:`#d4a882`}export{w as C,le as D,x as E,ie as O,S,ce as T,ne as _,wt as a,se as b,T as c,C as d,D as f,j as g,te as h,Tt as i,M as k,E as l,k as m,Ct as n,xt as o,ee as p,Dt as r,Z as s,Et as t,O as u,ue as v,ae as w,re as x,oe as y};