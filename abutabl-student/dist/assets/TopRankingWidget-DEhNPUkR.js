import{r as e,t}from"./jsx-runtime-BFsvmiJY.js";import{t as n}from"./useIntl-BWNRJaAP.js";import{n as r,r as i}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as a}from"./figmaAssets-DZM6ZDBD.js";import{u as o}from"./studentAvatar-DwvNfQ5r.js";import{n as s}from"./global-styles-8ZhPevyo.js";import{o as c,t as l}from"./styles-DnEtH5g-.js";import{n as u,t as d}from"./AssignmentListActionControl-DJv7o6Mr.js";import{a as f,i as p,k as m,n as h,r as g,t as _}from"./topRankingUtils-CmVn6Cmd.js";var v=t(),y=32,b=24,x=16,S=i.section`
	background: ${s.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${b}px ${y}px;
	box-sizing: border-box;
`,C=i.h2`
	margin: 0 0 16px;
	font-family: ${s.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`,w=52,T=20,E=3,D=E*w+(E-1)*T,O=i.div`
	background: ${({$embedded:e})=>e?`transparent`:`#eef7fc`};
	border-radius: ${({$embedded:e})=>e?0:`${x}px`};
	padding: ${({$embedded:e})=>e?`0`:`20px 24px 16px`};
	box-sizing: border-box;
`,k=i.div`
	margin-top: 0;
`,A=i.div`
	margin-top: 16px;
`,j=i.div`
	margin-top: 16px;
	max-height: ${D}px;
	overflow-y: auto;
	overflow-x: hidden;
	overscroll-behavior: contain;
	padding-inline-end: 4px;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(3, 155, 229, 0.35);
	}
`,M=i.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: ${T}px;
`,N=i.div`
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 0;
	padding-bottom: 12px;
	border-bottom: 1px solid #cfe8f5;
`,P=i.button`
	position: relative;
	border: none;
	background: transparent;
	padding: 0 0 10px;
	font-family: ${s.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.25;
	color: #442817;
	cursor: pointer;

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		border-radius: 999px;
		background: ${({$active:e})=>e?`#039BE5`:`transparent`};
	}

	&:hover {
		color: #1ebba3;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 4px;
	}
`,F=i.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: ${w}px;
`,I=i.span`
	flex-shrink: 0;
	width: 8px;
	height: 40px;
	border-radius: 999px;
	background: ${({$color:e})=>e};
`,L=i.div`
	flex: 1 1 auto;
	min-width: 0;
`,R=i.strong`
	display: block;
	font-family: ${s.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	color: #442817;
`,ee=i.span`
	display: block;
	margin-top: 2px;
	font-family: ${s.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #937c61;
`,z=i.p`
	margin: 20px 0 4px;
	font-family: ${s.fonts.Nunito};
	font-size: 15px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`,B=[`todo`,`past_due`,`completed`];function V({activeTab:e,items:t,onTabChange:r,showTitle:i=!0,listMode:a=`scroll`,idPrefix:o=`dashboard`,embedded:s=!1,onActionComplete:c}){let{formatMessage:l}=n(),f=e=>(0,v.jsxs)(F,{children:[(0,v.jsx)(I,{$color:u(e.subject_id),"aria-hidden":!0}),(0,v.jsxs)(L,{children:[(0,v.jsx)(R,{children:e.title}),e.due_label?(0,v.jsx)(ee,{children:e.due_label}):null]}),(0,v.jsx)(d,{item:e,onActionComplete:c})]},`${e.assign_id}-${e.assign_student_id}`),p=t.length===0?(0,v.jsx)(z,{children:l({id:`dashboard-no-assignments`})}):a===`full`?(0,v.jsx)(A,{children:(0,v.jsx)(M,{children:t.map(f)})}):(0,v.jsx)(j,{children:(0,v.jsx)(M,{children:t.map(f)})}),m=(0,v.jsxs)(O,{$embedded:s,children:[(0,v.jsx)(N,{role:`tablist`,"aria-label":l({id:`dashboard-my-assignments`}),children:B.map(t=>(0,v.jsx)(P,{type:`button`,role:`tab`,id:`${o}-assign-tab-${t}`,"aria-selected":e===t,"aria-controls":`${o}-assign-panel-${t}`,$active:e===t,onClick:()=>r(t),children:l({id:`dashboard-tab-${t}`})},t))}),(0,v.jsx)(k,{role:`tabpanel`,id:`${o}-assign-panel-${e}`,"aria-labelledby":`${o}-assign-tab-${e}`,children:p})]});return s?m:(0,v.jsxs)(S,{"aria-labelledby":i?`${o}-my-assignments-title`:void 0,children:[i?(0,v.jsx)(C,{id:`${o}-my-assignments-title`,children:l({id:`dashboard-my-assignments`})}):null,m]})}var H=a(`star-6-1.svg`),U=e=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 36' preserveAspectRatio='none'><path d='M0 22 C60 8 120 30 180 18 C240 6 300 28 360 14 L360 36 L0 36 Z' fill='${e}'/></svg>`)}")`,W={gold:r`
		background: linear-gradient(180deg, #fff8dc 0%, #fef0b8 58%, #f5e090 100%);
	`,silver:r`
		background: linear-gradient(180deg, #f0f4f8 0%, #e4eaf0 58%, #d8e0e8 100%);
	`,bronze:r`
		background: linear-gradient(180deg, #fdf0e6 0%, #f5e0d0 58%, #ecd0bc 100%);
	`},G={gold:r`
		background: #f5c518;
		color: #5c4a10;
	`,silver:r`
		background: #c0c8d0;
		color: #3d4852;
	`,bronze:r`
		background: #cd9a6b;
		color: #4a3020;
	`},K=i(l)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 18px 16px 16px;
`,q=i.h2`
	margin: 0;
	font-family: ${s.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;
	text-align: center;
	text-transform: none;
`,J=i(c)`
	margin: 4px 0 14px;
	text-align: center;
	font-family: ${s.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.35;
	color: #8a7568;
`,Y=i.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`,X=i.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 72px;
	padding: 10px 12px 18px;
	border-radius: 14px;
	overflow: hidden;
	box-sizing: border-box;
	${({$tier:e})=>W[e]};

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 22px;
		background-image: ${({$tier:e})=>U(g(e))};
		background-repeat: no-repeat;
		background-size: 100% 100%;
		pointer-events: none;
	}
`,Z=i.span`
	flex-shrink: 0;
	min-width: 34px;
	padding: 4px 6px;
	border-radius: 8px;
	font-family: ${s.fonts.Fredoka};
	font-weight: 600;
	font-size: 14px;
	line-height: 1;
	text-align: center;
	${({$tier:e})=>G[e]};
`,Q=i.img`
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid rgba(255, 255, 255, 0.85);
`,$=i.div`
	min-width: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`,te=i.strong`
	font-family: ${s.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.25;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`,ne=i.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	min-width: 0;
`,re=i.img`
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`,ie=i.span`
	font-family: ${s.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	color: #6e5c4e;
	white-space: nowrap;
`,ae=i.div`
	display: flex;
	justify-content: center;
	margin-top: 12px;
`,oe=i(e)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	text-decoration: none;
	cursor: pointer;

	&:hover ${m} {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid ${s.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;function se({rankings:e}){let{formatMessage:t}=n();if(!h(e))return null;let r=f(e.items),i=t({id:`dashboard-recent-view-more`});return(0,v.jsxs)(K,{"aria-label":t({id:`dashboard-top-ranking`}),children:[(0,v.jsx)(q,{children:t({id:`dashboard-top-ranking`})}),(0,v.jsx)(J,{children:t({id:`dashboard-this-week`})}),(0,v.jsx)(Y,{children:r.map(e=>{let t=p(e.rank);return t?(0,v.jsxs)(X,{$tier:t,children:[(0,v.jsxs)(Z,{$tier:t,children:[`#`,e.rank]}),(0,v.jsx)(Q,{src:o({photoUrl:e.photo_url}),alt:``,width:40,height:40}),(0,v.jsxs)($,{children:[(0,v.jsx)(te,{children:e.name}),(0,v.jsxs)(ne,{children:[(0,v.jsx)(re,{src:H,alt:``,"aria-hidden":!0}),(0,v.jsx)(ie,{children:_(e.weekly_xp)})]})]})]},e.student_id):null})}),(0,v.jsx)(ae,{children:(0,v.jsx)(oe,{to:`/leaderboard`,"aria-label":i,children:(0,v.jsx)(m,{children:i})})})]})}export{V as n,se as t};