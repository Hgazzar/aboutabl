import{f as e,h as t,i as n,l as r,r as i,t as a}from"./jsx-runtime-BFsvmiJY.js";import{t as o}from"./useIntl-BWNRJaAP.js";import{r as s}from"./styled-components.browser.esm-DYpzEdZF.js";import{M as c,j as l}from"./redux-toolkit.modern-gHnEhhdL.js";import{r as u,t as d}from"./figmaAssets-DZM6ZDBD.js";import{n as f}from"./global-styles-8ZhPevyo.js";import{t as p}from"./studentApiResponse-BAEG6iMr.js";import{S as m,d as ee,t as te}from"./index-DJ-Mxe_T.js";import{t as ne}from"./myProgressApi-B4R1aLbX.js";import{t as re}from"./useDashboardData-C7NZYEuh.js";import{t as h}from"./myProgressUtils-Cs40We8S.js";import{a as g,c as _}from"./myQuestsUtils-CyZSamSj.js";import{n as ie}from"./profileApi-CKj-G933.js";var v=t(e(),1),y=s.div`
	display: grid;
	grid-template-columns: minmax(${804}px, 1fr) ${299}px;
	gap: ${24}px;
	min-width: 0;
	width: 100%;
	font-family: ${f.fonts.Nunito};
	box-sizing: border-box;

	@media (max-width: 1100px) {
		grid-template-columns: 1fr;
	}
`,b=s.main`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	border-radius: 20px;
	background: ${f.colours.Lotion};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
	padding: 20px 22px 28px;
	box-sizing: border-box;
	/* Natural page growth — no nested scroll */
	overflow: visible;
`,ae=s.aside`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;

	@media (max-width: 1100px) {
		width: 100%;
	}
`,x=s(i)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	width: fit-content;
	font-family: ${f.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: ${f.colours.LightSeaGreen};
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
		border-radius: 6px;
	}
`,oe=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 12px;
	background: #fff5f5;
	color: ${f.colours.error};
	font-size: 14px;

	button {
		border: none;
		background: ${f.colours.LightSeaGreen};
		color: white;
		border-radius: 999px;
		padding: 8px 14px;
		cursor: pointer;
		font-weight: 700;
	}
`,S=s.p`
	margin: 0;
	padding: 24px;
	text-align: center;
	color: ${f.colours[`Grey-body`]};
	font-size: 15px;
`,C=s.section`
	position: relative;
	display: grid;
	grid-template-columns: ${({$theme:e})=>e===`math`||e===`science`?`minmax(150px, 34%) 1fr`:`auto 1fr`};
	gap: 20px;
	align-items: center;
	min-height: ${({$theme:e})=>e===`math`||e===`science`?`206px`:`168px`};
	padding: ${({$theme:e})=>e===`math`||e===`science`?`22px 28px 22px 18px`:`22px 24px`};
	border-radius: 24px;
	background-color: #ff9f43;
	background-image: ${({$bannerUrl:e,$theme:t})=>e?`url(${e})`:t===`default`||!t?`linear-gradient(120deg, #ff9f43 0%, #ffc234 55%, #ffe08a 100%)`:`none`};
	background-repeat: no-repeat;
	background-position: center;
	background-size: cover;
	overflow: hidden;
	box-sizing: border-box;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		min-height: 180px;
		padding: 18px 16px;
		text-align: start;
	}
`,w=s.img`
	width: 96px;
	height: 120px;
	object-fit: cover;
	border-radius: 14px;
	box-shadow: 0 8px 16px rgba(68, 40, 23, 0.2);
	background: #fff;
`,se=s.div`
	width: 96px;
	height: 120px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.35);
`,T=s.div`
	min-height: 120px;
	pointer-events: none;

	@media (max-width: 640px) {
		display: none;
	}
`,E=s.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	color: #fff;
	text-align: start;
	justify-content: center;
`,D=s.h1`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(26px, 3.5vw, 36px);
	line-height: 1.15;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
`,O=s.p`
	margin: 0;
	font-family: ${f.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	opacity: 0.95;
`,k=s.div`
	display: flex;
	align-items: center;
	gap: 14px;
	margin-top: 10px;
	width: min(420px, 100%);
	padding: 10px 14px;
	border-radius: 999px;
	background: ${({$theme:e})=>e===`science`?`rgba(255, 230, 245, 0.92)`:`rgba(255, 236, 210, 0.92)`};
	box-sizing: border-box;
`,A=s.p`
	margin: 0;
	flex-shrink: 0;
	font-size: 13px;
	font-weight: 800;
	color: ${({$theme:e})=>e===`science`?`#6b3a7a`:`#8a4a12`};
	white-space: nowrap;
`,j=s.div`
	flex: 1;
	min-width: 0;
	height: 10px;
	border-radius: 999px;
	background: ${({$theme:e})=>e===`science`?`rgba(107, 58, 122, 0.25)`:`rgba(90, 40, 10, 0.35)`};
	overflow: hidden;
`,M=s.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: ${({$theme:e})=>e===`science`?`#c45aad`:`#ff7a1a`};
`,N=s(i)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 6px;
	width: fit-content;
	padding: 10px 18px;
	border-radius: 999px;
	background: ${({$theme:e})=>e===`math`||e===`science`?`rgba(255, 255, 255, 0.95)`:`#fff`};
	color: ${({$theme:e})=>e===`science`?`#5b2d6b`:`#442817`};
	font-family: ${f.fonts.Fredoka};
	font-size: 15px;
	text-decoration: none;
	box-shadow: 0 3px 0 rgba(68, 40, 23, 0.15);

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,P=s.div`
	display: flex;
	align-items: center;
	gap: 8px;
	overflow-x: auto;
	padding-bottom: 4px;
	scrollbar-width: thin;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		height: 4px;
	}
`,F=s.button`
	flex: 0 0 auto;
	border: none;
	cursor: pointer;
	padding: 10px 16px;
	border-radius: 999px;
	font-family: ${f.fonts.Fredoka};
	font-size: 14px;
	background: ${({$active:e})=>e?`#0f7668`:`#fff`};
	color: ${({$active:e})=>e?`#fff`:`#6b7280`};
	box-shadow: ${({$active:e})=>e?`0 2px 0 rgba(15, 118, 104, 0.35)`:`0 0 0 1px #e5e7eb`};

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`,I=s(F)`
	background: #f3f4f6;
	color: #374151;
`,ce=s.header`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
	padding: 8px 0 4px;
`,le=s.h2`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, 2.5vw, 26px);
	color: #442817;
`,ue=s.p`
	margin: 0;
	font-size: 14px;
	color: #6b7280;
`,L=s.ol`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0;
	position: relative;
`,R=s.li`
	position: relative;
	display: grid;
	grid-template-columns: 28px 1fr;
	gap: 12px;
	padding-bottom: 14px;

	&:not(:last-child)::before {
		content: '';
		position: absolute;
		inset-inline-start: 12px;
		top: 28px;
		bottom: 0;
		width: 2px;
		background: #e5e7eb;
	}
`,z=s.span`
	width: 24px;
	height: 24px;
	border-radius: 999px;
	background: ${({$tone:e})=>e};
	box-shadow: 0 0 0 4px #fff;
	margin-top: 14px;
	z-index: 1;
`,B=s.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 18px;
	background: ${({$bg:e})=>e};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	min-width: 0;
`,V=s.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	text-align: start;
`,H=s.span`
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.7);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
`,U=s.p`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-size: 16px;
	color: #442817;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`,W=s.p`
	margin: 2px 0 0;
	font-size: 12px;
	color: #6b7280;
`,G=s(i)`
	flex-shrink: 0;
	padding: 8px 14px;
	border-radius: 999px;
	background: #0f7668;
	color: #fff;
	font-family: ${f.fonts.Fredoka};
	font-size: 13px;
	text-decoration: none;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`,K=s.a`
	flex-shrink: 0;
	padding: 8px 14px;
	border-radius: 999px;
	background: #0f7668;
	color: #fff;
	font-family: ${f.fonts.Fredoka};
	font-size: 13px;
	text-decoration: none;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
	}
`,q=s.section`
	background: ${f.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: 18px;
	box-sizing: border-box;
`,J=s.h2`
	margin: 0 0 12px;
	font-family: ${f.fonts.Fredoka};
	font-size: 18px;
	color: #442817;
	text-align: center;
`,Y=s.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 8px 0 4px;
`,de=s.img`
	width: min(180px, 100%);
	height: auto;
	object-fit: contain;
`,fe=s.p`
	margin: 0;
	font-family: ${f.fonts.Fredoka};
	font-size: 15px;
	color: #442817;
`,pe=s(i)`
	display: inline-block;
	margin-top: 12px;
	font-family: ${f.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	color: #3b82f6;
	text-decoration: none;
	text-align: center;
	width: 100%;
`,me=s.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 14px;
`,he=s.p`
	margin: 0;
	font-weight: 700;
	font-size: 13px;
	color: #442817;
`,ge=s.div`
	height: 8px;
	border-radius: 999px;
	background: #f3f4f6;
	overflow: hidden;
`,_e=s.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	background: ${f.colours.LightSeaGreen};
`,ve=s.div`
	display: flex;
	justify-content: center;
	gap: 6px;
	margin: 8px 0;
`,ye=s.span`
	width: 22px;
	height: 22px;
	border-radius: 999px;
	background: ${({$filled:e})=>e?`#fbbf24`:`#e5e7eb`};
	opacity: ${({$filled:e})=>e?1:.7};
`,X=a(),Z=[{bg:`#FFF4D6`,tone:`#F59E0B`},{bg:`#E6F7F4`,tone:`#1EBBA3`},{bg:`#F3F4F6`,tone:`#9CA3AF`},{bg:`#EFE8FF`,tone:`#7B6CF6`}];function be(e,t){switch(e){case`lesson_content`:return t({id:`book-details-kind-lesson`});case`quiz`:return t({id:`book-details-kind-quiz`});case`worksheet`:return t({id:`book-details-kind-worksheet`});case`game`:return t({id:`book-details-kind-game`});default:return``}}function xe(e){switch(e){case`lesson_content`:return`📘`;case`quiz`:return`?`;case`worksheet`:return`✎`;case`game`:return`◆`;default:return`•`}}function Se({activities:e}){let{formatMessage:t}=o();return e.length?(0,X.jsx)(L,{"data-testid":`book-details-timeline`,children:e.map(e=>{let n=Z[e.themeIndex%Z.length]??Z[0],r=t({id:`book-details-continue`});return(0,X.jsxs)(R,{children:[(0,X.jsx)(z,{$tone:n.tone,"aria-hidden":!0}),(0,X.jsxs)(B,{$bg:n.bg,children:[(0,X.jsxs)(V,{children:[(0,X.jsx)(H,{"aria-hidden":!0,children:xe(e.kind)}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(U,{children:e.title}),(0,X.jsx)(W,{children:be(e.kind,t)})]})]}),e.external?(0,X.jsx)(K,{href:e.href,target:`_blank`,rel:`noopener noreferrer`,children:r}):(0,X.jsx)(G,{to:e.href,children:r})]})]},e.key)})}):(0,X.jsx)(`p`,{children:t({id:`book-details-activities-empty`})})}var Ce=d(`recommended-bird-books.png`),Q=4;function we({bookTitle:e,achievements:t,quests:n}){let{formatMessage:r}=o(),i=h(t,Q),a=(n?.items??[]).slice(0,2);return(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(q,{"data-testid":`book-details-mascot`,children:(0,X.jsxs)(Y,{children:[(0,X.jsx)(de,{src:Ce,alt:``}),(0,X.jsx)(fe,{children:r({id:`book-details-current-book`})}),(0,X.jsx)(`p`,{style:{margin:0,textAlign:`center`,fontWeight:700,color:`#442817`},children:e})]})}),(0,X.jsxs)(q,{"data-testid":`book-details-achievements`,children:[(0,X.jsx)(J,{children:r({id:`my-progress-achievements-widget`})}),(0,X.jsx)(`p`,{style:{margin:0,textAlign:`center`,fontFamily:`Fredoka, sans-serif`,fontSize:18},children:r({id:`book-details-stars-caption`},{count:i})}),(0,X.jsx)(ve,{"aria-label":r({id:`my-progress-book-stars`},{filled:i,total:Q}),children:Array.from({length:Q},(e,t)=>(0,X.jsx)(ye,{$filled:t<i},t))}),(0,X.jsx)(pe,{to:`/progress#my-progress-achievements`,children:r({id:`my-progress-view-all`})})]}),(0,X.jsxs)(q,{"data-testid":`book-details-quests`,children:[(0,X.jsx)(J,{children:r({id:`dashboard-my-quests`})}),a.length===0?(0,X.jsx)(`p`,{style:{margin:0,textAlign:`center`,color:`#6b7280`,fontSize:13},children:r({id:`book-details-quests-empty`})}):a.map(e=>{let t=_(e),n=g(e);return(0,X.jsxs)(me,{children:[(0,X.jsx)(he,{children:r({id:`dashboard-quest-goal`},{unit:e.unit_label,subject:e.subject_name})}),(0,X.jsx)(ge,{children:(0,X.jsx)(_e,{$percent:n})}),(0,X.jsxs)(`span`,{style:{fontSize:12,fontWeight:700,color:`#6b7280`},children:[t.current,` / `,t.target]})]},e.id)}),(0,X.jsx)(pe,{to:`/learn`,children:r({id:`dashboard-view-more`})})]})]})}var Te=/\b(math|maths|mathematics|algebra|geometry|arithmetic)\b|رياض|حساب|جبر|هندس/i,Ee=/\b(science|scientist|biology|chemistry|physics|stem)\b|علوم|أحياء|كيمياء|فيزياء/i;function De(e){let t=(e??``).trim();return t?Te.test(t)?`math`:Ee.test(t)?`science`:`default`:`default`}function Oe(e){return e===`math`?d(`learn-subject-hero-math.png`):e===`science`?d(`learn-subject-hero-science.png`):null}var ke=u(`book-cover-boy-bird.svg`);function Ae({title:e,photo:t,activeUnitName:n,progressPercent:r,continuePath:i}){let{formatMessage:a}=o(),[s,c]=(0,v.useState)(!1),l=De(e),u=Oe(l),d=l===`math`||l===`science`,f=t&&!s?t:ke,p=r!=null&&Number.isFinite(r),m=p?Math.round(r):0;return(0,X.jsxs)(C,{"data-testid":`book-details-hero`,"data-hero-theme":l,$theme:l,$bannerUrl:u,children:[d?(0,X.jsx)(T,{"aria-hidden":!0}):f?(0,X.jsx)(w,{src:f,alt:``,onError:()=>{t&&!s&&c(!0)}}):(0,X.jsx)(se,{"aria-hidden":!0}),(0,X.jsxs)(E,{$theme:l,children:[(0,X.jsx)(D,{children:e}),n?(0,X.jsx)(O,{children:a({id:`book-details-active-unit`},{unit:n})}):null,p?d?(0,X.jsxs)(k,{$theme:l,children:[(0,X.jsx)(A,{$theme:l,children:a({id:`book-details-overall-progress`},{percent:m})}),(0,X.jsx)(j,{$theme:l,"aria-label":a({id:`book-details-overall-progress`},{percent:m}),children:(0,X.jsx)(M,{$percent:r,$theme:l})})]}):(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(A,{$theme:l,children:a({id:`book-details-overall-progress`},{percent:m})}),(0,X.jsx)(j,{$theme:l,"aria-label":a({id:`book-details-overall-progress`},{percent:m}),children:(0,X.jsx)(M,{$percent:r,$theme:l})})]}):null,i?(0,X.jsx)(N,{to:i,$theme:l,children:a({id:`my-progress-continue-learning`})}):null]})]})}var je=`/learn/books`;function Me(e){if(!e||typeof e!=`object`)return null;let t=e;return t.status===!1||!t.basic_info||!Number(t.basic_info.id)?null:t}function Ne(e){return Array.isArray(e)?e.filter(e=>e&&Number(e.id)>0):[]}function Pe(e,t){if(!e.length)return null;if(t){let n=Number(t),r=e.find(e=>e.id===n);if(r)return r.id}return e[0]?.id??null}function Fe(e,t){if(!Array.isArray(e)||t<=0)return null;let n=e.find(e=>e.subject_id===t);return n?{progress_percent:n.progress_percent,units_completed:n.units_completed,units_total:n.units_total,next_goal:n.next_goal}:null}function Ie(e,t){return`/learn/${e}/details/${t}`}function $(e,t){return`/learn/${e}/quiz/${t}`}function Le(e,t){return`/learn/${e}/detailsGame/${t}`}function Re(e){let{subjectId:t,unit:n,worksheets:r,games:i}=e,a=[],o=0,s=e=>{a.push({...e,themeIndex:o++})};for(let e of n.lessons??[]){let n=Array.isArray(e.contents)?e.contents:[];if(n.length!==0){for(let r of n){let i=Number(r.id);if(!Number.isFinite(i)||i<=0)continue;let a=n.length===1?e.name||r.name:`${e.name}: ${r.name}`;s({key:`content-${i}`,kind:`lesson_content`,title:a,href:Ie(t,i),external:!1})}for(let n of e.quizesLesson??[]){let e=Number(n.id);!Number.isFinite(e)||e<=0||s({key:`lesson-quiz-${e}`,kind:`quiz`,title:n.title||`Quiz ${e}`,href:$(t,e),external:!1})}}}for(let e of n.quizesUnit??[]){let n=Number(e.id);!Number.isFinite(n)||n<=0||s({key:`unit-quiz-${n}`,kind:`quiz`,title:e.title||`Quiz ${n}`,href:$(t,n),external:!1})}for(let e of r){let t=Number(e.id),n=typeof e.file_url==`string`?e.file_url.trim():``;!Number.isFinite(t)||t<=0||!n||s({key:`worksheet-${t}`,kind:`worksheet`,title:e.title||`Worksheet ${t}`,href:n,external:!0})}for(let e of i){let n=Number(e.id);!Number.isFinite(n)||n<=0||s({key:`game-${n}`,kind:`game`,title:e.name||`Game ${n}`,href:Le(t,n),external:!1})}return a}function ze(e,t=6){let n=e.slice(0,Math.max(0,t)),r=e.slice(Math.max(0,t));return{visible:n,overflow:r,overflowCount:r.length}}function Be(e){let{subjectId:t,continuePath:n,continueSubjectId:r,nextGoalPath:i,firstContentHref:a}=e;return r===t&&typeof n==`string`&&n.trim()?n.trim():typeof i==`string`&&i.trim()?i.trim():a}function Ve({units:e,activeUnitId:t,onSelect:n,expanded:r,onExpandOverflow:i}){let{formatMessage:a}=o(),{visible:s,overflowCount:c}=ze(e),l=r?e:s;return(0,X.jsxs)(P,{role:`tablist`,"aria-label":a({id:`book-details-units`}),children:[l.map((e,r)=>{let i=e.id===t;return(0,X.jsx)(F,{type:`button`,role:`tab`,"aria-selected":i,$active:i,onClick:()=>n(e.id),children:a({id:`book-details-unit-tab`},{n:r+1,name:e.name})},e.id)}),!r&&c>0?(0,X.jsx)(I,{type:`button`,onClick:i,$active:!1,children:a({id:`book-details-more-units`},{count:c})}):null]})}function He(){let{formatMessage:e}=o(),t=l(),{id:i}=r(),[a]=n(),s=a.get(`focusUnit`),u=a.get(`focusLesson`),d=c(e=>e.SubjectsReducer),f=c(e=>e.GamesReducer),[h,g]=(0,v.useState)(!0),[_,C]=(0,v.useState)(null),[w,se]=(0,v.useState)(0),[T,E]=(0,v.useState)(null),[D,O]=(0,v.useState)([]),[k,A]=(0,v.useState)(null),[j,M]=(0,v.useState)(!1),{data:N,error:P,retry:F}=re(`week`);(0,v.useEffect)(()=>{if(!i)return;let n=!1;return(async()=>{g(!0),C(null);try{let e={id:i};s?(e.type=`units`,e.type_id=s):u&&(e.type=`lessons`,e.type_id=u),await t(te(e)).unwrap(),await t(ee({id:i})).unwrap()}catch(t){n||C(p(t,e({id:`book-details-load-error`})))}finally{n||g(!1)}})(),()=>{n=!0}},[t,i,s,u,e,w]),(0,v.useEffect)(()=>{let e=new AbortController;return ne(e.signal).then(t=>{e.signal.aborted||E(t)}).catch(()=>{e.signal.aborted||E(null)}),()=>e.abort()},[w]),(0,v.useEffect)(()=>{let e=!1;return ie().then(t=>{e||O(t)}).catch(()=>{e||O([])}),()=>{e=!0}},[w]);let I=Me(d?.subjectDetailsData),L=(0,v.useMemo)(()=>Ne(I?.units),[I]);(0,v.useEffect)(()=>{A(Pe(L,s)),M(!1)},[L,s,i]);let R=L.find(e=>e.id===k)??L[0]??null,z=(0,v.useMemo)(()=>{let e=f?.gamesListData?.games;return Array.isArray(e)?e.map(e=>({id:Number(e.id),name:String(e.name??``),background:e.background??null,progress:e.progress??null})):[]},[f]),B=I?.worksheetsSubject??[],V=Number(i),H=Fe(T?.books,V),U=(0,v.useMemo)(()=>!R||!Number.isFinite(V)||V<=0?[]:Re({subjectId:V,unit:R,worksheets:B,games:z}),[R,V,B,z]),W=U.find(e=>e.kind===`lesson_content`&&!e.external)?.href??null,G=Be({subjectId:V,continuePath:N?.continue_learning?.path,continueSubjectId:N?.continue_learning?.subject_id??null,nextGoalPath:H?.next_goal?.available?H.next_goal.cta_path:null,firstContentHref:W}),K=()=>{se(e=>e+1),F()};if(!i)return(0,X.jsx)(y,{children:(0,X.jsx)(b,{children:(0,X.jsx)(S,{children:e({id:`book-details-load-error`})})})});if(h&&!I)return(0,X.jsx)(y,{children:(0,X.jsx)(b,{children:(0,X.jsx)(m,{})})});if(!I)return(0,X.jsx)(y,{"data-testid":`book-details-page`,children:(0,X.jsxs)(b,{children:[(0,X.jsx)(x,{to:je,children:e({id:`book-details-back-books`})}),(0,X.jsxs)(S,{children:[_??e({id:`book-details-access-denied`}),(_||P)&&(0,X.jsxs)(X.Fragment,{children:[` `,(0,X.jsx)(`button`,{type:`button`,onClick:K,children:e({id:`dashboard-retry`})})]})]})]})});let q=I.basic_info,J=typeof q.photo==`string`&&q.photo.trim()?q.photo.trim():null,Y=H?.progress_percent!=null&&Number.isFinite(H.progress_percent)?H.progress_percent:null;return(0,X.jsxs)(y,{"data-testid":`book-details-page`,children:[(0,X.jsxs)(b,{children:[(0,X.jsx)(x,{to:je,children:e({id:`book-details-back-books`})}),(_||P)&&(0,X.jsxs)(oe,{role:`alert`,children:[(0,X.jsx)(`span`,{children:_||P}),(0,X.jsx)(`button`,{type:`button`,onClick:K,children:e({id:`dashboard-retry`})})]}),(0,X.jsx)(Ae,{title:q.name,photo:J,activeUnitName:R?.name??null,progressPercent:Y,continuePath:G}),L.length===0?(0,X.jsx)(S,{children:e({id:`book-details-units-empty`})}):(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(Ve,{units:L,activeUnitId:R?.id??null,onSelect:A,expanded:j,onExpandOverflow:()=>M(!0)}),(0,X.jsxs)(ce,{children:[(0,X.jsx)(le,{children:R?.name}),(0,X.jsx)(ue,{children:e({id:`book-details-unit-activities-hint`})})]}),(0,X.jsx)(Se,{activities:U})]})]}),(0,X.jsx)(ae,{children:(0,X.jsx)(we,{bookTitle:q.name,achievements:D,quests:N?.quests})})]})}export{He as default};