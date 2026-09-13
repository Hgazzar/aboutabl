import{c as e,d as t,f as n,h as r,r as i,t as a}from"./jsx-runtime-BFsvmiJY.js";import{t as o}from"./useIntl-BWNRJaAP.js";import{r as s}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as c}from"./figmaAssets-DZM6ZDBD.js";import{c as l}from"./studentAvatar-DwvNfQ5r.js";import{n as u}from"./global-styles-8ZhPevyo.js";import{S as d}from"./index-DJ-Mxe_T.js";import{a as f,i as p,n as m,o as ee,r as te,s as ne,t as h}from"./styles-DnEtH5g-.js";import{a as g,c as _,d as v,i as y,l as b,n as re,o as ie,r as ae,s as oe,t as se,u as ce}from"./myProgressBarUtils-Nmi-83O5.js";import{t as le}from"./useDashboardData-C7NZYEuh.js";import{t as ue}from"./bar-frame-gap-B1n3PFOJ.js";import{n as de,t as fe}from"./TopRankingWidget-DEhNPUkR.js";import{a as x,c as S,i as pe,n as me,o as he,r as ge,s as _e,t as C}from"./myQuestsUtils-CyZSamSj.js";import{C as ve,D as ye,E as be,O as w,S as xe,T as Se,_ as Ce,b as we,c as Te,d as Ee,f as De,g as Oe,h as ke,k as Ae,l as je,m as Me,o as Ne,p as Pe,s as Fe,u as T,v as Ie,w as Le,x as Re,y as ze}from"./topRankingUtils-CmVn6Cmd.js";var E=r(n(),1);function D(e){return e<=0?null:e>99?`99+`:String(e)}var Be=`#F8EFD8`,O=c(`parchment-card.png`),k=s.section`
	width: 100%;
	padding: ${20}px;
	border-radius: ${20}px;
	background-color: ${Be};
	box-sizing: border-box;
`,A=s.div`
	position: relative;
	width: 100%;
	min-height: ${({$minHeight:e=178})=>e}px;
	border-radius: ${16}px;
	overflow: hidden;
	box-sizing: border-box;
`,j=s.img`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: fill;
	opacity: 0.5;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`,M=s.div`
	position: relative;
	z-index: 1;
	box-sizing: border-box;
	height: 100%;
	min-height: inherit;
`,N=a(),Ve=c(`assignments-banner-clipboard.png`),P=178,He=s(M)`
	position: relative;
	display: flex;
	align-items: center;
	gap: 20px;
	min-height: ${P}px;
	padding: 20px 24px 16px;
	box-sizing: border-box;
	overflow: hidden;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: flex-start;
		padding: 0 4px;
		gap: 16px;
	}
`,Ue=s.img`
	width: 185px;
	height: 110px;
	flex-shrink: 0;
	object-fit: contain;
	object-position: left center;

	@media (max-width: 640px) {
		width: 150px;
		height: 89px;
		align-self: center;
	}
`,We=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	flex: 1;
	min-width: 0;
`,Ge=s.h2`
	margin: 0;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, 2.4vw, 28px);
	line-height: 1.2;
	color: #442817;
`,Ke=s.p`
	margin: 0;
	font-family: ${u.fonts.Nunito};
	font-size: clamp(14px, 1.6vw, 16px);
	line-height: 1.4;
	color: #937c61;
`,qe=s(i)`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 8px;
	min-height: 50px;
	padding: 0 28px;
	border-radius: 25px;
	border: 2px solid #f5d76e;
	background: linear-gradient(180deg, #ffd054 0%, #eeae3e 55%, #e89a28 100%);
	box-shadow: 0 3px 0 #c8841f;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: ${u.colours.white};
	white-space: nowrap;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,Je=s.span`
	position: absolute;
	top: -10px;
	inset-inline-end: -8px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 6px;
	border-radius: 999px;
	border: 2px solid ${u.colours.white};
	background: #e53935;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: ${u.colours.white};
	box-shadow: 0 2px 4px rgba(68, 40, 23, 0.2);
`;function Ye({newCount:e}){let{formatMessage:t}=o();if(e<=0)return null;let n=D(e);return(0,N.jsx)(k,{"aria-label":t({id:`dashboard-new-assignments`},{count:e}),children:(0,N.jsxs)(A,{$minHeight:P,children:[(0,N.jsx)(j,{src:O,alt:``,"aria-hidden":!0}),(0,N.jsxs)(He,{children:[(0,N.jsx)(Ue,{src:Ve,alt:``,"aria-hidden":!0}),(0,N.jsxs)(We,{children:[(0,N.jsx)(Ge,{children:t({id:`dashboard-new-assignments`},{count:e})}),(0,N.jsx)(Ke,{children:t({id:`dashboard-start-earn`})}),(0,N.jsxs)(qe,{to:`/todo`,children:[t({id:`dashboard-view-assignments`}),(0,N.jsx)(Je,{"aria-hidden":!0,children:n})]})]})]})]})})}var Xe=32,Ze=24,Qe=100,$e=15,et=20,tt=19,F=50,nt=s.section`
	background: ${u.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${Ze}px ${Xe}px;
	box-sizing: border-box;
`,rt=s.div`
	display: flex;
	align-items: center;
	gap: ${$e}px;
	min-height: 122px;
`,it=s(i)`
	width: ${Qe}px;
	height: 98px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	text-decoration: none;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
`,at=s.h1`
	margin: 0;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(32px, 4vw, 40px);
	line-height: 1.1;
	color: #442817;
	text-transform: capitalize;
`,ot=s.div`
	margin-top: 0;
`,st=s.h2`
	margin: 0 0 ${et}px;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`,ct=s.div`
	display: flex;
	flex-wrap: nowrap;
	gap: ${tt}px;
`,I=`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: ${F}px;
	padding: 4px;
	border-radius: 999px;
	border: none;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	cursor: pointer;
	white-space: nowrap;
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}

	.action-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: ${F-8}px;
		padding: 0 22px;
		border-radius: 999px;
		color: ${u.colours.white};
	}
`,lt=s(i)`
	${I};
	flex: 1 1 240px;
	max-width: 240px;
	background: #ffe082;
	box-shadow: 0 2px 0 rgba(255, 193, 7, 0.45);

	.action-label {
		background: linear-gradient(90deg, #ffb300 0%, #ff9800 100%);
	}
`,ut=s.button`
	${I};
	flex: 1 1 231px;
	max-width: 231px;
	background: #b3e5fc;
	box-shadow: 0 2px 0 rgba(3, 169, 244, 0.35);

	.action-label {
		background: linear-gradient(90deg, #4fc3f7 0%, #039be5 100%);
	}
`,dt=s.button`
	${I};
	flex: 1 1 231px;
	max-width: 231px;
	background: #e1bee7;
	box-shadow: 0 2px 0 rgba(171, 71, 188, 0.35);

	.action-label {
		background: linear-gradient(90deg, #ba68c8 0%, #8e24aa 100%);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		filter: grayscale(0.15);
	}

	&:disabled:hover {
		filter: grayscale(0.15);
	}
`,ft=s.span`
	position: absolute;
	top: -8px;
	inset-inline-end: -6px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 6px;
	border-radius: 999px;
	border: 2px solid ${u.colours.white};
	background: #e53935;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	color: ${u.colours.white};
	box-shadow: 0 2px 4px rgba(68, 40, 23, 0.2);
	z-index: 1;
`,pt=`/learn/books`;function mt({studentName:t,photoUrl:n,newAssignmentsCount:r}){let{formatMessage:i}=o(),a=e(),s=l(n),c=D(r);return(0,N.jsxs)(nt,{children:[(0,N.jsxs)(rt,{children:[(0,N.jsx)(it,{to:`/profile`,"aria-label":i({id:`Profile`}),children:(0,N.jsx)(`img`,{src:s,alt:``})}),(0,N.jsx)(at,{children:i({id:`dashboard-hello`},{name:t})})]}),(0,N.jsxs)(ot,{children:[(0,N.jsx)(st,{children:i({id:`dashboard-quick-actions`})}),(0,N.jsxs)(ct,{children:[(0,N.jsxs)(lt,{to:`/todo`,"aria-describedby":c?`dashboard-assignments-badge`:void 0,children:[(0,N.jsx)(`span`,{className:`action-label`,children:i({id:`dashboard-view-assignments`})}),c?(0,N.jsx)(ft,{id:`dashboard-assignments-badge`,"aria-label":i({id:`dashboard-new-assignments`},{count:r}),children:c}):null]}),(0,N.jsx)(ut,{type:`button`,onClick:()=>a(pt),children:(0,N.jsx)(`span`,{className:`action-label`,children:i({id:`dashboard-start-learning`})})}),(0,N.jsx)(dt,{type:`button`,disabled:!0,"aria-disabled":`true`,children:(0,N.jsx)(`span`,{className:`action-label`,children:i({id:`dashboard-play-game`})})})]})]})]})}var L=c(`star-6-1.svg`),ht=c(`ranking-trophy.png`),gt=c(`progress-arrow-up.svg`),_t=c(`achiever-badge.svg`),vt=c(`flash-4.svg`),yt=s.section`
	background: ${u.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${24}px ${32}px;
	box-sizing: border-box;
`,bt=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
	min-height: 66px;
	margin-bottom: 8px;
`,xt=s.h2`
	margin: 0;
	flex: 0 0 auto;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`,St=s.div`
	display: flex;
	flex-wrap: wrap;
	gap: 25px;
	flex: 1 1 auto;
	justify-content: flex-start;
`,R=s.div`
	display: flex;
	align-items: center;
	gap: 15px;
	min-width: 212px;
	min-height: 61px;
	padding: 10px 20px;
	border-radius: 16px;
	background: linear-gradient(135deg, #42b5a1 0%, #399f8d 100%);
	box-sizing: border-box;

	img {
		width: 34px;
		height: 32px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		display: block;
		font-family: ${u.fonts.Nunito};
		font-size: 14px;
		line-height: 1.3;
		color: rgba(255, 255, 255, 0.92);
		text-transform: capitalize;
	}

	.value {
		display: block;
		font-family: ${u.fonts.Fredoka};
		font-weight: 500;
		font-size: 20px;
		line-height: 1.2;
		color: ${u.colours.white};
	}
`,Ct=s(i)`
	margin-inline-start: auto;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
	white-space: nowrap;

	&:hover {
		filter: brightness(1.05);
	}
`,wt=s.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px;
	grid-template-rows: auto auto;
	column-gap: 12px;
	row-gap: 8px;
	box-sizing: border-box;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`,Tt=s.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	transform: translateY(-27px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 1;
	}
`,Et=s.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`,Dt=s.span`
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`,Ot=s.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${u.colours.white};
`,kt=s.span`
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`,At=s.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${u.fonts.Nunito};
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
`,jt=s.div`
	grid-column: 1;
	grid-row: 2;
	position: relative;
	width: 100%;
	max-width: 568px;
	line-height: 0;
	align-self: end;
	transform: translateY(-36px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 2;
	}

	svg,
	img {
		display: block;
		width: 100%;
		height: auto;
		isolation: isolate;
	}
`,Mt=s.div`
	position: absolute;
	left: ${re}%;
	top: ${ae}%;
	height: ${se}%;
	width: calc(${y}% * ${({$percent:e})=>e/100});
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
`,Nt=s.img`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({$unlocked:e})=>e?`none`:`grayscale(1) brightness(0.92)`};
	transition: filter 0.2s ease;
`,Pt=s.div`
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: center;
	align-items: flex-start;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
	}
`,Ft=s.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-36px);
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: #937c61;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 4;
		justify-self: center;
	}
`,It=s.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-top: 12px;
	width: 100%;
`,Lt=s.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	min-width: 0;
	flex: 1 1 auto;
	font-family: ${u.fonts.Nunito};
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
`,Rt=s.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	min-height: 23px;
	white-space: nowrap;
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`,zt=s.img`
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	object-fit: contain;
	transform: ${({$trend:e})=>e===`down`?`rotate(180deg)`:`none`};
	filter: ${({$trend:e})=>e===`down`?`brightness(0) saturate(100%) invert(40%) sepia(62%) saturate(1400%) hue-rotate(330deg)`:`none`};
`,Bt=s.strong`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 8px;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 16px;
	line-height: 1.25;
	background: ${({$trend:e})=>e===`up`?`#d8f4ee`:`#fde8e8`};
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`,Vt=s.span`
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.25;
	color: ${({$trend:e})=>e===`up`?`#1ebba3`:`#e05a5a`};
`;function Ht({xp:e,classRank:t}){let{formatMessage:n}=o(),r=(0,E.useMemo)(()=>g(ie(ce(ue),e.level)),[e.level]),i=oe(e.track?.fill_percent??0),a=e.next_level_threshold==null?`${e.total_xp} XP`:`${e.total_xp} / ${e.next_level_threshold} XP`,s=e.levels_away_from_achiever,c=e.level>=e.achiever_level,l=v(e.weekly_xp,e.previous_weekly_xp);return(0,N.jsxs)(yt,{children:[(0,N.jsxs)(bt,{children:[(0,N.jsx)(xt,{children:n({id:`dashboard-my-progress`})}),(0,N.jsxs)(St,{children:[(0,N.jsxs)(R,{children:[(0,N.jsx)(`img`,{src:L,alt:``}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{className:`label`,children:n({id:`dashboard-total-points`})}),(0,N.jsx)(`strong`,{className:`value`,children:b(e.total_xp)})]})]}),t==null?null:(0,N.jsxs)(R,{children:[(0,N.jsx)(`img`,{src:ht,alt:``}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{className:`label`,children:n({id:`dashboard-current-ranking`})}),(0,N.jsxs)(`strong`,{className:`value`,children:[`#`,t]})]})]})]}),(0,N.jsx)(Ct,{to:`/progress`,children:n({id:`dashboard-view-more`})})]}),(0,N.jsxs)(wt,{children:[(0,N.jsxs)(Tt,{children:[(0,N.jsxs)(Et,{children:[(0,N.jsx)(Dt,{children:n({id:`dashboard-level`})}),(0,N.jsx)(Ot,{children:e.level}),(0,N.jsx)(kt,{children:n({id:`dashboard-level-badge`},{badge:e.level_badge_label})})]}),(0,N.jsxs)(At,{children:[(0,N.jsx)(`img`,{src:L,alt:``}),(0,N.jsx)(`span`,{children:a})]})]}),(0,N.jsxs)(jt,{"aria-hidden":!0,children:[(0,N.jsx)(`div`,{dangerouslySetInnerHTML:{__html:r}}),(0,N.jsx)(Mt,{$percent:i,"data-fill-percent":i})]}),(0,N.jsx)(Pt,{children:(0,N.jsx)(Nt,{src:_t,alt:``,$unlocked:c})}),(0,N.jsx)(Ft,{children:n({id:`dashboard-achiever`})})]}),(0,N.jsxs)(It,{children:[(0,N.jsxs)(Lt,{children:[(0,N.jsx)(`img`,{src:vt,alt:``}),s>0?n({id:`dashboard-levels-away`},{count:s}):n({id:`dashboard-achiever-unlocked`})]}),(0,N.jsxs)(Rt,{$trend:l,children:[(0,N.jsx)(zt,{src:gt,alt:``,$trend:l}),(0,N.jsx)(Bt,{$trend:l,children:_(e.weekly_xp,e.previous_weekly_xp)}),(0,N.jsx)(Vt,{$trend:l,children:n({id:`dashboard-this-week`})})]})]})]})}var z=c(`quests-ribbon.png`),B=c(`quests-bird-main.png`),V=211,H=s(M)`
	display: flex;
	align-items: center;
	gap: 4px;
	min-height: ${V}px;
	padding: 12px 20px 8px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: flex-start;
		padding: 16px;
		gap: 12px;
	}
`,U=s.img`
	width: 185px;
	height: 180px;
	flex-shrink: 0;
	object-fit: contain;
	object-position: left bottom;
	align-self: flex-end;
	margin-bottom: -4px;

	@media (max-width: 640px) {
		width: 150px;
		height: 146px;
		align-self: center;
		margin-bottom: 0;
	}
`,W=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	flex: 1;
	min-width: 0;
	gap: 10px;
	padding: 4px 8px 8px 0;
`,G=s.img`
	width: 128px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
`,Ut=s.p`
	margin: 0;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;

	.unit {
		color: ${u.colours.LightSeaGreen};
	}

	@media (max-width: 640px) {
		font-size: 16px;
	}
`,Wt=s.div`
	width: 100%;
`,Gt=s.div`
	display: flex;
	justify-content: flex-end;
	margin-bottom: 4px;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	color: #442817;

	.total {
		color: ${u.colours.LightSeaGreen};
	}
`,Kt=s.div`
	height: 14px;
	border-radius: 999px;
	background: #d9d9d9;
	overflow: hidden;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
`,qt=s.div`
	height: 100%;
	width: ${({$percent:e})=>e}%;
	border-radius: 999px;
	background: ${u.colours.LightSeaGreen};
	transition: width 0.25s ease;
`,Jt=s(i)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 40px;
	padding: 8px 22px;
	border-radius: 12px;
	background: ${u.colours.LightSeaGreen};
	color: ${u.colours.white};
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.2;
	text-decoration: none;
	box-shadow: 0 2px 6px rgba(30, 187, 163, 0.35);
	margin-top: 2px;

	&:hover {
		background: ${u.colours.PaoloVeroneseGreen};
		color: ${u.colours.white};
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,Yt=s.p`
	margin: 0;
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #5a4638;
`,Xt=s.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-height: calc((${V}px + ${40}px) * 3 + 32px);
	overflow-y: auto;
	overscroll-behavior: contain;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(30, 187, 163, 0.35);
	}
`;function Zt(e){return(e.items??[]).filter(e=>e.quest_type===`unit_lessons`)}function K({quest:e}){let{formatMessage:t}=o(),n=x(e),r=t({id:`dashboard-quest-lessons-total`},{count:e.progress_target});return(0,N.jsx)(k,{"aria-label":t({id:`dashboard-my-quests`}),children:(0,N.jsxs)(A,{$minHeight:V,children:[(0,N.jsx)(j,{src:O,alt:``,"aria-hidden":!0}),(0,N.jsxs)(H,{children:[(0,N.jsx)(U,{src:B,alt:``,"aria-hidden":!0}),(0,N.jsxs)(W,{children:[(0,N.jsx)(G,{src:z,alt:t({id:`dashboard-my-quests`})}),(0,N.jsx)(Ut,{children:t({id:`dashboard-quest-goal`},{unit:(0,N.jsx)(`span`,{className:`unit`,children:e.unit_label}),subject:e.subject_name})}),(0,N.jsxs)(Wt,{children:[(0,N.jsxs)(Gt,{children:[e.progress_current,` / `,(0,N.jsx)(`span`,{className:`total`,children:r})]}),(0,N.jsx)(Kt,{"aria-hidden":!0,children:(0,N.jsx)(qt,{$percent:n})})]}),(0,N.jsx)(Jt,{to:ge(e),children:t({id:`dashboard-start-learning`})})]})]})]})})}function Qt({quests:e}){let{formatMessage:t}=o(),n=Zt(e);return!e.available||n.length===0?(0,N.jsx)(k,{"aria-label":t({id:`dashboard-my-quests`}),children:(0,N.jsxs)(A,{$minHeight:V,children:[(0,N.jsx)(j,{src:O,alt:``,"aria-hidden":!0}),(0,N.jsxs)(H,{children:[(0,N.jsx)(U,{src:B,alt:``,"aria-hidden":!0}),(0,N.jsxs)(W,{children:[(0,N.jsx)(G,{src:z,alt:t({id:`dashboard-my-quests`})}),(0,N.jsx)(Yt,{children:t({id:`dashboard-quests-empty-main`})})]})]})]})}):n.length===1?(0,N.jsx)(K,{quest:n[0]}):(0,N.jsx)(Xt,{"aria-label":t({id:`dashboard-my-quests`}),children:n.map(e=>(0,N.jsx)(K,{quest:e},e.id))})}function $t(e){return e.cta_path?e.cta_path:e.kind===`continue_learning`&&e.subject_id?`/learn/${e.subject_id}`:e.kind===`pending_assignments`?`/todo`:e.kind===`game`?`/games`:`/learn/books`}function en(e){return e.reward_xp_kind===`potential`&&e.reward_xp!=null&&e.reward_xp>0}function tn(e){return`+${Math.max(0,Math.round(e))}XP`}function nn(e){return e==null||e<=0?null:`+${Math.max(0,Math.round(e))}XP`}function q(e){switch(e){case`bird_assignments`:return c(`recommended-bird-assignments.png`);case`bird_books`:case`bird_books_sm`:return c(`recommended-bird-books.png`);case`bird_gaming`:return c(`recommended-bird-gaming.png`);default:return c(`recommended-bird-books.png`)}}function rn(e){return e===`lavender`?`lavender`:`cream`}function an(e,t){try{let n=new Date(e),r=new Date,i=new Date(r.getFullYear(),r.getMonth(),r.getDate()),a=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.round((i.getTime()-a.getTime())/(1440*60*1e3))===1?t({id:`dashboard-recent-yesterday`}):t({id:`dashboard-recent-on-date`},{date:n.toLocaleDateString(void 0,{day:`numeric`,month:`short`,year:`numeric`})})}catch{return``}}var on=s.section`
	width: 100%;
	min-width: 0;
	box-sizing: border-box;
`,sn=s.div`
	display: flex;
	flex-direction: column;
	gap: ${16}px;
`;function cn({payload:e}){let{formatMessage:t}=o(),n=e.items??[];return n.length===0?null:(0,N.jsxs)(on,{"aria-label":t({id:`dashboard-recommended`}),children:[(0,N.jsx)(ye,{children:(0,N.jsx)(w,{children:t({id:`dashboard-recommended`})})}),(0,N.jsx)(sn,{children:n.map((e,n)=>{let r=e.kind===`pending_assignments`?`mint`:e.theme===`mint`||e.theme===`lavender`?e.theme:`cream`,i=e.kind===`pending_assignments`?(0,N.jsx)(T,{$accent:`teal`,children:t({id:`dashboard-rec-pending-body`},{count:e.count??0,strong:e=>(0,N.jsx)(`strong`,{children:e})})}):e.kind===`game`?(0,N.jsx)(T,{children:t({id:`dashboard-rec-game-body`},{review:e=>(0,N.jsx)(`strong`,{children:e})})}):(0,N.jsx)(T,{children:t({id:`dashboard-rec-continue-body`},{label:e.content_label??``,subject:e.subject_name??``,labelStrong:e=>(0,N.jsx)(`strong`,{children:e})})}),a=e.kind===`pending_assignments`?(0,N.jsx)(Oe,{children:t({id:`dashboard-rec-view-assignments`})}):e.kind===`game`?(0,N.jsx)(Ce,{children:t({id:`dashboard-rec-play-game`})}):(0,N.jsx)(ke,{children:t({id:`dashboard-rec-continue-btn`})});return(0,N.jsxs)(be,{to:$t(e),$theme:r,children:[en(e)&&e.reward_xp!=null?(0,N.jsx)(Me,{children:tn(e.reward_xp)}):null,(0,N.jsxs)(Ee,{children:[(0,N.jsx)(Te,{src:q(e.visual),alt:``,"aria-hidden":!0}),(0,N.jsx)(De,{children:i}),(0,N.jsx)(Pe,{children:a})]})]},`${e.kind}-${e.subject_id??n}`)})})]})}var ln=s.section`
	width: 100%;
	max-width: ${356}px;
	min-width: 0;
	box-sizing: border-box;
`,un=s.div`
	display: flex;
	flex-direction: column;
	gap: ${16}px;
`,dn=s.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${u.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;function fn({payload:e,streak:t}){let{formatMessage:n}=o(),[r,i]=(0,E.useState)(!1),a=e.items??[],s=n({id:`dashboard-recent-view-more`});return(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(ln,{children:[(0,N.jsxs)(Re,{children:[(0,N.jsx)(w,{children:n({id:`dashboard-recent-activities`})}),(0,N.jsx)(dn,{type:`button`,onClick:()=>i(!0),"aria-label":s,children:(0,N.jsx)(Ae,{children:s})})]}),a.length===0?(0,N.jsx)(Ie,{children:n({id:`dashboard-recent-empty`})}):(0,N.jsx)(un,{children:a.map((e,t)=>{let r=nn(e.xp_earned);return(0,N.jsxs)(xe,{$theme:rn(e.theme),children:[r?(0,N.jsx)(Se,{children:r}):null,(0,N.jsxs)(ve,{children:[(0,N.jsx)(je,{src:q(e.visual),alt:``,"aria-hidden":!0}),(0,N.jsxs)(Le,{children:[(0,N.jsx)(ze,{children:n({id:`dashboard-recent-completed`},{label:e.content_label,subject:e.subject_name,strong:e=>(0,N.jsx)(`strong`,{children:e})})}),(0,N.jsx)(we,{children:an(e.occurred_at,n)})]})]})]},`${e.kind}-${e.occurred_at}-${t}`)})})]}),(0,N.jsx)(Fe,{opened:r,onClose:()=>i(!1),streak:t})]})}var pn=r(t(),1),J=881,mn=c(`quests-popup-parchment.png`),hn=c(`quests-popup-ribbon.png`),gn=c(`quests-popup-bird.png`),_n=c(`quests-popup-treasure-reward.png`),vn=s.div`
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	background: rgba(18, 12, 8, 0.55);
	box-sizing: border-box;
`,yn=s.div`
	position: relative;
	width: min(${J}px, calc(100vw - 32px));
	line-height: 0;
`,bn=s.img`
	display: block;
	width: 100%;
	height: auto;
	pointer-events: none;
	user-select: none;
`,xn=s.div`
	position: absolute;
	inset: 0;
	line-height: normal;
`,Sn=s.button`
	position: absolute;
	z-index: 5;
	left: 3.2%;
	top: 3.5%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	padding: 0;
	border: none;
	background: transparent;
	color: #442817;
	font-family: ${u.fonts.Nunito};
	font-size: 28px;
	font-weight: 800;
	line-height: 1;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
		border-radius: 6px;
	}
`,Cn=s.img`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	top: 6%;
	width: 32.35%;
	height: auto;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
`,wn=s.img`
	position: absolute;
	z-index: 2;
	top: 1.5%;
	right: 2%;
	width: 50%;
	height: auto;
	object-fit: contain;
	object-position: top right;
	pointer-events: none;
	user-select: none;
`,Tn=s.p`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	top: 31.8%;
	margin: 0;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(20px, calc(min(${J}px, 100vw - 32px) * 0.034), 29.95px);
	line-height: 100%;
	letter-spacing: 0.2px;
	text-align: left;
	text-transform: capitalize;
	white-space: nowrap;
	color: #442817;
`,En=s.div`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	right: 5.9%;
	top: 39%;
	bottom: 5.5%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 22px;
	overflow-y: auto;
	overscroll-behavior: contain;
	padding-right: 4px;
	box-sizing: border-box;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(30, 187, 163, 0.35);
	}
`,Y=150,X=Math.round(90/186*Y),Dn=Y-X,Z=Math.round(93/186*Y),Q=350,On=180,$=Y/88,kn=25+Z-62,An=s.div`
	display: grid;
	grid-template-columns: 62px minmax(0, 1fr);
	align-items: end;
	column-gap: 0;
	row-gap: 4px;
`,jn=s.img`
	width: 62px;
	height: 62px;
	object-fit: contain;
	display: block;
	align-self: end;

	@media (max-width: 640px) {
		width: 52px;
		height: 52px;
	}
`,Mn=s.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	margin-left: 20px;
	overflow: visible;
`,Nn=s.p`
	margin: 0;
	transform: translateY(${kn}px);
	font-family: ${u.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #442817;
`,Pn=s.div`
	position: relative;
	width: 100%;
	min-width: 0;
	min-height: ${Z}px;
	overflow: visible;
`,Fn=s.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	box-sizing: border-box;
`,In=s.div`
	width: max(80px, calc(100% - ${Q}px));
	max-width: max(80px, calc(100% - ${Q}px));
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.2;
	color: ${u.colours.LightSeaGreen};
	text-align: end;
	transform: translateY(-${5}px);
`,Ln=s.div`
	width: max(80px, calc(100% - ${Q}px));
	max-width: max(80px, calc(100% - ${Q}px));
	height: 14px;
	border-radius: 999px;
	background: #4b6f74;
	overflow: hidden;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
`,Rn=s.div`
	height: 100%;
	width: ${({$percent:e})=>e}%;
	border-radius: 999px;
	background: linear-gradient(90deg, #1ebbb3 0%, #23b8a2 55%, #4fd4b8 100%);
	transition: width 0.25s ease;
`,zn=s.div`
	position: absolute;
	right: ${On}px;
	bottom: 0;
	width: ${Y}px;
	height: ${Z}px;
	overflow: visible;
	pointer-events: none;
`,Bn=s.div`
	position: relative;
	width: ${Y}px;
	height: ${Z}px;
	overflow: visible;
`,Vn=7,Hn=7,Un=s.img`
	display: block;
	width: ${Y}px;
	max-width: none;
	height: auto;
	transform: translateY(${Vn}px);
	pointer-events: none;
	user-select: none;
`,Wn=s.div`
	position: absolute;
	left: ${X}px;
	top: 50%;
	transform: translateY(calc(-50% + ${Hn}px));
	width: ${Dn}px;
	min-width: 0;
	min-height: 0;
	padding: 0 4px;
	background: transparent;
	border: none;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 2px;
`,Gn=s.span`
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: ${Math.round(8*$)}px;
	line-height: 1.1;
	color: #442817;
	text-align: center;
`,Kn=s.span`
	font-family: ${u.fonts.Nunito};
	font-weight: 800;
	font-size: ${Math.round(10*$)}px;
	line-height: 1.1;
	color: #442817;
	text-align: center;
`,qn=s.p`
	position: absolute;
	z-index: 3;
	left: 5.9%;
	right: 5.9%;
	top: 45%;
	margin: 0;
	font-family: ${u.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #5a4638;
	text-align: center;
`;function Jn({quest:e}){let{formatMessage:t}=o(),{current:n,target:r}=S(e),i=x(e),a=C(e),s=he(e),l=t({id:`dashboard-quest-lessons-total`},{count:Math.max(1,r)}).toLowerCase(),u=a?t({id:`dashboard-quest-sidebar-earn-xp`},{xp:r}):t({id:`dashboard-quest-sidebar-goal`},{lessons:l,subject:e.subject_name}),d=a?t({id:`dashboard-quest-lessons`},{current:n,total:r}):`${t({id:`dashboard-quest-lessons`},{current:n,total:r})} ${l}`;return(0,N.jsxs)(An,{children:[(0,N.jsx)(jn,{src:c(pe(e)),alt:``,"aria-hidden":!0}),(0,N.jsxs)(Mn,{children:[(0,N.jsx)(Nn,{children:u}),(0,N.jsxs)(Pn,{children:[(0,N.jsxs)(Fn,{children:[(0,N.jsx)(In,{children:d}),(0,N.jsx)(Ln,{"aria-hidden":!0,children:(0,N.jsx)(Rn,{$percent:i})})]}),(0,N.jsx)(zn,{children:(0,N.jsxs)(Bn,{children:[(0,N.jsx)(Un,{src:_n,alt:``,"aria-hidden":!0}),(0,N.jsxs)(Wn,{children:[(0,N.jsx)(Gn,{children:t({id:`dashboard-quest-reward-label`})}),(0,N.jsx)(Kn,{children:s==null?t({id:`dashboard-quest-reward-xp-generic`}):t({id:`dashboard-quest-reward-xp`},{xp:s})})]})]})})]})]})]})}function Yn({opened:e,onClose:t,quests:n}){let{formatMessage:r}=o(),i=me(n);return(0,E.useEffect)(()=>{if(!e)return;let t=document.body.style.overflow;return document.body.style.overflow=`hidden`,()=>{document.body.style.overflow=t}},[e]),e?(0,pn.createPortal)((0,N.jsx)(vn,{role:`presentation`,onMouseDown:e=>{e.target===e.currentTarget&&t()},children:(0,N.jsxs)(yn,{role:`dialog`,"aria-modal":`true`,"aria-label":r({id:`dashboard-my-quests`}),onMouseDown:e=>e.stopPropagation(),children:[(0,N.jsx)(bn,{src:mn,alt:``,"aria-hidden":!0}),(0,N.jsxs)(xn,{children:[(0,N.jsx)(Sn,{type:`button`,onClick:t,"aria-label":r({id:`dashboard-quests-popup-close`}),children:`×`}),(0,N.jsx)(Cn,{src:hn,alt:r({id:`dashboard-my-quests`})}),(0,N.jsx)(wn,{src:gn,alt:``,"aria-hidden":!0}),(0,N.jsx)(Tn,{children:r({id:`dashboard-quests-popup-subtitle`})}),i.length>0?(0,N.jsx)(En,{children:i.map(e=>(0,N.jsx)(Jn,{quest:e},e.id))}):(0,N.jsx)(qn,{children:r({id:`dashboard-quests-empty`})})]})]})}),document.body):null}var Xn=c(`treasure-box.svg`),Zn=s(h)`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 20px 18px 18px;
`,Qn=s.h2`
	margin: 0 0 18px;
	font-family: ${u.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: ${u.colours.black_2};
	text-align: center;
	text-transform: none;
`,$n=s.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`,er=s.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`,tr=s.img`
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`,nr=s.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
	padding-left: 42px;
`,rr=s.p`
	margin: 0;
	flex: 1;
	min-width: 0;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.35;
	color: #442817;
`,ir=s.span`
	flex-shrink: 0;
	font-family: ${u.fonts.Nunito};
	font-weight: 700;
	font-size: 12px;
	line-height: 1.35;
	color: ${u.colours.LightSeaGreen};
	white-space: nowrap;
`,ar=s.div`
	display: flex;
	align-items: center;
	gap: 10px;
`,or=s.div`
	flex: 1;
	height: 8px;
	border-radius: 999px;
	background: #e8e8e8;
	overflow: hidden;
`,sr=s.div`
	height: 100%;
	width: ${({$percent:e})=>e}%;
	border-radius: 999px;
	background: linear-gradient(90deg, #1ebbb3 0%, #23b8a2 55%, #4fd4b8 100%);
	transition: width 0.25s ease;
`,cr=s.img`
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	object-fit: contain;
	display: block;
`,lr=s.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 10px;
	padding: 4px 8px 8px;
`,ur=s.div`
	display: flex;
	justify-content: center;
	margin: 2px 0 4px;

	img {
		width: 88px;
		height: auto;
		object-fit: contain;
	}
`,dr=s.p`
	margin: 0;
	font-family: ${u.fonts.Nunito};
	font-size: 13px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`,fr=s.div`
	display: flex;
	justify-content: center;
	margin-top: 14px;
`,pr=s.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${u.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;function mr(e){return e.available===!0&&(e.items?.length??0)>0}function hr({quest:e}){let{formatMessage:t}=o(),{current:n,target:r}=S(e),i=x(e),a=C(e),s=t({id:`dashboard-quest-lessons-total`},{count:Math.max(1,r)}).toLowerCase();return(0,N.jsxs)(er,{children:[(0,N.jsxs)(nr,{children:[(0,N.jsx)(rr,{children:a?t({id:`dashboard-quest-sidebar-earn-xp`},{xp:r}):t({id:`dashboard-quest-sidebar-goal`},{lessons:s,subject:e.subject_name})}),a?null:(0,N.jsx)(ir,{"aria-hidden":!0,children:t({id:`dashboard-quest-lessons`},{current:n,total:r})})]}),(0,N.jsxs)(ar,{children:[(0,N.jsx)(tr,{src:c(_e(e)),alt:``,"aria-hidden":!0}),(0,N.jsx)(or,{"aria-hidden":!0,children:(0,N.jsx)(sr,{$percent:i})}),(0,N.jsx)(cr,{src:Xn,alt:``,"aria-hidden":!0})]})]})}function gr({quests:e}){let{formatMessage:t}=o(),[n,r]=(0,E.useState)(!1),i=e.items??[],a=mr(e);return(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(Zn,{"aria-label":t({id:`dashboard-my-quests`}),children:[(0,N.jsx)(Qn,{children:t({id:`dashboard-my-quests`})}),a?(0,N.jsx)($n,{children:i.map(e=>(0,N.jsx)(hr,{quest:e},e.id))}):(0,N.jsxs)(lr,{children:[(0,N.jsx)(ur,{children:(0,N.jsx)(`img`,{src:Xn,alt:``,"aria-hidden":!0})}),(0,N.jsx)(dr,{children:t({id:`dashboard-quests-empty`})})]}),(0,N.jsx)(fr,{children:(0,N.jsx)(pr,{type:`button`,onClick:()=>r(!0),"aria-label":t({id:`dashboard-recent-view-more`}),children:(0,N.jsx)(Ae,{children:t({id:`dashboard-recent-view-more`})})})})]}),(0,N.jsx)(Yn,{opened:n,onClose:()=>r(!1),quests:e})]})}function _r(){let{formatMessage:e}=o(),{data:t,initialLoading:n,error:r,retry:i}=le(`week`),[a,s]=(0,E.useState)(`todo`),c=(0,E.useMemo)(()=>t?t.assignments.tabs[a]??[]:[],[t,a]);if(n&&!t)return(0,N.jsxs)(f,{children:[(0,N.jsx)(p,{children:(0,N.jsx)(d,{})}),(0,N.jsx)(m,{"aria-hidden":!0})]});if(!t)return(0,N.jsxs)(f,{children:[(0,N.jsx)(p,{children:(0,N.jsxs)(ee,{children:[r??e({id:`dashboard-load-error`}),r?(0,N.jsxs)(N.Fragment,{children:[` `,(0,N.jsx)(`button`,{type:`button`,onClick:i,children:e({id:`dashboard-retry`})})]}):null]})}),(0,N.jsx)(m,{"aria-hidden":!0})]});let{student:l,assignments:u,xp:h,rankings:g,streak:_,recommended_activities:v,recent_activities:y,quests:b}=t;return(0,N.jsxs)(f,{children:[(0,N.jsxs)(p,{children:[r?(0,N.jsxs)(te,{role:`alert`,children:[(0,N.jsx)(`span`,{children:r}),(0,N.jsx)(`button`,{type:`button`,onClick:i,children:e({id:`dashboard-retry`})})]}):null,(0,N.jsx)(Ye,{newCount:u.new_count}),(0,N.jsx)(mt,{studentName:l.name,photoUrl:l.photo_url,newAssignmentsCount:u.new_count}),(0,N.jsx)(Ht,{xp:h,classRank:g.class_rank}),(0,N.jsx)(de,{activeTab:a,items:c,onTabChange:s,onActionComplete:i}),(0,N.jsx)(Qt,{quests:b}),(0,N.jsxs)(ne,{$maxWidth:740,$gap:24,children:[(0,N.jsx)(cn,{payload:v}),(0,N.jsx)(fn,{payload:y,streak:_})]})]}),(0,N.jsxs)(m,{children:[(0,N.jsx)(gr,{quests:b}),(0,N.jsx)(Ne,{streak:_}),(0,N.jsx)(fe,{rankings:g})]})]})}export{_r as default};