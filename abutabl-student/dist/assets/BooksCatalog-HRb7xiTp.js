import{c as e,f as t,h as n,r,t as i}from"./jsx-runtime-BFsvmiJY.js";import{t as a}from"./useIntl-BWNRJaAP.js";import{r as o}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as s,t as c}from"./figmaAssets-DZM6ZDBD.js";import{n as l}from"./global-styles-8ZhPevyo.js";import{t as u}from"./studentApiResponse-BAEG6iMr.js";import{S as d}from"./index-DJ-Mxe_T.js";import{t as f}from"./myProgressApi-B4R1aLbX.js";import{t as p}from"./useDashboardData-C7NZYEuh.js";import{m,n as h,p as g,v as _}from"./myProgressUtils-Cs40We8S.js";var v=n(t(),1),y=`/learn/books`;function b(e){return e?.available===!0&&typeof e.path==`string`&&e.path.trim()?e.path.trim():y}function ee(e,t){if(!e.length)return null;let n=Number(t?.subject_id);if(t?.available===!0&&Number.isFinite(n)&&n>0){let t=e.find(e=>e.subject_id===n);if(t)return t}return e.find(e=>_(e))??e[0]??null}function x(e,t){let n=typeof e?.title==`string`&&e.title.trim()||typeof e?.lesson_title==`string`&&e.lesson_title.trim()||``;if(n)return n;let r=t?.next_goal;if(r?.available){let e=r.title?.trim()||r.lesson_title?.trim()||``;if(e)return e}return null}function S(e){return`/learn/${e}`}var C=[`teal`,`sand`,`lavender`];function w(e){return C[Math.abs(e)%C.length]??`teal`}var T={teal:`#E6F7F4`,sand:`#FFF4D6`,lavender:`#EFE8FF`},te={teal:`#1EBBA3`,sand:`#E89D2C`,lavender:`#7B6CF6`},ne={teal:`#1EBBA3`,sand:`#FFC234`,lavender:`#7B6CF6`},E=o.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr);
	min-width: 0;
	width: 100%;
	font-family: ${l.fonts.Nunito};
	box-sizing: border-box;
`,D=o.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border-radius: 20px;
	overflow: visible;
	background: ${l.colours.PaoloVeroneseGreen};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
`,O=o.section`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 28px;
	margin: ${24}px ${24}px ${24}px;
	padding: 22px 24px 28px;
	border-radius: 24px;
	background: ${l.colours.Lotion};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;
	/* Let hero bird hang past the board onto the green chrome. */
	overflow: visible;

	@media (max-width: 640px) {
		margin: 12px;
		padding: 16px 14px 20px;
		gap: 20px;
	}
`,k=o.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin: ${24}px ${24}px 0;
	padding: 12px 16px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.92);
	color: ${l.colours.error};
	font-size: 14px;

	button {
		border: none;
		background: ${l.colours.LightSeaGreen};
		color: ${l.colours.white};
		border-radius: 999px;
		padding: 8px 14px;
		cursor: pointer;
		font-family: ${l.fonts.Nunito};
		font-weight: 700;
	}
`,A=o.p`
	margin: ${24}px;
	padding: 24px;
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.92);
	text-align: center;
	color: ${l.colours[`Grey-body`]};
	font-size: 15px;
`;o.footer`
	padding: 8px 24px 20px;
	text-align: center;
	font-family: ${l.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: rgba(255, 255, 255, 0.88);
`;var j=o.section`
	position: relative;
	z-index: 3;
	width: calc(100% + 24px + ${24}px);
	max-width: none;
	margin: 0;
	margin-inline-end: calc(-24px - ${24}px);
	padding: 0;
	background: transparent;
	box-sizing: border-box;
	overflow: visible;

	@media (max-width: 640px) {
		width: calc(100% + 14px + 12px);
		margin-inline-end: calc(-14px - 12px);
	}
`,M=o.img`
	display: block;
	width: 100%;
	height: auto;
	aspect-ratio: 1024 / 419;
	object-fit: fill;
	object-position: center;
	pointer-events: none;
	user-select: none;

	[dir='rtl'] & {
		transform: scaleX(-1);
	}
`,N=o.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	box-sizing: border-box;
	/* Inset to sit inside the cream frame of the art */
	padding: 5.2% 4.5% 6% 5%;
	pointer-events: none;

	> * {
		pointer-events: auto;
	}

	@media (max-width: 900px) {
		padding: 16px 16px 18px;
	}
`,P=o.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	width: min(560px, 58%);
	max-width: 100%;
	min-width: 0;
	text-align: start;

	@media (max-width: 900px) {
		width: 100%;
	}
`,F=o.p`
	margin: 0;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: clamp(11px, 1.2vw, 13px);
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #442817;
`,I=o.h1`
	margin: 0;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(24px, 3.2vw, 34px);
	line-height: 1.12;
	color: #442817;
`,L=o.p`
	margin: 0;
	font-family: ${l.fonts.Nunito};
	font-size: clamp(13px, 1.5vw, 16px);
	line-height: 1.35;
	color: #5c4030;
`,R=o.div`
	display: flex;
	align-items: flex-start;
	gap: clamp(14px, 1.8vw, 20px);
	margin-top: calc(30px + clamp(28px, 4.2vw, 48px));
	width: 100%;

	@media (max-width: 560px) {
		flex-direction: column;
		align-items: stretch;
		margin-top: 50px;
	}
`,z=o.img`
	width: 112px;
	height: 140px;
	object-fit: cover;
	border-radius: 14px;
	box-shadow: 0 8px 14px rgba(68, 40, 23, 0.18);
	flex-shrink: 0;
	background: #fff;
`,B=o.div`
	width: 112px;
	height: 140px;
	border-radius: 14px;
	flex-shrink: 0;
	background: linear-gradient(160deg, #1ebba3, #00907a);
`,V=o.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
`,H=o.h2`
	margin: 0;
	max-width: 100%;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(17px, 2.1vw, 22px);
	line-height: 1.2;
	color: #442817;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`,U=o.p`
	margin: 0;
	max-width: 100%;
	font-family: ${l.fonts.Nunito};
	font-size: clamp(13px, 1.4vw, 15px);
	line-height: 1.35;
	color: #6b4a2e;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`,W=o.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	max-width: 320px;
	margin-top: 4px;
	padding-bottom: 4px;
	overflow: visible;
`,G=o.p`
	margin: 0;
	align-self: flex-end;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	line-height: 1;
	color: ${l.colours.LightSeaGreen};
`,K=o.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: rgba(68, 40, 23, 0.12);
	overflow: hidden;
`,re=o.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: ${l.colours.LightSeaGreen};
`,q=o(r)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-top: 2px;
	margin-bottom: 4px;
	padding: 12px 16px;
	border: none;
	border-radius: 18px;
	background: ${l.colours.LightSeaGreen};
	color: ${l.colours.white};
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(15px, 1.6vw, 17px);
	line-height: 1;
	text-decoration: none;
	text-transform: none;
	letter-spacing: 0;
	box-shadow: 0 4px 0 ${l.colours.PaoloVeroneseGreen};

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,J=o.div`
	position: absolute;
	z-index: 3;
	top: auto;
	bottom: 27%;
	inset-inline-end: 15%;
	max-width: 128px;
	padding: 12px 14px;
	border-radius: 18px;
	background: ${l.colours.white};
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: clamp(12px, 1.25vw, 14px);
	line-height: 1.25;
	color: #442817;
	text-align: center;
	white-space: pre-line;
	pointer-events: none;

	&::after {
		content: '';
		position: absolute;
		inset-inline-end: 18px;
		bottom: -7px;
		border-width: 8px 6px 0 6px;
		border-style: solid;
		border-color: ${l.colours.white} transparent transparent transparent;
	}

	@media (max-width: 900px) {
		bottom: 30%;
		inset-inline-end: 12%;
		max-width: 120px;
		padding: 10px 12px;
	}

	@media (max-width: 560px) {
		display: none;
	}
`,Y=o.section`
	display: flex;
	flex-direction: column;
	gap: 18px;
`,X=o.h2`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(22px, 3vw, 28px);
	line-height: 1.2;
	color: #442817;
	text-align: start;

	img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
`,ie=o.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18px;

	@media (max-width: 1100px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`,ae=o.article`
	position: relative;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	padding-bottom: 20px;
	border-radius: 22px;
	background: ${({$theme:e})=>T[e]};
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
	box-sizing: border-box;
	min-width: 0;
	overflow: visible;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,oe=o.div`
	display: contents;
`,se=o.img`
	width: 72px;
	height: 90px;
	object-fit: cover;
	border-radius: 12px;
	flex-shrink: 0;
	background: #fff;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`,ce=o.div`
	width: 72px;
	height: 90px;
	border-radius: 12px;
	flex-shrink: 0;
	background: linear-gradient(160deg, #1ebba3, #00907a);
`,le=o.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
	overflow: visible;
	text-align: start;
`,ue=o.h3`
	margin: 0;
	max-width: 100%;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	color: #442817;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
	word-break: break-word;
`,de=o.p`
	margin: 0;
	max-width: 100%;
	font-family: ${l.fonts.Nunito};
	font-size: 13px;
	line-height: 1.35;
	color: #6b4a2e;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	overflow-wrap: anywhere;
	word-break: break-word;
`,fe=o.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
	margin-top: 4px;
	overflow: visible;
`,pe=o.p`
	margin: 0;
	align-self: flex-end;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: ${l.colours.LightSeaGreen};
`,me=o.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: rgba(68, 40, 23, 0.1);
	overflow: hidden;
`,he=o.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: ${({$theme:e})=>ne[e]};
`,Z=o(r)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-top: 4px;
	margin-bottom: 2px;
	padding: 11px 14px;
	border: none;
	border-radius: 18px;
	background: ${({$theme:e})=>te[e]};
	color: ${l.colours.white};
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: 15px;
	line-height: 1;
	text-decoration: none;
	box-shadow: 0 4px 0
		${({$theme:e})=>e===`teal`?l.colours.PaoloVeroneseGreen:e===`sand`?`#c8841f`:`#5b4ed0`};

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,Q=i(),ge=s(`book-cover-boy-bird.svg`);function _e({book:t,index:n}){let{formatMessage:r}=a(),i=e(),o=w(n),s=h(t),c=S(t.subject_id),l=t.photo?.trim()||null,[u,d]=(0,v.useState)(!1),f=l&&!u?l:ge,p=()=>{i(c)};return(0,Q.jsx)(ae,{$theme:o,"data-subject-id":t.subject_id,role:`link`,tabIndex:0,onClick:p,onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),p())},children:(0,Q.jsxs)(oe,{children:[f?(0,Q.jsx)(se,{src:f,alt:``,onError:()=>{l&&!u&&d(!0)}}):(0,Q.jsx)(ce,{"aria-hidden":!0}),(0,Q.jsxs)(le,{children:[(0,Q.jsx)(ue,{children:t.title}),t.description?(0,Q.jsx)(de,{children:t.description}):null,(0,Q.jsxs)(fe,{children:[(0,Q.jsx)(pe,{children:r({id:`my-progress-units`},{progress:g(t.units_completed,t.units_total)})}),(0,Q.jsx)(me,{"aria-label":m(t.units_completed,t.units_total),children:(0,Q.jsx)(he,{$percent:s,$theme:o})})]}),(0,Q.jsx)(Z,{to:c,$theme:o,onClick:e=>{e.stopPropagation()},children:r({id:`my-progress-continue-learning`})})]})]})})}var ve=s(`book-cover-boy-bird.svg`),ye=c(`my-books-hero-banner.png`);function be({heroBook:e,continueLearning:t,studentName:n}){let{formatMessage:r}=a(),[i,o]=(0,v.useState)(!1),s=b(t),c=x(t,e),l=e?h(e):0,u=e?.photo?.trim()||null,d=u&&!i?u:ve,f=n.trim()||r({id:`my-progress-student-fallback`});return(0,Q.jsxs)(j,{"data-testid":`my-books-hero`,"aria-labelledby":`my-books-hero-title`,children:[(0,Q.jsx)(M,{src:ye,alt:``,decoding:`async`}),(0,Q.jsxs)(N,{children:[(0,Q.jsxs)(P,{children:[(0,Q.jsx)(F,{children:r({id:`my-books-recently-opened`})}),(0,Q.jsx)(I,{id:`my-books-hero-title`,children:r({id:`my-books-continue-journey`})}),(0,Q.jsx)(L,{children:c?r({id:`my-books-on-lesson`},{lesson:c}):r({id:`my-books-keep-going`})}),e?(0,Q.jsxs)(R,{children:[d?(0,Q.jsx)(z,{src:d,alt:``,onError:()=>{u&&!i&&o(!0)}}):(0,Q.jsx)(B,{"aria-hidden":!0}),(0,Q.jsxs)(V,{children:[(0,Q.jsx)(H,{children:e.title}),e.description?(0,Q.jsx)(U,{children:e.description}):null,(0,Q.jsxs)(W,{children:[(0,Q.jsx)(G,{children:r({id:`my-progress-units`},{progress:g(e.units_completed,e.units_total)})}),(0,Q.jsx)(K,{"aria-label":m(e.units_completed,e.units_total),children:(0,Q.jsx)(re,{$percent:l})}),(0,Q.jsx)(q,{to:s,children:r({id:`my-progress-continue-learning`})})]})]})]}):(0,Q.jsx)(q,{to:s,children:r({id:`my-progress-continue-learning`})})]}),(0,Q.jsx)(J,{"aria-hidden":!0,children:r({id:`my-books-bird-finish`},{name:f})})]})]})}var $=c(`star-6-1.svg`);function xe(){let{formatMessage:e}=a(),{data:t,initialLoading:n,error:r,retry:i}=p(`week`),[o,s]=(0,v.useState)(null),[c,l]=(0,v.useState)(!0),[m,h]=(0,v.useState)(null),[g,_]=(0,v.useState)(0);(0,v.useEffect)(()=>{let t=new AbortController;return l(!0),f(t.signal).then(e=>{t.signal.aborted||(s(e),h(null))}).catch(n=>{t.signal.aborted||(s(null),h(u(n,e({id:`my-books-load-error`}))))}).finally(()=>{t.signal.aborted||l(!1)}),()=>t.abort()},[e,g]);let y=()=>{_(e=>e+1),i()},b=o?.books??[],x=t?.continue_learning,S=(0,v.useMemo)(()=>ee(b,x),[b,x]);if(c&&!o||n&&!t)return(0,Q.jsx)(E,{children:(0,Q.jsx)(D,{children:(0,Q.jsx)(d,{})})});if(!o)return(0,Q.jsx)(E,{children:(0,Q.jsx)(D,{children:(0,Q.jsxs)(A,{children:[m??e({id:`my-books-load-error`}),m?(0,Q.jsxs)(Q.Fragment,{children:[` `,(0,Q.jsx)(`button`,{type:`button`,onClick:y,children:e({id:`dashboard-retry`})})]}):null]})})});let C=m||r;return(0,Q.jsx)(E,{"data-testid":`my-books-page`,children:(0,Q.jsxs)(D,{children:[C?(0,Q.jsxs)(k,{role:`alert`,children:[(0,Q.jsx)(`span`,{children:C}),(0,Q.jsx)(`button`,{type:`button`,onClick:y,children:e({id:`dashboard-retry`})})]}):null,(0,Q.jsxs)(O,{children:[(0,Q.jsx)(be,{heroBook:S,continueLearning:x,studentName:o.hero.name}),(0,Q.jsxs)(Y,{"aria-labelledby":`my-books-adventure-heading`,children:[(0,Q.jsxs)(X,{id:`my-books-adventure-heading`,children:[(0,Q.jsx)(`img`,{src:$,alt:``,"aria-hidden":!0}),e({id:`my-books-pick-adventure`}),(0,Q.jsx)(`img`,{src:$,alt:``,"aria-hidden":!0})]}),b.length===0?(0,Q.jsx)(`p`,{children:e({id:`my-progress-books-empty`})}):(0,Q.jsx)(ie,{children:b.map((e,t)=>(0,Q.jsx)(_e,{book:e,index:t},e.subject_id))})]})]})]})})}export{xe as default};