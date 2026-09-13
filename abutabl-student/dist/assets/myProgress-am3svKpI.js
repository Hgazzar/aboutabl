import{f as e,h as t,r as n,t as r}from"./jsx-runtime-BFsvmiJY.js";import{t as i}from"./useIntl-BWNRJaAP.js";import{r as a}from"./styled-components.browser.esm-DYpzEdZF.js";import{r as o,t as s}from"./figmaAssets-DZM6ZDBD.js";import{u as c}from"./studentAvatar-DwvNfQ5r.js";import{n as l}from"./global-styles-8ZhPevyo.js";import{t as u}from"./studentApiResponse-BAEG6iMr.js";import{S as d}from"./index-DJ-Mxe_T.js";import{c as f,d as p,l as m,s as h}from"./myProgressBarUtils-Nmi-83O5.js";import{c as g,t as _}from"./profileUtils-Boad4RUc.js";import{t as ee}from"./myProgressApi-B4R1aLbX.js";import{_ as te,a as ne,c as re,d as ie,f as ae,g as oe,h as se,i as ce,l as le,m as ue,n as de,o as fe,p as v,r as y,u as b,v as x}from"./myProgressUtils-Cs40We8S.js";import{t as S}from"./bar-frame-gap-B1n3PFOJ.js";import{i as C,o as w}from"./topRankingUtils-CmVn6Cmd.js";import{$ as T,A as E,B as D,C as O,D as k,E as A,F as j,G as M,H as N,I as P,J as F,K as I,L,M as R,N as z,O as B,P as V,Q as pe,R as me,S as he,T as ge,U as _e,V as ve,W as H,X as ye,Y as be,Z as xe,_ as Se,_t as Ce,a as we,at as U,b as Te,c as Ee,ct as W,d as De,dt as Oe,et as ke,f as Ae,ft as je,g as Me,gt as Ne,h as Pe,ht as Fe,i as Ie,it as Le,j as Re,k as ze,l as Be,lt as Ve,m as He,mt as Ue,n as We,nt as Ge,o as Ke,ot as G,p as K,pt as qe,q as Je,r as Ye,rt as Xe,s as Ze,st as Qe,t as $e,tt as q,u as et,ut as tt,v as nt,w as J,x as rt,y as it,z as Y}from"./MyProgressAchievementsWidget-ChoaZFQt.js";var X=t(e(),1),Z=r();function at({items:e}){let{formatMessage:t}=i();return(0,Z.jsxs)(U,{children:[(0,Z.jsx)(G,{children:t({id:`profile-achievements`})}),(0,Z.jsx)(B,{children:e.length===0?(0,Z.jsx)(E,{children:t({id:`profile-achievements-empty`})}):(0,Z.jsx)(Be,{children:e.map(e=>(0,Z.jsxs)(Ke,{"data-earned":e.earned?`true`:`false`,children:[(0,Z.jsx)(we,{src:g(e.icon),alt:``,$earned:e.earned}),(0,Z.jsxs)(We,{children:[(0,Z.jsx)(Ze,{children:e.title}),(0,Z.jsx)(Ee,{"aria-hidden":!0,children:(0,Z.jsx)(Ie,{$percent:e.progress})}),(0,Z.jsx)(Ye,{children:e.description})]})]},e.key))})})]})}var ot=o(`goal-bird-archer.svg`),st=o(`reward-star.svg`);function ct({nextGoal:e,theme:t}){let{formatMessage:n}=i(),r=x({next_goal:e})&&!!e.cta_path,a=le(e,(e,t)=>n({id:`my-progress-complete-lesson`},{lesson:e,content:t})),o=e.available&&e.reward_xp!=null;return(0,Z.jsxs)(_e,{$theme:t,"data-testid":`my-next-goal`,children:[(0,Z.jsxs)(N,{$theme:t,children:[(0,Z.jsx)(`img`,{className:`bird`,src:ot,alt:``,"aria-hidden":!0}),(0,Z.jsxs)(`div`,{className:`copy`,children:[(0,Z.jsx)(`p`,{className:`eyebrow`,children:n({id:`my-progress-your-next-goal`})}),a?(0,Z.jsx)(`p`,{className:`title`,children:a}):(0,Z.jsx)(`p`,{className:`title`,children:n({id:`my-progress-next-goal-empty`})}),o?(0,Z.jsxs)(`span`,{className:`reward`,children:[n({id:`my-progress-reward-xp`},{xp:e.reward_xp}),(0,Z.jsx)(`img`,{src:st,alt:``,"aria-hidden":!0})]}):null]})]}),r&&e.cta_path?(0,Z.jsx)(ze,{to:e.cta_path,$theme:t,children:n({id:`my-progress-continue-learning`})}):null]})}var lt=o(`book-header-frame.png`),ut=o(`cream-book-header-frame.png`),dt=o(`mint-header-parchment.png`),ft=o(`book-cover-boy-bird.svg`),pt=o(`hex-star-gold.png`),mt=o(`xp-bolt-badge.png`),ht=o(`activities-shield-badge.png`),gt=o(`cream-xp-bolt.svg`),_t=o(`cream-activities-shield.svg`),vt=o(`cream-accuracy-target.svg`),yt=o(`mint-xp-bolt.svg`),bt=o(`mint-activities-shield.svg`),xt=o(`mint-accuracy-target.svg`),Q=4;function St(){return(0,Z.jsxs)(`svg`,{viewBox:`0 0 20 20`,"aria-hidden":!0,fill:`none`,children:[(0,Z.jsx)(`circle`,{cx:`10`,cy:`10`,r:`8`,stroke:`#fff`,strokeWidth:`2`}),(0,Z.jsx)(`circle`,{cx:`10`,cy:`10`,r:`4`,stroke:`#fff`,strokeWidth:`2`}),(0,Z.jsx)(`circle`,{cx:`10`,cy:`10`,r:`1.5`,fill:`#fff`})]})}function Ct(e){return e===`cream`?{xpBolt:gt,activitiesShield:_t,accuracyBadge:vt}:e===`mint`?{xpBolt:yt,activitiesShield:bt,accuracyBadge:xt}:{xpBolt:mt,activitiesShield:ht,accuracyBadge:null}}function wt({book:e,index:t}){let{formatMessage:n}=i(),r=ce(t),a=de(e),o=y(e,Q),s=oe(e),c=te(e),l=e.photo?.trim()||null,[u,d]=(0,X.useState)(!1),f=l&&!u?l:ft,p=Ct(r);return(0,Z.jsxs)(it,{$theme:r,"data-subject-id":e.subject_id,children:[(0,Z.jsxs)(O,{$theme:r,children:[r===`lavender`?(0,Z.jsx)(J,{src:lt,alt:``,"aria-hidden":!0}):null,r===`cream`?(0,Z.jsx)(J,{src:ut,$opacity:.75,alt:``,"aria-hidden":!0}):null,r===`mint`?(0,Z.jsx)(J,{src:dt,$opacity:.75,alt:``,"aria-hidden":!0}):null,f?(0,Z.jsx)(Te,{src:f,alt:``,onError:()=>{l&&!u&&d(!0)}}):(0,Z.jsx)(rt,{"aria-hidden":!0}),(0,Z.jsxs)(ge,{children:[(0,Z.jsx)(A,{$theme:r,children:e.title}),e.description?(0,Z.jsx)(he,{$theme:r,children:e.description}):null]}),e.stars.decorative?(0,Z.jsx)(Qe,{"aria-label":n({id:`my-progress-book-stars`},{filled:o,total:Q}),children:Array.from({length:Q},(e,t)=>(0,Z.jsx)(z,{$filled:t<o,children:(0,Z.jsx)(`img`,{src:pt,alt:``,"aria-hidden":!0})},t))}):null]}),(0,Z.jsxs)(Xe,{$theme:r,children:[(0,Z.jsxs)(Le,{children:[(0,Z.jsx)(Ge,{children:n({id:`my-progress-book-progress`})}),(0,Z.jsx)(Oe,{$theme:r,children:n({id:`my-progress-units`},{progress:v(e.units_completed,e.units_total)})})]}),(0,Z.jsx)(je,{"aria-label":ue(e.units_completed,e.units_total),children:(0,Z.jsx)(tt,{$percent:a,$theme:r})})]}),(0,Z.jsxs)(ve,{children:[(0,Z.jsxs)(D,{$theme:r,"data-metric":`weekly-xp`,children:[(0,Z.jsxs)(`div`,{className:`top`,children:[(0,Z.jsx)(`img`,{className:`icon-badge`,src:p.xpBolt,alt:``,"aria-hidden":!0}),(0,Z.jsx)(`span`,{className:`value`,children:se(e.xp_this_week)})]}),(0,Z.jsx)(`span`,{className:`divider`,"aria-hidden":!0}),(0,Z.jsx)(`span`,{className:`label`,children:n({id:`my-progress-xp-this-week-label`})})]}),c&&e.activities_completed!=null?(0,Z.jsxs)(D,{$theme:r,"data-metric":`activities`,children:[(0,Z.jsxs)(`div`,{className:`top`,children:[(0,Z.jsx)(`img`,{className:`icon-badge`,src:p.activitiesShield,alt:``,"aria-hidden":!0}),(0,Z.jsx)(`span`,{className:`value`,children:fe(e.activities_completed)})]}),(0,Z.jsx)(`span`,{className:`divider`,"aria-hidden":!0}),(0,Z.jsx)(`span`,{className:`label`,children:n({id:`my-progress-activities-label`})})]}):null,s&&e.accuracy_percent!=null?(0,Z.jsxs)(D,{$theme:r,"data-metric":`accuracy`,children:[(0,Z.jsxs)(`div`,{className:`top`,children:[p.accuracyBadge?(0,Z.jsx)(`img`,{className:`icon-badge`,src:p.accuracyBadge,alt:``,"aria-hidden":!0}):(0,Z.jsx)(`span`,{className:`icon`,"aria-hidden":!0,children:(0,Z.jsx)(St,{})}),(0,Z.jsx)(`span`,{className:`value`,children:ne(e.accuracy_percent)})]}),(0,Z.jsx)(`span`,{className:`divider`,"aria-hidden":!0}),(0,Z.jsx)(`span`,{className:`label`,children:n({id:`my-progress-accuracy-label`})})]}):null]}),(0,Z.jsx)(ct,{nextGoal:e.next_goal,theme:r})]})}function Tt({books:e}){let{formatMessage:t}=i();return(0,Z.jsxs)(U,{children:[(0,Z.jsx)(G,{children:t({id:`my-progress-my-books`})}),e.length===0?(0,Z.jsx)(E,{children:t({id:`my-progress-books-empty`})}):(0,Z.jsx)(k,{children:e.map((e,t)=>(0,Z.jsx)(wt,{book:e,index:t},e.subject_id))})]})}var Et=o(`hero-bird-cheer.png`),Dt=o(`hero-spark.png`);function Ot({hero:e}){let{formatMessage:t}=i(),n=e.name.trim()||t({id:`my-progress-student-fallback`});return(0,Z.jsxs)(Je,{children:[(0,Z.jsxs)(ye,{children:[(0,Z.jsxs)(ke,{children:[(0,Z.jsx)(q,{children:t({id:`my-progress-keep-going-line-1`})}),(0,Z.jsx)(q,{children:n})]}),(0,Z.jsx)(T,{children:t({id:`my-progress-hero-subtitle`})}),(0,Z.jsx)(xe,{children:t({id:`my-progress-page-title`})})]}),(0,Z.jsxs)(F,{"aria-hidden":!0,children:[(0,Z.jsx)(pe,{src:Dt,alt:``}),(0,Z.jsx)(be,{src:Et,alt:``})]})]})}var kt=s(`star-6-1.svg`),At=s(`achiever-badge.svg`),jt=s(`flash-4.svg`),Mt=s(`progress-arrow-up.svg`);function Nt({hero:e}){let{formatMessage:t}=i(),n=(0,X.useMemo)(()=>_(S,e.level),[e.level]),r=h(e.track.fill_percent),a=e.level>=e.track.achiever_level,o=p(e.weekly_xp,e.previous_weekly_xp);return(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(He,{to:`/learn`,children:t({id:`my-progress-back-dashboard`})}),(0,Z.jsx)(M,{children:(0,Z.jsxs)(I,{children:[(0,Z.jsxs)(L,{children:[(0,Z.jsxs)(P,{children:[(0,Z.jsx)(j,{children:t({id:`dashboard-level`})}),(0,Z.jsx)(V,{children:e.level}),(0,Z.jsx)(Pe,{children:t({id:`dashboard-level-badge`},{badge:e.level_badge_label})})]}),(0,Z.jsxs)(Ce,{children:[(0,Z.jsx)(`img`,{src:kt,alt:``}),(0,Z.jsx)(`span`,{children:re(e)})]})]}),(0,Z.jsxs)(Se,{"aria-hidden":!0,children:[(0,Z.jsx)(`div`,{dangerouslySetInnerHTML:{__html:n}}),(0,Z.jsx)(Me,{$percent:r,"data-fill-percent":r})]}),(0,Z.jsx)(De,{children:(0,Z.jsx)(et,{src:At,alt:``,$unlocked:a})}),(0,Z.jsx)(Ae,{children:t({id:`dashboard-achiever`})})]})}),(0,Z.jsxs)(R,{children:[(0,Z.jsxs)(me,{children:[(0,Z.jsx)(`img`,{src:jt,alt:``}),e.levels_away_from_achiever>0?t({id:`dashboard-levels-away`},{count:e.levels_away_from_achiever}):t({id:`dashboard-achiever-unlocked`})]}),(0,Z.jsxs)(Ue,{$trend:o,children:[(0,Z.jsx)(qe,{src:Mt,alt:``,$trend:o}),(0,Z.jsx)(Ne,{$trend:o,children:f(e.weekly_xp,e.previous_weekly_xp)}),(0,Z.jsx)(Fe,{$trend:o,children:t({id:`dashboard-this-week`})})]})]})]})}var Pt=s(`star-6-1.svg`),Ft=s(`ranking-trophy.png`),It=s(`bomb-explode-5.svg`);function Lt({statistics:e}){let{formatMessage:t}=i();return(0,Z.jsxs)(U,{children:[(0,Z.jsx)(G,{children:t({id:`my-progress-statistics`})}),(0,Z.jsx)(M,{children:(0,Z.jsxs)(Ve,{children:[(0,Z.jsxs)(W,{"data-stat":`total-xp`,children:[(0,Z.jsx)(`img`,{src:Pt,alt:``}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`span`,{className:`label`,children:t({id:`my-progress-total-xp-label`})}),(0,Z.jsx)(`strong`,{className:`value`,children:ae(e.total_xp)})]})]}),e.current_rank==null?null:(0,Z.jsxs)(W,{"data-stat":`rank`,children:[(0,Z.jsx)(`img`,{src:Ft,alt:``}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`span`,{className:`label`,children:t({id:`my-progress-school-rank-label`})}),(0,Z.jsx)(`strong`,{className:`value`,children:b(e.current_rank)})]})]}),(0,Z.jsxs)(W,{"data-stat":`streak`,children:[(0,Z.jsx)(`img`,{src:It,alt:``}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`span`,{className:`label`,children:t({id:`my-progress-streak-label`})}),(0,Z.jsx)(`strong`,{className:`value`,children:ie(e.current_streak)})]})]})]})})]})}function Rt(e){return{available:e.available,current_streak:e.current_streak,longest_streak:e.longest_streak,active_days:e.current_streak,weekly_activity:e.weekly_days.filter(e=>e.completed).length,today_completed:e.today_completed,weekly_days:e.weekly_days}}function zt({streak:e}){return(0,Z.jsx)(w,{streak:Rt(e)})}var Bt=s(`star-6-1.svg`),$=a(B)`
	padding: 18px 16px 16px;
`,Vt=a.h2`
	margin: 0;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.35;
	color: #442817;
	text-align: center;
`,Ht=a.p`
	margin: 4px 0 14px;
	text-align: center;
	font-family: ${l.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.35;
	color: #8a7568;
`,Ut=a.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`,Wt=a.div`
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 12px;
	border-radius: 14px;
	box-sizing: border-box;
	background: ${({$tier:e})=>e===`gold`?`linear-gradient(180deg, #fff8dc 0%, #fef0b8 100%)`:e===`silver`?`linear-gradient(180deg, #f0f4f8 0%, #e4eaf0 100%)`:`linear-gradient(180deg, #fdf0e6 0%, #f5e0d0 100%)`};
`,Gt=a.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 36px;
	height: 28px;
	padding: 0 8px;
	border-radius: 8px;
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: 14px;
	background: ${({$tier:e})=>e===`gold`?`#f5c518`:e===`silver`?`#c0c8d0`:`#cd9a6b`};
	color: ${({$tier:e})=>e===`gold`?`#5c4a10`:e===`silver`?`#3d4852`:`#4a3020`};
`,Kt=a.img`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
`,qt=a.div`
	min-width: 0;
	flex: 1 1 auto;
`,Jt=a.div`
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	color: #442817;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`,Yt=a.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 2px;
`,Xt=a.img`
	width: 14px;
	height: 14px;
	object-fit: contain;
`,Zt=a.span`
	font-family: ${l.fonts.Fredoka};
	font-weight: 500;
	font-size: 13px;
	color: #6b5a4a;
`,Qt=a(n)`
	display: block;
	margin-top: 14px;
	text-align: center;
	font-family: ${l.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
`;function $t({ranking:e}){let{formatMessage:t}=i();return!e.available||e.items.length===0?null:(0,Z.jsxs)($,{"aria-label":t({id:`dashboard-top-ranking`}),children:[(0,Z.jsx)(Vt,{children:t({id:`dashboard-top-ranking`})}),(0,Z.jsx)(Ht,{children:t({id:`my-progress-ranking-all-time`})}),(0,Z.jsx)(Ut,{children:e.items.slice(0,3).map(e=>{let t=C(e.rank);return t?(0,Z.jsxs)(Wt,{$tier:t,children:[(0,Z.jsxs)(Gt,{$tier:t,children:[`#`,e.rank]}),(0,Z.jsx)(Kt,{src:c({photoUrl:e.photo_url}),alt:``,width:40,height:40}),(0,Z.jsxs)(qt,{children:[(0,Z.jsx)(Jt,{children:e.name}),(0,Z.jsxs)(Yt,{children:[(0,Z.jsx)(Xt,{src:Bt,alt:``,"aria-hidden":!0}),(0,Z.jsx)(Zt,{children:m(e.xp)})]})]})]},e.student_id):null})}),(0,Z.jsx)(Qt,{to:`/leaderboard?scope=school&range=all_time`,children:t({id:`dashboard-recent-view-more`})})]})}function en(){let{formatMessage:e}=i(),[t,n]=(0,X.useState)(null),[r,a]=(0,X.useState)(!0),[o,s]=(0,X.useState)(null),[c,l]=(0,X.useState)(0),f=(0,X.useRef)(null);(0,X.useEffect)(()=>{let t=new AbortController;return a(!0),ee(t.signal).then(e=>{t.signal.aborted||(n(e),s(null))}).catch(r=>{t.signal.aborted||(n(null),s(u(r,e({id:`my-progress-load-error`}))))}).finally(()=>{t.signal.aborted||a(!1)}),()=>t.abort()},[e,c]);let p=()=>l(e=>e+1);return r&&!t?(0,Z.jsxs)(H,{children:[(0,Z.jsx)(Y,{children:(0,Z.jsx)(d,{})}),(0,Z.jsx)(K,{"aria-hidden":!0})]}):t?(0,Z.jsxs)(H,{children:[(0,Z.jsxs)(Y,{children:[o?(0,Z.jsxs)(Re,{role:`alert`,children:[(0,Z.jsx)(`span`,{children:o}),(0,Z.jsx)(`button`,{type:`button`,onClick:p,children:e({id:`dashboard-retry`})})]}):null,(0,Z.jsx)(Ot,{hero:t.hero}),(0,Z.jsxs)(nt,{children:[(0,Z.jsx)(Nt,{hero:t.hero}),(0,Z.jsx)(Lt,{statistics:t.statistics}),(0,Z.jsx)(Tt,{books:t.books}),(0,Z.jsx)(`section`,{id:`my-progress-achievements`,ref:f,children:(0,Z.jsx)(at,{items:t.achievements})})]})]}),(0,Z.jsxs)(K,{children:[(0,Z.jsx)($e,{hero:t.hero,items:t.achievements,onViewAll:()=>{f.current?.scrollIntoView({behavior:`smooth`,block:`start`})}}),(0,Z.jsx)(zt,{streak:t.streak}),(0,Z.jsx)($t,{ranking:t.xp_ranking})]})]}):(0,Z.jsxs)(H,{children:[(0,Z.jsx)(Y,{children:(0,Z.jsxs)(E,{children:[o??e({id:`my-progress-load-error`}),o?(0,Z.jsxs)(Z.Fragment,{children:[` `,(0,Z.jsx)(`button`,{type:`button`,onClick:p,children:e({id:`dashboard-retry`})})]}):null]})}),(0,Z.jsx)(K,{"aria-hidden":!0})]})}export{en as default};