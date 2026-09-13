import{c as e,f as t,h as n,i as r,r as i,t as a}from"./jsx-runtime-BFsvmiJY.js";import{t as o}from"./useIntl-BWNRJaAP.js";import{r as s}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as c}from"./modal-DTyI9Y1f.js";import{j as l}from"./redux-toolkit.modern-gHnEhhdL.js";import{c as u}from"./requests-CQDHe7xd.js";import{a as d,t as f}from"./figmaAssets-DZM6ZDBD.js";import{i as p,n as m,o as h,s as g,u as _}from"./studentAvatar-DwvNfQ5r.js";import{n as v}from"./global-styles-8ZhPevyo.js";import{t as y}from"./studentApiResponse-BAEG6iMr.js";import{S as ee,b,y as x}from"./index-DJ-Mxe_T.js";import{i as S,l as C,n as w,r as te,s as T,t as ne}from"./myProgressBarUtils-Nmi-83O5.js";import{c as E,i as re,n as D,r as ie,s as ae,t as oe}from"./profileUtils-Boad4RUc.js";import{n as se}from"./dashboardSessionCache-CMVecBk6.js";import{t as ce}from"./bar-frame-gap-B1n3PFOJ.js";import{n as le,t as ue}from"./AssignmentListActionControl-DJv7o6Mr.js";import{a as de,c as fe,d as pe,f as me,i as he,l as ge,n as _e,o as O,p as ve,r as k,s as A,t as ye,u as j}from"./profileApi-CKj-G933.js";var M=n(t()),N=a(),be=e=>(0,N.jsxs)(`svg`,{width:20,height:20,viewBox:`0 0 20 20`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,...e,children:[(0,N.jsx)(`path`,{d:`M5.63315 18.3333H14.3665C16.6665 18.3333 17.5831 16.925 17.6915 15.2083L18.1248 8.32496C18.2415 6.52496 16.8081 4.99996 14.9998 4.99996C14.4915 4.99996 14.0248 4.70829 13.7915 4.25829L13.1915 3.04996C12.8081 2.29163 11.8081 1.66663 10.9581 1.66663H9.04981C8.19148 1.66663 7.19148 2.29163 6.80815 3.04996L6.20815 4.25829C5.97481 4.70829 5.50815 4.99996 4.99981 4.99996C3.19148 4.99996 1.75815 6.52496 1.87481 8.32496L2.30815 15.2083C2.40815 16.925 3.33315 18.3333 5.63315 18.3333Z`,stroke:`#1EBBA3`,strokeWidth:1.5,strokeLinecap:`round`,strokeLinejoin:`round`}),(0,N.jsx)(`path`,{d:`M8.75 6.66663H11.25`,stroke:`#1EBBA3`,strokeWidth:1.5,strokeLinecap:`round`,strokeLinejoin:`round`}),(0,N.jsx)(`path`,{d:`M9.99984 15C11.4915 15 12.7082 13.7834 12.7082 12.2917C12.7082 10.8 11.4915 9.58337 9.99984 9.58337C8.50817 9.58337 7.2915 10.8 7.2915 12.2917C7.2915 13.7834 8.50817 15 9.99984 15Z`,stroke:`#1EBBA3`,strokeWidth:1.5,strokeLinecap:`round`,strokeLinejoin:`round`})]}),xe=s.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 12px;
	padding: 4px 0 8px;

	@media (min-width: 560px) {
		grid-template-columns: 1fr 1fr 1fr;
	}
`,Se=s.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 72px;
	padding: 6px;
	border-radius: 16px;
	background: ${({$selected:e})=>e?`#4A4A4A`:v.colours.white};
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
`,Ce=s.img`
	width: 60px;
	height: 60px;
	border-radius: 12px;
	object-fit: cover;
	flex-shrink: 0;
	filter: ${({$selected:e})=>e?`grayscale(1)`:`none`};
`,we=s.button`
	flex: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 48px;
	padding: 0 12px;
	border-radius: 10px;
	border: 1.5px solid ${v.colours.LightSeaGreen};
	background: ${v.colours.white};
	color: ${({$selected:e})=>e?`#6B6B6B`:v.colours.LightSeaGreen};
	font-family: ${v.fonts.Nunito};
	font-size: 14px;
	font-weight: 700;
	line-height: 1;
	text-align: center;
	cursor: pointer;
`;function Te({opened:e,onClose:t,initialPresetId:n=null,persistOnSelect:r=!0,onPresetSelect:i}){let{formatMessage:a}=o(),[s,l]=(0,M.useState)(null);(0,M.useEffect)(()=>{e&&l(p(n)?n:g()??`a1`)},[e,n]);let u=e=>{l(e),r&&h(e),i?.(e),t()};return(0,N.jsx)(c,{opened:e,onClose:t,title:a({id:`navbar-choose-avatar`}),size:`lg`,padding:24,radius:`16px`,children:(0,N.jsx)(xe,{children:m.map(e=>{let t=s===e.id;return(0,N.jsxs)(Se,{$selected:t,children:[(0,N.jsx)(Ce,{src:e.url,alt:``,$selected:t}),(0,N.jsx)(we,{type:`button`,$selected:t,onClick:()=>u(e.id),children:a({id:`navbar-select-avatar`})})]},e.id)})})})}var Ee=s.div`
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
	padding: 8px 8px 24px;
	font-family: ${v.fonts.Nunito};
`,De=s.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 4px 8px 0;
	min-height: 88px;
`,Oe=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
`,ke=s(i)`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.22);
	color: ${v.colours.white};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-decoration: none;
	text-transform: uppercase;
`,Ae=s.h1`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(32px, 4vw, 42px);
	line-height: 1.1;
	color: ${v.colours.white};
`,je=s.img`
	width: min(280px, 46vw);
	height: auto;
	object-fit: contain;
	align-self: flex-end;
	margin-bottom: -56px;
	z-index: 2;
	pointer-events: none;

	@media (max-width: 767px) {
		width: 170px;
		margin-bottom: -36px;
	}
`,Me=s.section`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
	min-height: 640px;
	background: ${v.colours.white};
	border-radius: 24px;
	box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
	overflow: hidden;

	@media (max-width: 899px) {
		grid-template-columns: 1fr;
	}
`,Ne=s.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 28px 32px 36px;
	background: ${v.colours.white};
	border-left: 1px solid #f0ece6;

	&:lang(ar) {
		border-left: none;
		border-right: 1px solid #f0ece6;
	}

	@media (max-width: 899px) {
		padding: 20px 16px 28px;
		border-left: none;
		border-right: none;
		border-top: 1px solid #f0ece6;
	}
`,Pe=s.div`
	margin: 0 0 16px;
	padding: 10px 14px;
	border-radius: 12px;
	background: #fff4f4;
	color: #8b2e2e;
	font-size: 14px;
`,P=s.p`
	margin: 0;
	padding: 8px 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	line-height: 1.5;
	color: ${v.colours[`Grey-body`]};
`,F=s.div`
	position: relative;
	width: 100%;
	max-width: 720px;
	background: ${v.colours.white};
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
`,I=d(`edit-icon.png`),L=s.section`
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
	max-width: 720px;
`,R=s.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`,Fe=s.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 8px 0 4px;
`,Ie=s.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	border: 5px solid #1ebba3;
	display: block;
`,Le=s.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border: none;
	background: transparent;
	padding: 0;
	cursor: pointer;
	font-family: ${v.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	color: ${v.colours.LightSeaGreen};

	svg {
		width: 18px;
		height: 18px;
	}

	&:hover {
		filter: brightness(1.05);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 4px;
		border-radius: 6px;
	}
`,Re=s.input`
	display: none;
`,ze=56,Be=15,z=s.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`,B=s.h3`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	line-height: 1.3;
	color: #1f1e1e;
`,V=s.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`,H=s.div`
	position: relative;
	box-sizing: border-box;
	min-height: ${ze}px;
	border-radius: ${Be}px;
	border: 1px solid
		${({$variant:e})=>e===`darkLocked`?`transparent`:`#dcdcdc`};
	background: ${({$variant:e})=>e===`darkLocked`?`#666666`:`#ffffff`};
	box-shadow: ${({$variant:e})=>e===`darkLocked`?`none`:`0 2px 6px rgba(0, 0, 0, 0.08)`};
	padding: 10px 16px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
	grid-column: ${({$fullWidth:e})=>e?`1 / -1`:`auto`};
`,U=s.span`
	font-family: ${v.fonts.Nunito};
	font-size: 12px;
	font-weight: 500;
	line-height: 1.2;
	color: ${({$variant:e})=>e===`darkLocked`?`#b3b3b3`:`#b0b0b0`};
`,W=s.span`
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: ${({$variant:e})=>e===`darkLocked`?`#e8e8e8`:`#1f1e1e`};
`,G=s.input`
	width: 100%;
	border: none;
	background: transparent;
	padding: 0;
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: #1f1e1e;
	outline: none;

	&::placeholder {
		color: #b0b0b0;
		font-weight: 500;
	}

	&:disabled {
		cursor: not-allowed;
		color: #1f1e1e;
		opacity: 1;
	}

	&::-webkit-calendar-picker-indicator {
		cursor: pointer;
		opacity: 0.65;
	}
`,Ve=s.select`
	width: 100%;
	border: none;
	background: transparent;
	padding: 0;
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: #1f1e1e;
	outline: none;
	appearance: none;
	cursor: pointer;
`,He=s.hr`
	width: 100%;
	height: 0;
	margin: 8px 0 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`,K=`#24b5a0`,Ue=`#1a8878`,q=v.colours.LightSeaGreen,We=`
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	min-width: 188px;
	height: 48px;
	padding: 0 36px;
	border-radius: 16px;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease;

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,Ge=s.div`
	display: flex;
	flex-wrap: nowrap;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding-top: 16px;
`,Ke=s.button`
	${We}
	border: 2px solid ${K};
	background: ${K};
	color: ${v.colours.white};
	box-shadow: 0 4px 0 ${Ue};

	&:hover:not(:disabled) {
		border-color: ${q};
		background: ${v.colours.white};
		color: ${q};
		box-shadow: 0 4px 0 ${q};
	}
`;function qe(e,t,n){try{let e=localStorage.getItem(`user_info`);if(!e)return;let r=JSON.parse(e);t?delete r.avatar_preset:n&&p(n)&&(r.avatar_preset=n),localStorage.setItem(`user_info`,JSON.stringify(r)),window.dispatchEvent(new CustomEvent(`student-avatar-updated`))}catch{}}function Je({identity:e,onIdentityUpdated:t,onDiscard:n}){let{formatMessage:r}=o(),i=(0,M.useRef)(null),[a,s]=(0,M.useState)(ge),[c,l]=(0,M.useState)(ge),[d,f]=(0,M.useState)(!0),[m,h]=(0,M.useState)(null),[g,v]=(0,M.useState)(!1),[ee,b]=(0,M.useState)(null),[x,S]=(0,M.useState)(null),[C,w]=(0,M.useState)(null),[te,T]=(0,M.useState)(null),[ne,E]=(0,M.useState)(!1);(0,M.useEffect)(()=>{let e=!1;return f(!0),h(null),k().then(t=>{if(e)return;let n=j(t);s(n),l(j(n)),S(null),b(null);try{let e=localStorage.getItem(`user_info`),t=e?JSON.parse(e):null,n=t?.avatar_preset&&p(t.avatar_preset)?t.avatar_preset:null;w(n),T(n)}catch{w(null),T(null)}}).catch(t=>{e||h(y(t,r({id:`profile-edit-error`})))}).finally(()=>{e||f(!1)}),()=>{e=!0}},[r]);let re=_({photoUrl:ee??(p(C)?null:a.photo??e.photo),avatarPreset:p(C)?C:null}),D=(e,t)=>{s(n=>({...n,[e]:t}))},ie=e=>{w(e),S(null),b(null),i.current&&(i.current.value=``)},ae=e=>{if(!e){S(null),b(null);return}S(e),b(URL.createObjectURL(e)),w(null)};return d?(0,N.jsxs)(L,{children:[(0,N.jsxs)(R,{children:[(0,N.jsx)(`img`,{src:I,alt:``}),r({id:`Edit-profile`})]}),(0,N.jsx)(P,{children:r({id:`profile-edit-loading`})})]}):m?(0,N.jsxs)(L,{children:[(0,N.jsxs)(R,{children:[(0,N.jsx)(`img`,{src:I,alt:``}),r({id:`Edit-profile`})]}),(0,N.jsx)(P,{role:`alert`,children:m})]}):(0,N.jsxs)(L,{children:[(0,N.jsxs)(R,{children:[(0,N.jsx)(`img`,{src:I,alt:``}),r({id:`Edit-profile`})]}),(0,N.jsxs)(Fe,{children:[(0,N.jsx)(Ie,{src:re,alt:``}),(0,N.jsxs)(Le,{type:`button`,onClick:()=>E(!0),children:[(0,N.jsx)(be,{"aria-hidden":!0}),r({id:`ChangeAvatar`})]}),(0,N.jsx)(Re,{ref:i,type:`file`,accept:`image/png,image/jpeg`,onChange:e=>ae(e.target.files?.[0]??null)})]}),(0,N.jsx)(Te,{opened:ne,onClose:()=>E(!1),initialPresetId:C,persistOnSelect:!1,onPresetSelect:ie}),(0,N.jsxs)(z,{children:[(0,N.jsx)(B,{children:r({id:`PersonalInfo`})}),(0,N.jsxs)(V,{children:[(0,N.jsxs)(H,{$variant:`whiteLocked`,children:[(0,N.jsx)(U,{$variant:`whiteLocked`,children:r({id:`Student-Code`})}),a.code||e.code?(0,N.jsx)(W,{$variant:`whiteLocked`,children:a.code||e.code}):null]}),(0,N.jsxs)(H,{$variant:`editable`,children:[(0,N.jsx)(U,{$variant:`editable`,children:r({id:`Email`})}),(0,N.jsx)(G,{type:`email`,value:a.email,onChange:e=>D(`email`,e.target.value),autoComplete:`email`,"aria-label":r({id:`Email`})})]}),(0,N.jsxs)(H,{$variant:`editable`,children:[(0,N.jsx)(U,{$variant:`editable`,children:r({id:`Birthday`})}),(0,N.jsx)(G,{type:`date`,value:a.birthday,max:ve(),onChange:e=>D(`birthday`,e.target.value),"aria-label":r({id:`Birthday`})})]}),(0,N.jsxs)(H,{$variant:`editable`,children:[(0,N.jsx)(U,{$variant:`editable`,children:r({id:`Gender`})}),(0,N.jsxs)(Ve,{value:a.gender,onChange:e=>D(`gender`,e.target.value),"aria-label":r({id:`Gender`}),children:[(0,N.jsx)(`option`,{value:``,children:r({id:`Gender`})}),(0,N.jsx)(`option`,{value:`male`,children:r({id:`gender-male`})}),(0,N.jsx)(`option`,{value:`female`,children:r({id:`gender-female`})})]})]})]})]}),(0,N.jsxs)(z,{children:[(0,N.jsx)(B,{children:r({id:`Education`})}),(0,N.jsxs)(V,{children:[(0,N.jsxs)(H,{$variant:`darkLocked`,children:[(0,N.jsx)(U,{$variant:`darkLocked`,children:r({id:`School`})}),a.school?(0,N.jsx)(W,{$variant:`darkLocked`,children:a.school}):null]}),(0,N.jsxs)(H,{$variant:`darkLocked`,children:[(0,N.jsx)(U,{$variant:`darkLocked`,children:r({id:`Grade`})}),a.grade?(0,N.jsx)(W,{$variant:`darkLocked`,children:a.grade}):null]})]})]}),(0,N.jsxs)(z,{children:[(0,N.jsx)(B,{children:r({id:`Address`})}),(0,N.jsx)(V,{children:(0,N.jsxs)(H,{$variant:`editable`,$fullWidth:!0,children:[(0,N.jsx)(U,{$variant:`editable`,children:r({id:`Address`})}),(0,N.jsx)(G,{value:a.address,onChange:e=>D(`address`,e.target.value),"aria-label":r({id:`Address`})})]})})]}),(0,N.jsx)(He,{"aria-hidden":!0}),(0,N.jsxs)(Ge,{children:[(0,N.jsx)(Ke,{type:`button`,onClick:async()=>{if(!me(a.email)){u.error(r({id:`emailOnly`}));return}if(!pe(a.birthday)){u.error(r({id:`profile-birthday-future-error`}));return}v(!0);try{await de(a,x),qe(a,x,C);let e=j(await k());s(e),l(j(e)),S(null),b(null),x&&(T(null),w(null)),t(await he()),u.success(r({id:`ProfileSavedSuccess`}))}catch(e){u.error(y(e,r({id:`profile-edit-error`})))}finally{v(!1)}},disabled:g,children:r({id:`SaveChanges`})}),(0,N.jsx)(Ke,{type:`button`,onClick:()=>{g||(s(j(c)),S(null),b(null),w(te),i.current&&(i.current.value=``),n())},disabled:g,children:r({id:`Discard`})})]})]})}var Ye=`data:image/svg+xml,%3csvg%20width='24'%20height='25'%20viewBox='0%200%2024%2025'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M15.5799%2012.4999C15.5799%2014.4799%2013.9799%2016.0799%2011.9999%2016.0799C10.0199%2016.0799%208.41992%2014.4799%208.41992%2012.4999C8.41992%2010.5199%2010.0199%208.91992%2011.9999%208.91992C13.9799%208.91992%2015.5799%2010.5199%2015.5799%2012.4999Z'%20stroke='%231F1E1E'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M11.9998%2020.7707C15.5298%2020.7707%2018.8198%2018.6907%2021.1098%2015.0907C22.0098%2013.6807%2022.0098%2011.3107%2021.1098%209.9007C18.8198%206.3007%2015.5298%204.2207%2011.9998%204.2207C8.46984%204.2207%205.17984%206.3007%202.88984%209.9007C1.98984%2011.3107%201.98984%2013.6807%202.88984%2015.0907C5.17984%2018.6907%208.46984%2020.7707%2011.9998%2020.7707Z'%20stroke='%231F1E1E'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e`,Xe=d(`lock-icon.png`),Ze=s.section`
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
	max-width: 720px;
`,Qe=s.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`,$e=s.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`,et=s.h3`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	line-height: 1.3;
	color: #1f1e1e;
`,tt=s.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`,nt=s.div`
	position: relative;
	box-sizing: border-box;
	min-height: ${56}px;
	border-radius: ${15}px;
	border: 1px solid #dcdcdc;
	background: #ffffff;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	padding: 10px 52px 10px 16px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
`,rt=s.span`
	font-family: ${v.fonts.Nunito};
	font-size: 12px;
	font-weight: 500;
	line-height: 1.2;
	color: #b0b0b0;
`,it=s.input`
	width: 100%;
	border: none;
	background: transparent;
	padding: 0;
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: #1f1e1e;
	outline: none;

	&::placeholder {
		color: #b0b0b0;
		font-weight: 500;
	}
`,at=s.button`
	position: absolute;
	top: 50%;
	right: 14px;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	border: 0;
	background: transparent;
	cursor: pointer;
	opacity: 0.72;

	img {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	&:hover {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
		border-radius: 6px;
	}
`,ot=s.hr`
	width: 100%;
	height: 0;
	margin: 8px 0 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`,st=`#24b5a0`,ct=`#1a8878`,J=v.colours.LightSeaGreen,lt=`
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	min-width: 188px;
	height: 48px;
	padding: 0 36px;
	border-radius: 16px;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease;

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`,ut=s.div`
	display: flex;
	flex-wrap: nowrap;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding-top: 16px;
`,dt=s.button`
	${lt}
	border: 2px solid ${st};
	background: ${st};
	color: ${v.colours.white};
	box-shadow: 0 4px 0 ${ct};

	&:hover:not(:disabled) {
		border-color: ${J};
		background: ${v.colours.white};
		color: ${J};
		box-shadow: 0 4px 0 ${J};
	}
`;function ft(e,t){switch(e){case`fields_required`:return t({id:`profile-password-fields-required`});case`new_min_length`:return t({id:`profile-password-min-length`});case`mismatch`:return t({id:`PasswordMismatch`});default:return t({id:`profile-password-error`})}}function pt({onDiscard:e}){let{formatMessage:t}=o(),[n,r]=(0,M.useState)(O),[i,a]=(0,M.useState)(O),[s,c]=(0,M.useState)(!1),[l,d]=(0,M.useState)({currentPassword:!1,newPassword:!1,confirmPassword:!1}),f=(e,t)=>{r(n=>({...n,[e]:t}))},p=e=>{d(t=>({...t,[e]:!t[e]}))};return(0,N.jsxs)(Ze,{children:[(0,N.jsxs)(Qe,{children:[(0,N.jsx)(`img`,{src:Xe,alt:``}),t({id:`Change-password`})]}),(0,N.jsxs)($e,{children:[(0,N.jsx)(et,{children:t({id:`PersonalInfo`})}),(0,N.jsx)(tt,{children:[{key:`currentPassword`,labelId:`CurrentPassword`,autoComplete:`current-password`},{key:`newPassword`,labelId:`NewPassword`,autoComplete:`new-password`},{key:`confirmPassword`,labelId:`ConfirmPassword`,autoComplete:`new-password`}].map(({key:e,labelId:r,autoComplete:i})=>{let a=t({id:r});return(0,N.jsxs)(nt,{children:[(0,N.jsx)(rt,{children:a}),(0,N.jsx)(it,{type:l[e]?`text`:`password`,value:n[e],onChange:t=>f(e,t.target.value),placeholder:a,autoComplete:i,"aria-label":a}),(0,N.jsx)(at,{type:`button`,onClick:()=>p(e),"aria-label":t({id:`profile-password-toggle-visibility`}),"aria-pressed":l[e],children:(0,N.jsx)(`img`,{src:Ye,alt:``})})]},e)})})]}),(0,N.jsx)(ot,{"aria-hidden":!0}),(0,N.jsxs)(ut,{children:[(0,N.jsx)(dt,{type:`button`,onClick:async()=>{let e=fe(n);if(e){u.error(ft(e,t));return}c(!0);try{await ye(n);let e=A(O);r(e),a(e),u.success(t({id:`profile-password-success`}))}catch(e){u.error(y(e,t({id:`profile-password-error`})))}finally{c(!1)}},disabled:s,children:t({id:`SaveChanges`})}),(0,N.jsx)(dt,{type:`button`,onClick:()=>{s||(r(A(i)),e())},disabled:s,children:t({id:`Discard`})})]})]})}var mt=d(`logout-icon.png`),Y=`#BA0C12`,ht=`#950a0f`,gt=`#24b5a0`,_t=`#1a8878`,vt=s.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18px;
	width: min(100%, 380px);
	margin: 0 auto;
`,yt=s.div`
	display: flex;
	align-items: center;
	gap: 12px;
`,bt=s.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(186, 12, 18, 0.12);
	flex-shrink: 0;

	img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}
`,xt=s.h2`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 24px;
	line-height: 1.2;
	color: ${Y};
`,St=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.55;
	color: #4a4a4a;
`,Ct=s.hr`
	width: 100%;
	height: 0;
	margin: 2px 0 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`,wt=`
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 50px;
	padding: 0 24px;
	border-radius: 16px;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease,
		transform 0.1s ease;

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}

	&:active {
		transform: translateY(2px);
	}
`,Tt=s.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`,Et=s.button`
	${wt}
	border: 2px solid ${Y};
	background: ${Y};
	color: ${v.colours.white};
	box-shadow: 0 4px 0 ${ht};

	&:hover {
		background: #d10e15;
		border-color: #d10e15;
	}

	&:active {
		box-shadow: 0 2px 0 ${ht};
	}
`,Dt=s.button`
	${wt}
	border: 2px solid ${gt};
	background: ${gt};
	color: ${v.colours.white};
	box-shadow: 0 4px 0 ${_t};

	&:hover {
		background: #28c4ad;
		border-color: #28c4ad;
	}

	&:active {
		box-shadow: 0 2px 0 ${_t};
	}
`;function Ot({logoutModalOpened:t,setLogoutModalOpened:n}){let{formatMessage:r}=o(),i=l(),a=e();return(0,N.jsx)(c,{radius:`20px`,opened:t,onClose:()=>n(!1),withCloseButton:!1,size:420,padding:`32px 28px 28px`,overlayProps:{opacity:.5,blur:3},title:null,styles:{content:{borderRadius:20,boxShadow:`0 12px 40px rgba(0, 0, 0, 0.18)`},body:{paddingTop:4}},children:(0,N.jsxs)(vt,{children:[(0,N.jsxs)(yt,{children:[(0,N.jsx)(bt,{children:(0,N.jsx)(`img`,{src:mt,alt:``})}),(0,N.jsx)(xt,{children:r({id:`Logout`})})]}),(0,N.jsx)(St,{children:r({id:`Logout-desc`})}),(0,N.jsx)(Ct,{"aria-hidden":!0}),(0,N.jsxs)(Tt,{children:[(0,N.jsx)(Et,{type:`button`,onClick:async()=>{try{await i(b({code:0,password:``}))}catch{}n(!1),a(`/login`,{replace:!0})},children:r({id:`Logout`})}),(0,N.jsx)(Dt,{type:`button`,onClick:()=>n(!1),children:r({id:`Discard`})})]})]})})}var kt=d(`bird-peek.png`);function At(){let{formatMessage:e}=o();return(0,N.jsxs)(De,{children:[(0,N.jsxs)(Oe,{children:[(0,N.jsx)(ke,{to:`/learn`,children:e({id:`profile-go-to-dashboard`})}),(0,N.jsx)(Ae,{children:e({id:`Profile`})})]}),(0,N.jsx)(je,{src:kt,alt:``})]})}var jt=d(`progress-icon.png`),Mt=d(`edit-icon.png`),Nt=d(`lock-icon.png`),Pt=d(`logout-icon.png`),Ft=`#BA0C12`,It=s.aside`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 28px 20px 24px;
	background: ${v.colours.white};
	min-height: 100%;
`,Lt=s.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	margin-bottom: 28px;
`,Rt=s.img`
	width: 96px;
	height: 96px;
	border-radius: 50%;
	object-fit: cover;
	display: block;
`,zt=s.h2`
	margin: 14px 0 4px;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 28px;
	line-height: 1.2;
	color: #1f1e1e;
`,Bt=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	color: #9c9b9b;
`,Vt=s.nav`
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1;
`,Ht=s.div`
	margin-top: auto;
	padding-top: 8px;
`,Ut=s.hr`
	width: 100%;
	height: 0;
	margin: 8px 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`,Wt=22,Gt=40,X=s.img`
	width: ${({$emphasized:e})=>e?Gt:Wt}px;
	height: ${({$emphasized:e})=>e?Gt:Wt}px;
	object-fit: contain;
	flex-shrink: 0;
	opacity: ${({$active:e,$danger:t})=>t||e?1:.72};
`,Z=s.button`
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	border: 0;
	background: transparent;
	padding: 12px 8px;
	border-radius: 10px;
	cursor: pointer;
	text-align: start;
	font-family: ${v.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	color: ${({$active:e,$danger:t})=>t?Ft:e?v.colours.LightSeaGreen:`#1f1e1e`};
`;function Kt({identity:e,active:t,onSelectPanel:n,onLogout:r}){let{formatMessage:i}=o();return(0,N.jsxs)(It,{children:[(0,N.jsxs)(Lt,{children:[(0,N.jsx)(Rt,{src:_({photoUrl:e.photo}),alt:``}),(0,N.jsx)(zt,{children:e.name||`—`}),(0,N.jsxs)(Bt,{children:[i({id:`Student-Code`}),`: `,e.code||`—`]})]}),(0,N.jsxs)(Vt,{children:[(0,N.jsxs)(Z,{type:`button`,$active:t===`progress`,onClick:()=>n(`progress`),children:[(0,N.jsx)(X,{src:jt,alt:``,$active:t===`progress`}),i({id:`My-Progress`})]}),(0,N.jsxs)(Z,{type:`button`,$active:t===`assignments`,onClick:()=>n(`assignments`),children:[(0,N.jsx)(X,{src:jt,alt:``,$active:t===`assignments`}),i({id:`My-assignments`})]}),(0,N.jsx)(Ut,{"aria-hidden":!0}),(0,N.jsxs)(Z,{type:`button`,$active:t===`edit`,onClick:()=>n(`edit`),children:[(0,N.jsx)(X,{src:Mt,alt:``,$active:t===`edit`,$emphasized:!0}),i({id:`Edit-profile`})]}),(0,N.jsxs)(Z,{type:`button`,$active:t===`password`,onClick:()=>n(`password`),children:[(0,N.jsx)(X,{src:Nt,alt:``,$active:t===`password`,$emphasized:!0}),i({id:`Change-password`})]})]}),(0,N.jsxs)(Ht,{children:[(0,N.jsx)(Ut,{"aria-hidden":!0}),(0,N.jsxs)(Z,{type:`button`,$danger:!0,onClick:r,children:[(0,N.jsx)(X,{src:Pt,alt:``,$danger:!0,$emphasized:!0}),i({id:`Logout`})]})]})]})}var qt=f(`star-6-1.svg`),Jt=f(`achiever-badge.svg`),Yt=f(`flash-4.svg`),Xt=d(`progress-icon.png`),Zt=s.section`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
`,Qt=s.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`,$t=s.div`
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
`,en=s.div`
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
`,tn=s.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`,nn=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`,rn=s.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${v.colours.white};
`,an=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`,on=s.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${v.fonts.Nunito};
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
`,sn=s.div`
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
`,cn=s.div`
	position: absolute;
	left: ${w}%;
	top: ${te}%;
	height: ${ne}%;
	width: calc(${S}% * ${({$percent:e})=>e/100});
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
`,ln=s.div`
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
`,un=s.img`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({$unlocked:e})=>e?`none`:`grayscale(1) brightness(0.92)`};
`,dn=s.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-15px);
	font-family: ${v.fonts.Nunito};
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
`,fn=s.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-family: ${v.fonts.Nunito};
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
`;function pn({xp:e}){let{formatMessage:t}=o(),n=(0,M.useMemo)(()=>oe(ce,e.level),[e.level]),r=T(e.track?.fill_percent??0),i=re(e);return(0,N.jsxs)(Zt,{children:[(0,N.jsxs)(Qt,{children:[(0,N.jsx)(`img`,{src:Xt,alt:``}),t({id:`My-Progress`})]}),(0,N.jsx)(F,{children:(0,N.jsxs)($t,{children:[(0,N.jsxs)(en,{children:[(0,N.jsxs)(tn,{children:[(0,N.jsx)(nn,{children:t({id:`dashboard-level`})}),(0,N.jsx)(rn,{children:e.level}),(0,N.jsx)(an,{children:t({id:`dashboard-level-badge`},{badge:e.level_badge_label})})]}),(0,N.jsxs)(on,{children:[(0,N.jsx)(`img`,{src:qt,alt:``}),(0,N.jsx)(`span`,{children:ie(e)})]})]}),(0,N.jsxs)(sn,{"aria-hidden":!0,children:[(0,N.jsx)(`div`,{dangerouslySetInnerHTML:{__html:n}}),(0,N.jsx)(cn,{$percent:r,"data-fill-percent":r})]}),(0,N.jsx)(ln,{children:(0,N.jsx)(un,{src:Jt,alt:``,$unlocked:i})}),(0,N.jsx)(dn,{children:t({id:`dashboard-achiever`})})]})}),(0,N.jsxs)(fn,{children:[(0,N.jsx)(`img`,{src:Yt,alt:``}),e.levels_away_from_achiever>0?t({id:`dashboard-levels-away`},{count:e.levels_away_from_achiever}):t({id:`dashboard-achiever-unlocked`})]})]})}var mn=f(`star-6-1.svg`),hn=f(`ranking-trophy.png`),gn=f(`bomb-explode-5.svg`),_n=s.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`,vn=s.h2`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	color: #1f1e1e;
`,yn=s.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 780px) {
		grid-template-columns: 1fr;
	}
`,Q=s.div`
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
		font-family: ${v.fonts.Nunito};
		font-weight: 700;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
	}

	.value {
		display: block;
		font-family: ${v.fonts.Fredoka};
		font-weight: 500;
		font-size: 22px;
		line-height: 1.15;
		color: ${v.colours.white};
	}
`;function bn({totalXp:e,classRank:t,streakDays:n}){let{formatMessage:r}=o(),i=D(t);return(0,N.jsxs)(_n,{children:[(0,N.jsx)(vn,{children:r({id:`profile-statistics`})}),(0,N.jsx)(F,{children:(0,N.jsxs)(yn,{children:[(0,N.jsxs)(Q,{children:[(0,N.jsx)(`img`,{src:mn,alt:``}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{className:`label`,children:r({id:`dashboard-total-points`})}),(0,N.jsx)(`strong`,{className:`value`,children:C(e)})]})]}),(0,N.jsxs)(Q,{children:[(0,N.jsx)(`img`,{src:hn,alt:``}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{className:`label`,children:r({id:`dashboard-current-ranking`})}),(0,N.jsx)(`strong`,{className:`value`,children:i??`—`})]})]}),(0,N.jsxs)(Q,{children:[(0,N.jsx)(`img`,{src:gn,alt:``}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{className:`label`,children:r({id:`profile-day-streak`})}),(0,N.jsx)(`strong`,{className:`value`,children:n})]})]})]})})]})}var xn=s.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
`,Sn=s.h2`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;
`,Cn=s.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`,wn=s.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`,Tn=s.img`
	width: 72px;
	height: 72px;
	flex-shrink: 0;
	object-fit: contain;
	border-radius: 16px;
	opacity: ${({$earned:e})=>e?1:.88};
	filter: ${({$earned:e})=>e?`none`:`grayscale(0.2)`};
`,En=s.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`,Dn=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #1f1e1e;
`,On=s.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: #ebe7e1;
	overflow: hidden;
`,kn=s.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: #f5c518;
`,An=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #9a9288;
`;function jn({items:e=[],loading:t=!1,error:n=null}){let{formatMessage:r}=o();return(0,N.jsxs)(xn,{children:[(0,N.jsx)(Sn,{children:r({id:`profile-achievements`})}),(0,N.jsx)(F,{children:t?(0,N.jsx)(P,{children:r({id:`profile-achievements-loading`})}):n?(0,N.jsx)(P,{role:`alert`,children:n}):e.length===0?(0,N.jsx)(P,{children:r({id:`profile-achievements-empty`})}):(0,N.jsx)(Cn,{children:e.map(e=>(0,N.jsxs)(wn,{"data-earned":e.earned?`true`:`false`,children:[(0,N.jsx)(Tn,{src:E(e.icon),alt:``,$earned:e.earned}),(0,N.jsxs)(En,{children:[(0,N.jsx)(Dn,{children:e.title}),(0,N.jsx)(On,{"aria-hidden":`true`,children:(0,N.jsx)(kn,{$percent:e.progress,"data-progress":e.progress})}),(0,N.jsx)(An,{children:e.description})]})]},e.key))})})]})}function Mn(e){let t=String(e.title??``).trim(),n=String(e.due_label??``).trim();return t&&n?`${t} - ${n}`:t||n}function Nn(e,t){return e?.[t]??[]}function Pn(e){return e?e.todo.length+e.past_due.length+e.completed.length:0}function Fn(e){return Pn(e)>0}var In=d(`progress-icon.png`),Ln=s.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
	max-width: 720px;
`,Rn=s.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`,zn=s.div`
	background: #eef7fc;
	border-radius: 16px;
	padding: 20px 24px 16px;
	box-sizing: border-box;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
`,Bn=s.div`
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	padding-bottom: 12px;
	border-bottom: 1px solid #cfe8f5;
`,Vn=s.button`
	position: relative;
	border: none;
	background: transparent;
	padding: 0 0 10px;
	font-family: ${v.fonts.Nunito};
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
`,Hn=s.ul`
	list-style: none;
	margin: 16px 0 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`,Un=s.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: 52px;
`,Wn=s.span`
	flex-shrink: 0;
	width: 8px;
	height: 40px;
	border-radius: 999px;
	background: ${({$color:e})=>e};
`,Gn=s.strong`
	flex: 1 1 auto;
	min-width: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	color: #442817;
`,Kn=s.p`
	margin: 16px 0 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`,qn=[`todo`,`past_due`,`completed`];function Jn({assignments:e,loading:t=!1,error:n=null,onActionComplete:r}){let{formatMessage:i}=o(),[a,s]=(0,M.useState)(`todo`),c=Nn(e?.tabs,a);return(0,N.jsxs)(Ln,{children:[(0,N.jsxs)(Rn,{children:[(0,N.jsx)(`img`,{src:In,alt:``}),i({id:`My-assignments`})]}),t?(0,N.jsx)(P,{children:i({id:`profile-assignments-loading`})}):n?(0,N.jsx)(P,{role:`alert`,children:n}):Fn(e?.tabs)?(0,N.jsxs)(zn,{children:[(0,N.jsx)(Bn,{role:`tablist`,"aria-label":i({id:`My-assignments`}),children:qn.map(e=>(0,N.jsx)(Vn,{type:`button`,role:`tab`,id:`profile-assign-tab-${e}`,"aria-selected":a===e,"aria-controls":`profile-assign-panel-${e}`,$active:a===e,onClick:()=>s(e),children:i({id:`dashboard-tab-${e}`})},e))}),(0,N.jsx)(`div`,{role:`tabpanel`,id:`profile-assign-panel-${a}`,"aria-labelledby":`profile-assign-tab-${a}`,children:c.length===0?(0,N.jsx)(Kn,{children:i({id:`dashboard-no-assignments`})}):(0,N.jsx)(Hn,{children:c.map(e=>(0,N.jsxs)(Un,{children:[(0,N.jsx)(Wn,{$color:le(e.subject_id),"aria-hidden":!0}),(0,N.jsx)(Gn,{children:Mn(e)}),(0,N.jsx)(ue,{item:e,onActionComplete:r})]},`${e.assign_id}-${e.assign_student_id}`))})})]}):(0,N.jsx)(P,{children:i({id:`profile-assignments-empty`})})]})}var $=`panel`;function Yn(e){return e===`assignments`||e===`edit`||e===`password`?e:`progress`}function Xn(e){return e===`progress`?null:e}function Zn(e){return Yn(e.get($))}function Qn(e,t){let n=new URLSearchParams(e),r=Xn(t);return r?n.set($,r):n.delete($),n}function $n(){let{formatMessage:e}=o(),[t,n]=r(),i=Zn(t),a=e=>{n(Qn(t,e),{replace:!0})},[s,c]=(0,M.useState)(!1),[l,u]=(0,M.useState)(null),[d,f]=(0,M.useState)(null),[p,m]=(0,M.useState)([]),[h,g]=(0,M.useState)(!0),[_,v]=(0,M.useState)(null),[b,S]=(0,M.useState)(!0),[C,w]=(0,M.useState)(null);return(0,M.useEffect)(()=>{let t=!1;return Promise.all([he(),x(`week`)]).then(([e,n])=>{t||(u(e),f(n),w(null))}).catch(n=>{t||w(y(n,e({id:`profile-load-error`})))}).finally(()=>{t||S(!1)}),g(!0),_e().then(e=>{t||(m(e),v(null))}).catch(n=>{t||(m([]),v(y(n,e({id:`profile-achievements-error`}))))}).finally(()=>{t||g(!1)}),()=>{t=!0}},[e]),b&&!l&&!d?(0,N.jsx)(ee,{}):(0,N.jsxs)(Ee,{children:[(0,N.jsx)(Ot,{logoutModalOpened:s,setLogoutModalOpened:c}),(0,N.jsx)(At,{}),(0,N.jsxs)(Me,{children:[(0,N.jsx)(Kt,{identity:l??{name:``,code:``,photo:null},active:i,onSelectPanel:a,onLogout:()=>c(!0)}),(0,N.jsxs)(Ne,{children:[C&&i!==`edit`?(0,N.jsx)(Pe,{role:`alert`,children:C}):null,i===`assignments`?(0,N.jsx)(Jn,{assignments:d?.assignments,loading:b,error:C,onActionComplete:()=>{x(`week`).then(e=>{se(e),f(e),w(null)}).catch(t=>{w(y(t,e({id:`profile-load-error`})))})}}):i===`edit`?(0,N.jsx)(Je,{identity:l??{name:``,code:``,photo:null},onIdentityUpdated:u,onDiscard:()=>a(`progress`)}):i===`password`?(0,N.jsx)(pt,{onDiscard:()=>a(`progress`)}):(0,N.jsxs)(N.Fragment,{children:[d?(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(pn,{xp:d.xp}),(0,N.jsx)(bn,{totalXp:d.xp.total_xp,classRank:d.rankings.class_rank,streakDays:ae(d.streak)})]}):(0,N.jsx)(P,{children:e({id:`profile-load-error`})}),(0,N.jsx)(jn,{items:p,loading:h,error:_})]})]})]})]})}export{$n as default};