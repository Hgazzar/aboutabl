import{c as e,f as t,h as n,l as r,r as i,t as a}from"./jsx-runtime-BFsvmiJY.js";import{t as o}from"./useIntl-BWNRJaAP.js";import{r as s,t as c}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as l}from"./modal-DTyI9Y1f.js";import{t as u}from"./js.cookie-DyR7vJ7e.js";import{a as d,n as f,o as p,r as m,t as h}from"./requests-CQDHe7xd.js";import{r as g,t as _}from"./figmaAssets-DZM6ZDBD.js";import{n as v}from"./global-styles-8ZhPevyo.js";import{n as y,t as b}from"./studentApiResponse-BAEG6iMr.js";import{S as x}from"./index-DJ-Mxe_T.js";var S=n(t(),1);function C(e){if(e==null||e===``)return null;let t=Number(e);return Number.isFinite(t)?t:null}function w(e){return e===!0||e===1||e===`1`||e===`true`}function T(e){if(e==null)return null;let t=String(e).trim();return t===``?null:t}function E(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.id),r=T(t.status);return n==null||!r?null:{id:n,status:r,score:C(t.score),max_score:C(t.max_score),percent:C(t.percent),completeness:C(t.completeness),submitted_at:T(t.submitted_at),graded_at:T(t.graded_at),teacher_feedback:T(t.teacher_feedback)}}function D(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.assign_activity_id),r=C(t.activity_id);return n==null||r==null?null:{assign_activity_id:n,assign_id:C(t.assign_id)??0,activity_type:String(t.activity_type??``),activity_id:r,source_table:String(t.source_table??``),grading_mode:String(t.grading_mode??``),title:String(t.title??``),sort_order:C(t.sort_order)??0,subject_id:C(t.subject_id)??0,path:T(t.path),redo_allowed:w(t.redo_allowed),submission:E(t.submission)}}function O(e){return e===`waiting_on_teacher`||e===`awaiting_review`?`waiting_on_teacher`:e===`assignment_graded`||e===`has_teacher_grades`?`assignment_graded`:`homework_hero`}function k(e){return e===`submitted`||e===`graded`||e===`active`?e:`active`}function A(e){if(!e||typeof e!=`object`)return null;let t=e,n=T(t.key),r=T(t.label);return!n||!r?null:{key:n,label:r}}function j(e){if(!Array.isArray(e))return[];let t=[];for(let n of e){if(!n||typeof n!=`object`)continue;let e=n,r=C(e.criterion_id),i=C(e.points);r==null||i==null||t.push({criterion_id:r,points:i})}return t}function M(e){if(!e||typeof e!=`object`)return null;let t=e,n=T(t.status);return n?{id:C(t.id),assign_id:C(t.assign_id),assign_student_id:C(t.assign_student_id),status:n,final_percent:C(t.final_percent),possible_xp:C(t.possible_xp),earned_xp:C(t.earned_xp),badge:A(t.badge),teacher_feedback:T(t.teacher_feedback),graded_by:C(t.graded_by),teacher_id:C(t.teacher_id)??C(t.graded_by),teacher_name:T(t.teacher_name),teacher_photo_url:T(t.teacher_photo_url),finalized_at:T(t.finalized_at),criteria:j(t.criteria)}:null}function N(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.points),r=T(t.key),i=T(t.label);return n==null||!r||!i?null:{points:n,key:r,label:i,descriptor:T(t.descriptor)}}function P(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.id),r=T(t.label),i=C(t.weight);return n==null||!r||i==null?null:{id:n,label:r,weight:i,max_points:C(t.max_points)??0,sort_order:C(t.sort_order)??0}}function ee(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.id);if(n==null)return null;let r=Array.isArray(t.criteria)?t.criteria.map(P).filter(e=>e!=null):[],i=Array.isArray(t.levels)?t.levels.map(N).filter(e=>e!=null):[];return{id:n,title:String(t.title??``),points_possible:C(t.points_possible),criteria:r,levels:i}}function F(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.id),r=C(t.assign_id),i=T(t.kind);return n==null||r==null||!i||i!==`image`&&i!==`document`&&i!==`voice`?null:{id:n,assign_id:r,assign_student_id:C(t.assign_student_id)??0,student_id:C(t.student_id)??0,kind:i,original_filename:T(t.original_filename),url:T(t.url),mime_type:T(t.mime_type),size_bytes:C(t.size_bytes),duration_ms:C(t.duration_ms),sort_order:C(t.sort_order)??0}}function I(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.id),r=C(t.assign_id),i=T(t.kind);return n==null||r==null||!i?null:{id:n,assign_id:r,kind:i,label:T(t.label),original_filename:T(t.original_filename),url:T(t.url),mime_type:T(t.mime_type),size_bytes:C(t.size_bytes),duration_ms:C(t.duration_ms),sort_order:C(t.sort_order)??0}}function L(e,t,n){let r=new FormData;return r.append(`kind`,e),r.append(`file`,t),e===`voice`&&n!=null&&Number.isFinite(n)&&n>0&&r.append(`duration_ms`,String(Math.round(n))),r}function R(e){if(!e||typeof e!=`object`)return null;let t=e,n=C(t.assign_id);if(n==null)return null;let r=t.progress&&typeof t.progress==`object`?t.progress:{},i=t.lifecycle&&typeof t.lifecycle==`object`?t.lifecycle:{},a=Array.isArray(t.activities)?t.activities.map(D).filter(e=>e!=null):[],o=Array.isArray(t.teacher_feedback_items)?t.teacher_feedback_items.map(e=>{if(!e||typeof e!=`object`)return null;let t=e,n=T(t.teacher_feedback),r=C(t.assign_activity_id);return!n||r==null?null:{assign_activity_id:r,activity_type:String(t.activity_type??``),activity_title:String(t.activity_title??``),teacher_feedback:n,graded_at:T(t.graded_at)}}).filter(e=>e!=null):[],s=O(i.mode),c=k(i.status),l=i.status==null?s===`assignment_graded`?`graded`:s===`waiting_on_teacher`?`submitted`:`active`:c;return{assign_id:n,assign_student_id:C(t.assign_student_id),title:String(t.title??``),due_at:T(t.due_at),type:String(t.type??``),subject_id:C(t.subject_id)??0,subject_name:T(t.subject_name),unit_id:C(t.unit_id),unit_name:T(t.unit_name),lesson_id:C(t.lesson_id),lesson_name:T(t.lesson_name),context_label:T(t.context_label),progress:{tasks_completed:C(r.tasks_completed)??0,tasks_total:C(r.tasks_total)??0,completion_percent:C(r.completion_percent),fully_complete:r.fully_complete===!0,last_submitted_at:T(r.last_submitted_at),score_percent:C(r.score_percent)},lifecycle:{mode:s,status:l,submitted_at:T(i.submitted_at),is_late:i.is_late===!0,is_overdue:i.is_overdue===!0,source:typeof i.source==`string`&&i.source?i.source:`assigns_students`,can_submit:w(i.can_submit),redo_allowed:w(i.redo_allowed)||w(t.redo_allowed)},teacher_feedback_items:o,grade:M(t.grade),activities:a,materials:Array.isArray(t.materials)?t.materials.map(I).filter(e=>e!=null):[],my_work:Array.isArray(t.my_work)?t.my_work.map(F).filter(e=>e!=null):[],rubric_available:t.rubric_available===!0,rubric:t.rubric_available===!0?ee(t.rubric):null,assignment_xp:C(t.assignment_xp),redo_allowed:w(t.redo_allowed)||w(i.redo_allowed)}}async function z(e){let t=R(y(await m(`assigns/${e}/learning_activities`),`data`));if(!t)throw Error(`Invalid assignment detail payload`);return t}async function te(e){let t=await p(`assign-activities/${e}/submit`,{});if(!t||t.status!==!0)throw Error(String(t?.msg||`Submit failed`))}async function ne(e){let t=await p(`assigns/${e}/submit`,{}),n=R(y(t,`data`));if(!n)throw Error(String(t?.msg||`Assignment submit failed`));return n}async function re(e){let t=await p(`assigns/${e}/redo`,{}),n=R(y(t,`data`));if(!n)throw Error(String(t?.msg||`Assignment redo failed`));return n}async function ie(e){let t=await p(`assign-activities/${e}/redo`,{}),n=R(y(t,`data`));if(!n)throw Error(String(t?.msg||`Activity redo failed`));return n}async function B(e,t,n,r){let i=L(t,n,r),a=await d(`assigns/${e}/my-work`,i),o=F(y(a,`data`));if(!o)throw Error(String(a?.msg||`Invalid upload response`));return o}async function V(e,t){let n=await h(`assigns/${e}/my-work/${t}`);if(!n||n.status!==!0)throw Error(String(n?.msg||`Delete failed`))}async function H(e,t,n){return f(`assigns/${e}/my-work/${t}/file`,n)}var ae=new Set([`completed`,`graded`,`submitted`]);function oe(e){let t=e.submission?.status;return typeof t==`string`&&ae.has(t)}function se(e,t){return!!(e===`waiting_on_teacher`||e===`assignment_graded`||oe(t))}function ce(e,t){return e}function le(e,t){if(!e)return null;let n=new Date(e);return Number.isNaN(n.getTime())?null:new Intl.DateTimeFormat(t.startsWith(`ar`)?`ar`:`en`,{weekday:`short`,day:`numeric`,month:`short`,year:`numeric`}).format(n)}function ue(e,t){if(!e)return null;let n=new Date(e);return Number.isNaN(n.getTime())?null:new Intl.DateTimeFormat(t.startsWith(`ar`)?`ar`:`en`,{weekday:`short`,day:`numeric`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}).format(n)}function de(e){return e===`waiting_on_teacher`?{titleId:`assign-detail-hero-waiting-title`,subtitleId:`assign-detail-hero-waiting-subtitle`}:e===`assignment_graded`?{titleId:`assign-detail-hero-graded-title`,subtitleId:`assign-detail-hero-graded-subtitle`}:{titleId:`assign-detail-hero-active-title`,subtitleId:`assign-detail-hero-active-subtitle`}}function fe(e){let t=e.grade?.earned_xp!=null||e.grade?.possible_xp!=null;return{showXp:e.assignment_xp!=null||t,showRubric:e.rubric_available===!0&&e.rubric!=null,showMaterials:Array.isArray(e.materials)&&e.materials.length>0,showMyWork:Array.isArray(e.my_work)&&e.my_work.length>0,showRedo:w(e.redo_allowed)||w(e.lifecycle.redo_allowed)}}function pe(e){return w(e.redo_allowed)||w(e.lifecycle.redo_allowed)}function me(e){return w(e.redo_allowed)}function he(e){return!e||e.earned_xp==null&&e.possible_xp==null||e.earned_xp==null?null:{earned:e.earned_xp,possible:e.possible_xp}}function ge(e){let t=e.progress.tasks_completed,n=e.progress.tasks_total;return{completed:t,total:n,percent:e.progress.completion_percent==null?n>0?Math.round(t/n*100):0:e.progress.completion_percent}}function _e(e){return w(e.lifecycle.can_submit)}function ve(e){let t=typeof e.subject_name==`string`&&e.subject_name.trim()!==``?e.subject_name.trim():null,n=typeof e.title==`string`&&e.title.trim()!==``?e.title.trim():null,r=typeof e.context_label==`string`&&e.context_label.trim()!==``?e.context_label.trim():null,i=null;return e.lifecycle.mode===`waiting_on_teacher`||e.lifecycle.status===`submitted`?i=`waiting`:(e.lifecycle.mode===`homework_hero`||e.lifecycle.status===`active`)&&(i=`homework`),{subjectName:t,statusKind:i,assignmentTitle:n,contextLabel:r,showSubmit:_e(e)}}function ye(e){return e?[...e.criteria].sort((e,t)=>e.sort_order===t.sort_order?e.id-t.id:e.sort_order-t.sort_order):[]}function be(e){return e?[...e.levels].sort((e,t)=>t.points-e.points):[]}function xe(e){return typeof e==`string`&&e.trim()!==``}function Se(e,t){let n=typeof t==`string`?t.trim():``;return!n||!e||RegExp(`(?:Great work|أحسنت)\\s+${n.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}\\s*[,،]`,`i`).test(e)?e:/Great work/i.test(e)?e.replace(/Great work(?:\s*[—–\-!])?\s*/i,`Great work ${n}, `):/أحسنت/.test(e)?e.replace(/أحسنت(?:\s*[—–\-!])?\s*/,`أحسنت ${n}، `):e}function Ce(e){let t=e.lifecycle.status;return t===`submitted`||t===`graded`}function we(e){return!e}function Te(e){return!e}function U(e){return[...e].sort((e,t)=>e.sort_order===t.sort_order?e.id-t.id:e.sort_order-t.sort_order)}function W(e){return e===`image`?`image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp`:e===`document`?`.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,application/pdf`:`audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.wav,.ogg,.webm,.m4a,.aac`}function Ee(){return[W(`image`),W(`document`),W(`voice`)].join(`,`)}function G(e){let t=(e instanceof Error?e.message:typeof e==`string`?e:``).toLowerCase();return t.includes(`my_work_locked`)||t.includes(`my work is locked`)||t.includes(`locked`)&&t.includes(`work`)}function De(){return typeof window<`u`&&typeof navigator<`u`&&!!navigator.mediaDevices?.getUserMedia&&typeof MediaRecorder<`u`}function Oe(){return typeof MediaRecorder>`u`?``:[`audio/webm;codecs=opus`,`audio/webm`,`audio/mp4`].find(e=>MediaRecorder.isTypeSupported(e))||``}function ke(e){return e.includes(`mp4`)?`m4a`:`webm`}function Ae(e,t,n=1){let r=t||e.type||`audio/webm`,i=`voice-recording-${n}.${ke(r)}`;return new File([e],i,{type:r})}function je(e){return!e.canShow||e.busyId!=null}async function Me(e){let t=null;try{t=await e.redo(e.assignId)}catch(t){let n=null;try{n=await e.refresh(e.assignId)}catch{n=null}return{ok:!1,error:t,detail:n}}try{return{ok:!0,detail:await e.refresh(e.assignId)}}catch{return{ok:!0,detail:t}}}var Ne={pdf:_(`todo-material-pdf.png`),link:_(`todo-material-link.png`),image:_(`todo-material-image.png`),document:_(`todo-material-document.png`),voice:_(`todo-material-mic.png`)},Pe=_(`todo-material-paperclip.png`),Fe=_(`todo-material-mic.png`);function Ie(e){return Ne[e]}function Le(e,t){return(e||``).toLowerCase().includes(`pdf`)?!0:(t||``).toLowerCase().endsWith(`.pdf`)}function Re(e,t){if((e||``).toLowerCase().startsWith(`image/`))return!0;let n=(t||``).toLowerCase();return/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n)}function ze(e,t,n){let r=e.trim().toLowerCase();return r===`link`?`link`:r===`voice`?`voice`:Le(t,n)?`pdf`:Re(t,n)?`image`:`document`}function Be(e,t,n){return e===`image`?`image`:e===`voice`?`voice`:Le(t,n)?`pdf`:`document`}function Ve(e){let t=(e.type||``).toLowerCase();return t.startsWith(`image/`)||Re(t,e.name)?`image`:t.startsWith(`audio/`)?`voice`:`document`}function K(e){return e===`pdf`?`assign-detail-materials-type-pdf`:e===`link`?`assign-detail-materials-type-link`:e===`image`?`assign-detail-materials-type-image`:e===`voice`?`assign-detail-materials-type-voice`:`assign-detail-materials-type-document`}function He(){return`http://127.0.0.1:8000`.replace(/\/$/,``)}function Ue(e){try{let t=new URL(e);if(!t.pathname.startsWith(`/storage/`))return e;let n=He(),r=``;try{r=new URL(n).hostname}catch{r=``}if(r!==``&&t.hostname===r)return`${t.pathname}${t.search}`}catch{}return e}function q(e){let t=(e||``).trim();if(!t||/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)&&!/^https?:\/\//i.test(t))return null;if(/^https?:\/\//i.test(t))return Ue(t);if(t.startsWith(`//`))return Ue(`https:${t}`);if(t.startsWith(`/storage/`))return t;let n=t.startsWith(`/`)?t:`/${t}`;return n.startsWith(`/storage/`)?n:`${He()}${n}`}function We(e){let t=q(e);if(!t)return!1;if(t.startsWith(`/`))return t.startsWith(`/storage/`);try{let e=new URL(t);return e.protocol===`http:`||e.protocol===`https:`}catch{return!1}}function J(e){return e===`image`?`preview-image`:e===`voice`?`none`:e===`document`?`download`:`open-tab`}function Ge(e){let t=q(e);!t||!We(t)||window.open(t,`_blank`,`noopener,noreferrer`)}function Ke(e,t){let n=document.createElement(`a`);n.href=e,n.download=t,n.rel=`noopener noreferrer`,document.body.appendChild(n),n.click(),n.remove()}async function qe(e,t){let n=q(e);if(!n||!We(n))return;let r=(t||``).trim()||`download`;try{let e=await fetch(n,{credentials:`include`});if(!e.ok)throw Error(`download_failed_${e.status}`);let t=await e.blob(),i=URL.createObjectURL(t);Ke(i,r),window.setTimeout(()=>URL.revokeObjectURL(i),3e4)}catch{Ke(n,r)}}function Je(e,t){let n=(t||``).trim()||`download`,r=URL.createObjectURL(e);Ke(r,n),window.setTimeout(()=>URL.revokeObjectURL(r),3e4)}async function Ye(e){let t=J(e.visual),n=q(e.url);return t===`none`||!n||!We(n)?{mode:`none`}:t===`preview-image`?{mode:`preview-image`,url:n}:t===`download`?(await qe(n,e.filename),{mode:`download`}):(Ge(n),{mode:`open-tab`})}var Y=`#1ebba3`,Xe=v.colours.PaoloVeroneseGreen,X=`#492613`,Ze=s.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	font-family: ${v.fonts.Nunito};
	box-sizing: border-box;
`,Qe=s.main`
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	border-radius: 20px;
	/* Homework hero bird stays under the white card; waiting/graded peek can sit on top. */
	overflow: ${({$peekBird:e})=>e?`visible`:`hidden`};
	background: ${Xe};
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
`,$e=s.section`
	position: relative;
	min-height: 300px;
	padding: 12px 0 0 28px;
	box-sizing: border-box;
	overflow: ${({$peekBird:e})=>e?`visible`:`hidden`};
	z-index: ${({$peekBird:e})=>e?3:1};

	@media (max-width: 720px) {
		min-height: 0;
		padding: 16px 16px 0;
	}
`,et=s.div`
	position: relative;
	z-index: 1;
	display: block;
	min-height: 300px;

	@media (max-width: 720px) {
		min-height: 0;
	}
`,tt=s.div`
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
	transform: ${({$waiting:e,$nudgeY:t=0})=>{let n=(e?15:0)+t;return n?`translateY(${n}px)`:`none`}};

	@media (max-width: 720px) {
		max-width: 100%;
		padding-bottom: 12px;
	}
`,nt=s.h1`
	margin: 0;
	padding: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-style: normal;
	font-size: 104px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${v.colours.white};
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
	text-align: start;

	@media (max-width: 1100px) {
		font-size: clamp(56px, 8.5vw, 104px);
	}

	@media (max-width: 720px) {
		font-size: clamp(40px, 12vw, 64px);
	}
`,rt=s.span`
	display: block;
	white-space: nowrap;
`,it=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
	text-align: start;
`,at=s.span`
	display: block;
`,ot=s.div`
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	z-index: 0;
`,st=s.div`
	position: absolute;
	z-index: ${({$underWhite:e})=>e?1:4};
	inset-inline-end: -18px;
	bottom: -56px;
	width: min(460px, 52%);
	aspect-ratio: 530 / 420;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		position: relative;
		inset-inline-end: auto;
		bottom: auto;
		width: min(280px, 90%);
		margin: 0 auto -36px;
		z-index: ${({$underWhite:e})=>e?1:4};
	}
`,ct=s.div`
	position: relative;
	width: 100%;
	height: 100%;
	/* Homework hero: -50px left, 14px down. Waiting/graded peek: -50px left, 24px down (+ optional nudge). */
	transform: ${({$underWhite:e,$nudgeY:t=0})=>e?`translate(-50px, ${14+t}px)`:`translate(-50px, ${24+t}px)`};
`,lt=s.img`
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
`,ut=s.img`
	position: relative;
	z-index: ${({$underWhite:e})=>e?1:5};
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center bottom;
	user-select: none;
	pointer-events: none;
`,dt=s.section`
	position: relative;
	z-index: 2;
	margin: 0 20px 20px;
	padding: 22px 24px 28px;
	border-radius: 20px;
	background: ${v.colours.white};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	box-sizing: border-box;
	overflow: visible;

	@media (max-width: 640px) {
		margin: 0 12px 12px;
		padding: 16px;
	}
`,ft=s(i)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 12px;
	font-weight: 700;
	font-size: 14px;
	color: #9c9b9b;
	text-decoration: none;

	&:hover {
		color: ${Y};
	}
`,pt=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
`,mt=s.div`
	min-width: 0;
	flex: 1 1 220px;
	text-align: start;
`,ht=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8px;
	text-align: end;
	flex: 0 0 auto;
	min-width: max-content;

	@media (max-width: 640px) {
		align-items: stretch;
		text-align: start;
		width: 100%;
	}
`,gt=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`,_t=s.h2`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(22px, 3vw, 32px);
	line-height: 1.2;
	color: #1f1f1f;
	text-align: start;
	/* Subject + "Homework:" must stay on one line. */
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
`;s.span`
	font-weight: 600;
	white-space: nowrap;
`;var vt=s.p`
	margin: 6px 0 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(16px, 2.2vw, 20px);
	line-height: 1.3;
	color: #3a3545;
	text-align: start;
`,yt=s.p`
	margin: 4px 0 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(14px, 1.8vw, 16px);
	line-height: 1.3;
	color: #5a5566;
	text-align: start;
`,Z=s.p`
	margin: 6px 0 0;
	font-size: 13px;
	font-weight: 800;
	color: ${Y};
	text-align: start;
`;s(Z)`
	color: #8a8494;
	font-weight: 700;
`;var bt=s.p`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: 8px 0 0;
	font-family: ${v.fonts.Nunito};
	font-size: 13px;
	font-weight: 600;
	line-height: 1.2;
	color: #9c9b9b;
	text-align: start;
`,xt=s.span`
	display: inline-flex;
	flex: 0 0 auto;
	width: 14px;
	height: 14px;
	color: #9c9b9b;

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
`,St=s.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	margin: 12px 0 18px;
	padding: 14px 16px;
	border-radius: 16px;
	background: #fff6e8;
	border: 1px solid #f0d9b5;
	font-size: 14px;
	font-weight: 700;
	color: #5a4630;
	text-align: start;
	line-height: 1.4;
`;s.img`
	width: 48px;
	height: 48px;
	flex: 0 0 auto;
	object-fit: contain;
`;var Ct=s.div`
	position: relative;
	display: flex;
	align-items: flex-end;
	justify-content: flex-start;
	gap: 14px;
	width: 100%;
	/* Pull scene up 85px total and collapse leftover white space (no transform gap). */
	margin: -81px 0 22px;
	/* Room for Group 4 bees that sit above the bubble (must stay inside this box). */
	padding-top: 68px;
	overflow: visible;
	box-sizing: border-box;

	@media (max-width: 640px) {
		flex-wrap: wrap;
		column-gap: 8px;
		row-gap: 6px;
		padding-top: 56px;
		margin: -81px 0 18px;
	}
`,wt=s.img`
	flex: 0 0 auto;
	width: 100px;
	height: auto;
	object-fit: contain;
	object-position: bottom center;
	align-self: flex-end;
	margin: 0;
	z-index: 2;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 84px;
	}
`,Tt=s.div`
	flex: 0 1 auto;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: flex-end;
	gap: 8px;
	align-self: flex-end;
	min-width: 0;
	z-index: 2;
`,Et=s.h3`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: clamp(15px, 1.8vw, 18px);
	line-height: 1.2;
	color: #492613;
	text-align: start;
	white-space: nowrap;
`,Dt=s.div`
	display: flex;
	align-items: flex-end;
	justify-content: flex-start;
	gap: 14px;
	min-width: 0;
	width: 100%;
`,Ot=s.img`
	flex: 0 0 auto;
	width: 100px;
	height: 100px;
	border-radius: 22px;
	object-fit: cover;
	object-position: center;
	background: #7ed4cf;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 84px;
		height: 84px;
	}
`,kt=s.div`
	position: relative;
	flex: 0 1 auto;
	width: fit-content;
	max-width: min(560px, calc(100% - 220px));
	overflow: visible;
	z-index: 1;
`,At=s.div`
	position: relative;
	z-index: 1;
	width: fit-content;
	max-width: 100%;
	padding: 14px 22px 16px;
	border-radius: 22px;
	background: #f9eed8;
	text-align: start;
	box-sizing: border-box;

	/* Tail toward bird head (upper-left), matching original3 */
	&::before {
		content: '';
		position: absolute;
		inset-inline-start: -11px;
		top: 22px;
		width: 20px;
		height: 20px;
		background: #f9eed8;
		transform: rotate(45deg);
		border-radius: 3px;
	}

	[dir='rtl'] &::before {
		inset-inline-start: auto;
		inset-inline-end: -11px;
	}
`,jt=s.span`
	display: block;
	margin: 0 0 6px;
	font-family: ${v.fonts.Nunito};
	font-size: 13px;
	font-weight: 600;
	color: #b8a07e;
`,Mt=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-size: clamp(14px, 1.55vw, 16px);
	font-weight: 700;
	line-height: 1.4;
	color: #4a3a2a;
	white-space: pre-line;
`,Nt=s.img`
	position: absolute;
	z-index: 3;
	inset-inline-start: 42%;
	bottom: calc(100% + 6px);
	width: min(280px, 90%);
	height: auto;
	object-fit: contain;
	transform: translateX(50px);
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		inset-inline-start: 28%;
		width: min(200px, 95%);
		bottom: calc(100% + 4px);
		transform: translateX(50px);
	}
`,Pt=s.div`
	flex: 1 1 0;
	min-width: 0;
	display: flex;
	align-items: ${({$alignEnd:e})=>e?`flex-end`:`center`};
	justify-content: ${({$alignEnd:e})=>e?`flex-end`:`center`};
	/* Match MetricsRow horizontal padding so grade badge lines up with Due Date */
	padding-inline-end: ${({$alignEnd:e})=>e?`18px`:`0`};
	align-self: stretch;
`,Ft=s.img`
	flex: 0 0 auto;
	width: 248px;
	height: auto;
	object-fit: contain;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: 207px;
	}
`,It=s.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 16px;
	margin-bottom: 22px;
	padding: 16px 18px;
	border-radius: 24px;
	background: #eef8f5;
	/* Same shadow as profile PocketCard / Panel */
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;

	@media (max-width: 720px) {
		flex-wrap: wrap;
		gap: 12px;
		padding: 14px;
		border-radius: 20px;
	}
`,Lt=s.div`
	flex: 1 1 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 10px;
`,Rt=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 700;
	line-height: 1.3;
	color: #3a322c;
	text-align: start;

	em {
		font-style: normal;
		font-weight: 800;
		color: ${Y};
	}
`,zt=s.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: stretch;
	gap: 12px;
	flex: 0 0 auto;

	@media (max-width: 720px) {
		width: 100%;
		flex-wrap: wrap;

		& > * {
			flex: 1 1 140px;
		}
	}
`,Bt=s.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 14px;
	border-radius: 14px;
	box-sizing: border-box;
	background: ${({$solid:e})=>e?Y:`transparent`};
	color: ${({$solid:e})=>e?v.colours.white:`#2a5f57`};
	${({$wide:e})=>e?``:`flex: 0 0 auto; min-width: 168px;`}
	${({$solid:e})=>e?`
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			0 4px 8px rgba(0, 0, 0, 0.14);
	`:``}
`,Vt=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	min-width: 0;
	text-align: start;
`,Ht=s.span`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.01em;
	opacity: 0.95;
	text-align: start;
	line-height: 1.2;
`,Ut=s.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
	font-weight: 800;
	text-align: start;
	line-height: 1.2;
`,Wt=s.img`
	width: 28px;
	height: 28px;
	flex: 0 0 auto;
	object-fit: contain;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18));
`,Gt=s.div`
	height: 8px;
	border-radius: 999px;
	background: rgba(30, 187, 163, 0.16);
	overflow: hidden;
`,Kt=s.div`
	height: 100%;
	width: ${({$percent:e})=>Math.max(0,Math.min(100,e))}%;
	border-radius: 999px;
	background: ${Y};
`,qt=s.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 10px 14px;
	border-radius: 14px;
	background: ${Y};
	color: ${v.colours.white};
	font-weight: 800;
	font-size: 16px;
	text-align: start;
	box-sizing: border-box;
	flex: 0 0 auto;
	min-width: 168px;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
`,Jt=s.h3`
	margin: ${({$gapBefore:e})=>e?`28px`:`0`} 0 10px;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	color: #1f1f1f;
	text-align: start;
`,Yt=s.p`
	margin: -4px 0 12px;
	font-size: 14px;
	font-weight: 600;
	color: #8a8494;
	text-align: start;
`,Xt=s.ul`
	list-style: none;
	margin: 0 0 8px;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
`,Zt=s.li`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	padding: 14px 18px;
	border-radius: 22px;
	background: ${({$completed:e})=>e?`#e7f8f4`:v.colours.white};
	border: none;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;

	@media (max-width: 640px) {
		flex-wrap: wrap;
		padding: 12px 14px;
		border-radius: 18px;
	}
`,Qt=s.div`
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
	flex: 1 1 auto;
	text-align: start;
`,$t=s.img`
	flex: 0 0 auto;
	width: 48px;
	height: 48px;
	object-fit: contain;
	display: block;
	image-rendering: -webkit-optimize-contrast;
`,en=s.div`
	min-width: 0;
	flex: 1 1 auto;
	text-align: start;
`;s.span`
	display: block;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	color: ${Y};
`;var tn=s.span`
	display: block;
	font-family: ${v.fonts.Nunito};
	font-size: 15px;
	font-weight: 800;
	line-height: 1.3;
	color: #3a322c;
`,nn=s.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	flex: 0 0 auto;

	@media (max-width: 640px) {
		width: 100%;
		justify-content: flex-end;
	}
`,rn=s.span`
	font-family: ${v.fonts.Nunito};
	font-size: 14px;
	font-weight: 800;
	color: ${Y};
	white-space: nowrap;
`,an=s.button`
	appearance: none;
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border: 1.5px solid #c5c5c5;
	border-radius: 10px;
	background: #f3f3f3;
	color: #5a5a5a;
	cursor: pointer;
	box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);

	svg {
		width: 18px;
		height: 18px;
		display: block;
	}

	&:hover {
		background: #ececec;
	}

	&:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	&:focus-visible {
		outline: 2px solid ${Y};
		outline-offset: 2px;
	}
`,on=s.button`
	appearance: none;
	border: ${({$secondary:e})=>e?`2px solid ${Y}`:`none`};
	cursor: pointer;
	min-height: ${({$large:e})=>e?`52px`:`40px`};
	padding: ${({$large:e})=>e?`0 32px`:`0 22px`};
	border-radius: 999px;
	background: ${({$secondary:e})=>e?`#fff`:`#3a322c`};
	color: ${({$secondary:e})=>e?Y:v.colours.white};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: ${({$large:e})=>e?`16px`:`14px`};
	letter-spacing: 0.02em;
	box-shadow: ${({$secondary:e,$large:t})=>e?`none`:t?`0 3px 0 #1d9386`:`0 3px 0 #2a241f`};

	${({$large:e})=>e?`
		background: #23b8a2;
		text-transform: uppercase;
		box-shadow: 0 3px 0 #1d9386;
	`:``}

	@media (max-width: 640px) {
		${({$large:e})=>e?`width: 100%;`:``}
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: #9aa7a4;
		border-color: #9aa7a4;
		color: ${v.colours.white};
		box-shadow: none;
		text-transform: none;
	}
`,sn=`#fec240`,cn=`#e49c20`,ln=`#ba0c12`,un=s.button`
	appearance: none;
	border: none;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	min-height: 52px;
	min-width: 145px;
	padding: 0 32px;
	border-radius: 999px;
	background: ${sn};
	color: ${ln};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	box-shadow: 0 3px 0 ${cn};
	flex-shrink: 0;

	@media (max-width: 640px) {
		width: 100%;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		background: #cfcfcf;
		color: #6b6b6b;
		box-shadow: none;
	}

	&:focus-visible {
		outline: 2px solid ${ln};
		outline-offset: 2px;
	}
`,dn=s.span`
	display: inline-flex;
	flex-shrink: 0;
	width: 20px;
	height: 20px;
	color: inherit;

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
`,fn=s.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 22px;
`,pn=s.div`
	padding: 14px 16px;
	border-radius: 16px;
	background: #fff8ef;
	border: 1px solid #f0d9b5;
	text-align: start;
`,mn=s.div`
	font-size: 12px;
	font-weight: 800;
	color: #8a6a3d;
	margin-bottom: 6px;
`,hn=s.p`
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #3d3428;
	line-height: 1.4;
`,gn=s.p`
	margin: 0;
	padding: 16px;
	color: #c0392b;
	font-weight: 700;
`,_n=s.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	z-index: 1;
	flex: 0 0 auto;
	/* Same rail width as DuePill so right edges match */
	min-width: 168px;
	transform: translateY(-35px);

	${Ft} {
		width: 168px;

		@media (max-width: 640px) {
			width: 140px;
		}
	}
`,vn=s.img`
	position: absolute;
	z-index: 3;
	inset-inline-end: calc(100% + 13px);
	top: -6px;
	width: min(390px, 115%);
	height: auto;
	object-fit: contain;
	object-position: right center;
	pointer-events: none;
	user-select: none;

	@media (max-width: 640px) {
		width: min(280px, 110%);
		top: -2px;
		inset-inline-end: calc(100% + 13px);
	}
`,yn=s.div`
	position: relative;
	display: inline-flex;
	align-self: center;
	align-items: center;
	justify-content: center;
	min-height: 64px;
	min-width: 168px;
	padding: 14px 28px;
	border-radius: 22px;
	background: ${Y};
	color: #ffe566;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(28px, 4.2vw, 40px);
	line-height: 1.05;
	letter-spacing: 0.01em;
	text-shadow: 0 2px 0 rgba(0, 80, 70, 0.25);
	box-sizing: border-box;
`;s.img`
	position: absolute;
	inset-block-start: -10px;
	inset-inline-end: -8px;
	width: 28px;
	height: 28px;
	object-fit: contain;
`,s.p`
	margin: 0;
	font-size: 16px;
	font-weight: 800;
	color: #2a5f57;
	text-align: start;
`,s.div`
	display: inline-flex;
	align-self: flex-start;
	align-items: center;
	gap: 8px;
	padding: 12px 18px;
	border-radius: 16px;
	background: ${Y};
	color: ${v.colours.white};
	font-weight: 800;
	font-size: 15px;
`,s.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 28px;
	margin: 4px 0 22px;
`,s.div`
	width: 100%;
	max-width: 520px;
	padding: 16px 18px;
	border-radius: 18px;
	background: #e8f8f5;
	border: 1px solid #c5ebe4;
	text-align: start;
	box-sizing: border-box;
`,s.div`
	font-size: 12px;
	font-weight: 800;
	color: #2a5f57;
	margin-bottom: 8px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;var bn=s.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 8px 0 4px;
	text-align: start;
`,xn=s.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 22px;
	border-radius: 28px;
	background: ${v.colours.white};
	border: none;
	/* Same shadow as profile PocketCard */
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
	box-sizing: border-box;
`,Sn=s.div`
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
`,Cn=s.img`
	flex-shrink: 0;
	width: 36px;
	height: 36px;
	object-fit: contain;
	display: block;
`,wn=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.3;
	color: #6b6570;
`,Tn=s.button`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 36px;
	padding: 0 22px;
	border: none;
	border-radius: 999px;
	background: #408fd1;
	color: ${v.colours.white};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.02em;
	cursor: pointer;
	/* Hard bottom shadow — matches Figma startButtonRound */
	box-shadow: 0 4px 0 #1d5f94;

	&:hover {
		filter: brightness(1.04);
	}

	&:active {
		transform: translateY(2px);
		box-shadow: 0 2px 0 #1d5f94;
	}

	&:focus-visible {
		outline: 2px solid ${X};
		outline-offset: 3px;
	}
`,En=s.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	max-height: min(88vh, 860px);
	overflow: hidden;
	border-radius: 20px;
	background: ${v.colours.white};
`,Dn=s.header`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px 24px;
	margin: 0;
	background: ${Xe};
	color: ${v.colours.white};
	text-align: start;
	border-radius: 20px 20px 0 0;
`,On=s.h2`
	margin: 0;
	flex: 1 1 auto;
	min-width: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(22px, 2.6vw, 30px);
	line-height: 1.15;
	color: ${v.colours.white};
`,kn=s.p`
	margin: 0;
	flex-shrink: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.82);
	white-space: nowrap;
`,An=s.button`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-inline-start: 4px;
	border: none;
	border-radius: 999px;
	background: transparent;
	color: rgba(255, 255, 255, 0.92);
	font-size: 26px;
	line-height: 1;
	cursor: pointer;

	&:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	&:focus-visible {
		outline: 2px solid ${v.colours.white};
		outline-offset: 2px;
	}
`,jn=s.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 20px 22px 8px;
	overflow-y: auto;
	overscroll-behavior: contain;
	background: ${v.colours.white};
`,Mn=s.article`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 18px 18px 16px;
	border-radius: 18px;
	background: ${v.colours.white};
	box-shadow: 0 2px 14px rgba(0, 0, 0, 0.08);
	border: 1px solid #eef2f1;
	box-sizing: border-box;
`,Nn=s.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`,Pn=s.h3`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.25;
	color: ${X};
	text-align: start;
`,Fn=s.span`
	flex-shrink: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9aa0a6;
`,In=s.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 560px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
`,Ln=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	min-height: 132px;
	padding: 12px 12px 14px;
	border-radius: 14px;
	background: ${({$active:e})=>e?Y:`#eceff1`};
	box-sizing: border-box;
	text-align: start;
	color: ${({$active:e})=>e?v.colours.white:X};
`,Rn=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1.2;
	color: inherit;
`,zn=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 12px;
	line-height: 1.2;
	color: inherit;
	opacity: 0.78;
`,Bn=s.span`
	flex: 1 1 auto;
	min-height: 48px;
	width: 100%;
`,Vn=s.span`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1 1 auto;
	width: 100%;
	min-height: 40px;
	font-size: 28px;
	line-height: 1;
	font-weight: 700;
	color: inherit;
`,Hn=s.span`
	margin-top: auto;
	font-family: ${v.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.25;
	color: inherit;
`,Un=s.footer`
	display: flex;
	justify-content: flex-end;
	padding: 12px 22px 20px;
	background: ${v.colours.white};
`,Wn=s.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 128px;
	min-height: 46px;
	padding: 0 24px;
	border: none;
	border-radius: 12px;
	background: ${Y};
	color: ${v.colours.white};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;

	&:hover {
		filter: brightness(1.04);
	}

	&:focus-visible {
		outline: 2px solid ${X};
		outline-offset: 3px;
	}
`,Gn=`0 2px 8px rgba(0, 0, 0, 0.1)`,Kn=s.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin: 28px 0 20px;
	text-align: start;
	width: 100%;
`,qn=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	gap: 12px 22px;
`,Jn=s.h3`
	margin: 0;
	font-family: ${v.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.2;
	color: ${X};
	text-align: start;
	flex: 0 0 auto;
`,Yn=s.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 20px;
`,Xn=s.button`
	appearance: none;
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
	cursor: pointer;
	color: ${X};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	white-space: nowrap;

	&:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		opacity: 0.82;
	}

	&:focus-visible {
		outline: 2px solid ${Y};
		outline-offset: 3px;
		border-radius: 6px;
	}
`,Zn=s.img`
	width: 18px;
	height: 18px;
	object-fit: contain;
	display: block;
	flex: 0 0 auto;
`,Qn=s.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: stretch;
	justify-content: flex-start;
	gap: 16px 18px;
`,Q=268,$n=168,er=s.li`
	margin: 0;
	flex: 0 0 ${Q}px;
	width: ${Q}px;
	max-width: 100%;
	min-width: 0;
	box-sizing: border-box;

	@media (max-width: 560px) {
		flex-basis: min(${Q}px, 100%);
		width: min(${Q}px, 100%);
	}
`,tr=s.button`
	appearance: none;
	border: none;
	background: transparent;
	color: #ba0c12;
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	line-height: 1;
	cursor: pointer;
	padding: 0;
	flex: 0 0 auto;
	align-self: flex-end;
	margin-top: 4px;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #ba0c12;
		outline-offset: 2px;
	}
`,nr=s.div`
	position: relative;
	width: 100%;
	height: ${$n}px;
	margin: 0;
	border-radius: 12px;
	background: ${v.colours.white};
	border: none;
	box-shadow: ${Gn};
	padding: 18px 16px;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	gap: 6px;
	text-align: start;
	box-sizing: border-box;
`,rr=s.button`
	appearance: none;
	width: 100%;
	margin: 0;
	border: none;
	background: transparent;
	padding: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12px;
	text-align: start;
	cursor: pointer;
	box-sizing: border-box;
	min-width: 0;
	min-height: 0;
	flex: 1 1 auto;

	&:disabled {
		cursor: default;
	}

	&:focus-visible {
		outline: 2px solid ${Y};
		outline-offset: 3px;
		border-radius: 8px;
	}
`,ir=s.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	gap: 3px;
	min-width: 0;
	flex: 1 1 auto;
`,ar=s.img`
	width: 56px;
	height: 56px;
	object-fit: contain;
	object-position: center;
	display: block;
	flex: 0 0 56px;
	image-rendering: auto;
	-webkit-user-drag: none;
`,or=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #2f2f2f;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.2;
`,sr=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9a9a9a;
	overflow: hidden;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	white-space: normal;
	word-break: break-word;
	max-width: 100%;
`,cr=s.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	min-width: 0;
	width: 100%;
`,lr=s.audio`
	width: 100%;
	max-width: 100%;
	height: 32px;
	margin-top: 8px;
`,ur=s.p`
	margin: 0;
	padding: 10px 12px;
	border-radius: 12px;
	background: rgba(73, 38, 19, 0.08);
	color: ${X};
	font-family: ${v.fonts.Nunito};
	font-weight: 700;
	font-size: 13px;
	line-height: 1.4;
`,dr=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	color: #8a8494;
`,fr=s.input`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`,pr=s.span`
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	color: #8a8494;
`,mr=s.button`
	appearance: none;
	border: none;
	background: transparent;
	color: ${Xe};
	font-family: ${v.fonts.Nunito};
	font-weight: 800;
	font-size: 13px;
	cursor: pointer;
	padding: 6px 4px;
	text-decoration: underline;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		text-decoration: none;
	}
`,hr=s.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 16px;
`,gr=s.p`
	margin: 0;
	font-family: ${v.fonts.Nunito};
	font-weight: 600;
	font-size: 15px;
	line-height: 1.5;
	color: #4a4a4a;
	text-align: start;
`,_r=s.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: min(92vw, 720px);
	max-height: min(78vh, 640px);
	padding: 8px;
	box-sizing: border-box;
	background: #f7fafb;
	border-radius: 12px;
	overflow: auto;
`,vr=s.img`
	display: block;
	max-width: 100%;
	max-height: min(72vh, 600px);
	width: auto;
	height: auto;
	object-fit: contain;
	border-radius: 8px;
`,$=a();function yr(e){return[...e].sort((e,t)=>e.sort_order===t.sort_order?e.id-t.id:e.sort_order-t.sort_order)}function br(e,t){return t?J(e)!==`none`:!1}function xr({items:e}){let{formatMessage:t}=o(),n=yr(e),[r,i]=(0,S.useState)(null),a=(e,t,n,r)=>{Ye({visual:e,url:t,filename:n}).then(e=>{e.mode===`preview-image`&&i({url:e.url,name:r})})};return(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(Kn,{"aria-labelledby":`assign-detail-materials-teacher-heading`,children:[(0,$.jsx)(qn,{children:(0,$.jsx)(Jn,{id:`assign-detail-materials-teacher-heading`,children:t({id:`assign-detail-materials-title`})})}),n.length===0?(0,$.jsx)(dr,{children:t({id:`assign-detail-materials-empty`})}):(0,$.jsx)(Qn,{children:n.map(e=>{let n=ze(e.kind,e.mime_type,e.original_filename),r=e.label?.trim()||e.original_filename||t({id:K(n)}),i=q(e.url),o=n===`voice`,s=br(n,i);return(0,$.jsx)(er,{children:(0,$.jsxs)(nr,{children:[(0,$.jsxs)(rr,{type:`button`,disabled:!s&&!o,onClick:()=>{s&&a(n,e.url,e.original_filename,r)},children:[(0,$.jsx)(ar,{src:Ie(n),alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(ir,{children:[(0,$.jsx)(or,{children:t({id:K(n)})}),(0,$.jsx)(sr,{title:r,children:r})]})]}),o&&i?(0,$.jsx)(lr,{controls:!0,preload:`none`,src:i}):null]})},e.id)})})]}),(0,$.jsx)(l,{opened:r!=null,onClose:()=>i(null),title:r?.name||t({id:`assign-detail-asset-image-preview-title`}),centered:!0,size:`auto`,children:r?(0,$.jsx)(_r,{children:(0,$.jsx)(vr,{src:r.url,alt:r.name})}):null})]})}var Sr=Ee();function Cr({assignId:e,items:t,locked:n,onRefresh:r}){let{formatMessage:i}=o(),a=(0,S.useRef)(null),s=(0,S.useRef)(null),c=(0,S.useRef)(null),u=(0,S.useRef)([]),d=(0,S.useRef)(null),f=(0,S.useRef)(null),[p,m]=(0,S.useState)(!1),[h,g]=(0,S.useState)(!1),[_,v]=(0,S.useState)(null),[y,x]=(0,S.useState)(null),[C,w]=(0,S.useState)(null),[T,E]=(0,S.useState)(null),[D,O]=(0,S.useState)(null),[k,A]=(0,S.useState)({}),j=U(t),M=we(n)&&!p&&_==null&&!h,N=Te(n)&&!p&&!h,P=(0,S.useCallback)(()=>{c.current?.getTracks().forEach(e=>e.stop()),c.current=null},[]),ee=(0,S.useCallback)(()=>{let e=s.current;e&&e.state!==`inactive`?e.stop():(P(),g(!1),s.current=null,d.current=null)},[P]);(0,S.useEffect)(()=>()=>{let e=s.current;e&&e.state!==`inactive`&&(e.onstop=null,e.stop()),c.current?.getTracks().forEach(e=>e.stop()),s.current=null,c.current=null,u.current=[]},[]),(0,S.useEffect)(()=>{let t=j.filter(e=>e.kind===`voice`);if(t.length===0){A(e=>(Object.values(e).forEach(e=>URL.revokeObjectURL(e)),{}));return}let n=!1,r=[],i=new AbortController;return(async()=>{let a={};for(let o of t)try{let t=await H(e,o.id,i.signal);if(n)return;let s=URL.createObjectURL(t);r.push(s),a[o.id]=s}catch{}n||A(e=>(Object.values(e).forEach(e=>URL.revokeObjectURL(e)),a))})(),()=>{n=!0,i.abort(),r.forEach(e=>URL.revokeObjectURL(e))}},[e,j.map(e=>`${e.id}:${e.kind}`).join(`|`)]);let F=()=>{O(null),f.current&&=(URL.revokeObjectURL(f.current),null)},I=async(t,n,r)=>{let a=J(t);if(a!==`none`){w(null),x(n.id);try{let t=await H(e,n.id),i=URL.createObjectURL(t);if(a===`preview-image`){f.current&&URL.revokeObjectURL(f.current),f.current=i,O({url:i,name:r});return}if(a===`download`){Je(t,n.original_filename||r),URL.revokeObjectURL(i);return}window.open(i,`_blank`,`noopener,noreferrer`),window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}catch(e){w(b(e,i({id:`assign-detail-my-work-open-error`})))}finally{x(null)}}},L=async(t,n,a)=>{let o=Ae(t,n,j.length+1);m(!0);try{await B(e,`voice`,o,a),await r()}catch(e){w(b(e,i({id:`assign-detail-my-work-upload-error`}))),G(e)&&await r()}finally{m(!1)}},R=async()=>{if(!(!we(n)||p||_!=null)){if(h){ee();return}if(!De()){w(i({id:`assign-detail-my-work-voice-unsupported`}));return}w(null);try{let e=await navigator.mediaDevices.getUserMedia({audio:!0});c.current=e,u.current=[];let t=Oe(),n=t?new MediaRecorder(e,{mimeType:t}):new MediaRecorder(e);n.ondataavailable=e=>{e.data&&e.data.size>0&&u.current.push(e.data)},n.onstop=()=>{let e=n.mimeType||t||`audio/webm`,r=new Blob(u.current,{type:e});u.current=[];let a=d.current;d.current=null;let o=a==null?null:Math.max(1,Date.now()-a);if(P(),s.current=null,g(!1),r.size===0){w(i({id:`assign-detail-my-work-voice-empty`}));return}L(r,e,o)},s.current=n,d.current=Date.now(),n.start(),g(!0)}catch{P(),g(!1),s.current=null,d.current=null,w(i({id:`assign-detail-my-work-voice-permission`}))}}},z=async t=>{if(!t||t.length===0||!M)return;let n=Array.from(t).slice(0,10);w(null),m(!0);let o=[],s=0;try{for(let t of n){if(t.size>104857600){o.push(i({id:`assign-detail-my-work-file-too-large`},{name:t.name,maxMb:100}));continue}try{let n=Ve(t),r=null;n===`voice`&&(r=await wr(t)),await B(e,n,t,r),s+=1}catch(e){if(o.push(b(e,i({id:`assign-detail-my-work-file-upload-failed`},{name:t.name}))),G(e)){await r();break}}}s>0&&await r(),o.length>0?w(o.join(` · `)):t.length>10&&w(i({id:`assign-detail-my-work-too-many-files`},{max:10}))}finally{m(!1),a.current&&(a.current.value=``)}},te=async()=>{if(!T||!N)return;let t=T.id;E(null),w(null),v(t);try{await V(e,t),await r()}catch(e){w(b(e,i({id:`assign-detail-my-work-delete-error`}))),G(e)&&await r()}finally{v(null)}};return(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(Kn,{"aria-labelledby":`assign-detail-my-work-heading`,children:[(0,$.jsxs)(qn,{children:[(0,$.jsx)(Jn,{id:`assign-detail-my-work-heading`,children:i({id:`assign-detail-my-work-title`})}),n?null:(0,$.jsxs)(Yn,{children:[(0,$.jsxs)(Xn,{type:`button`,disabled:!M,onClick:()=>a.current?.click(),children:[(0,$.jsx)(Zn,{src:Pe,alt:``,"aria-hidden":!0,decoding:`async`}),i({id:`assign-detail-materials-upload`})]}),(0,$.jsxs)(Xn,{type:`button`,disabled:p||_!=null,onClick:()=>void R(),"aria-pressed":h,children:[(0,$.jsx)(Zn,{src:Fe,alt:``,"aria-hidden":!0,decoding:`async`}),i(h?{id:`assign-detail-my-work-stop-recording`}:{id:`assign-detail-materials-record-voice`})]})]})]}),n?(0,$.jsx)(ur,{role:`status`,children:i({id:`assign-detail-my-work-locked`})}):null,C?(0,$.jsx)(gn,{children:C}):null,h?(0,$.jsx)(pr,{children:i({id:`assign-detail-my-work-recording-hint`})}):null,p?(0,$.jsx)(pr,{children:i({id:`assign-detail-my-work-uploading`})}):null,j.length===0?(0,$.jsx)(dr,{children:i({id:`assign-detail-my-work-empty`})}):(0,$.jsx)(Qn,{children:j.map(e=>{let t=Be(e.kind,e.mime_type,e.original_filename),n=e.original_filename||i({id:K(t)}),r=_===e.id||y===e.id,a=J(t)!==`none`,o=k[e.id]||null;return(0,$.jsx)(er,{children:(0,$.jsxs)(nr,{children:[(0,$.jsxs)(rr,{type:`button`,disabled:!a&&e.kind!==`voice`||y!=null,onClick:()=>{a&&I(t,e,n)},children:[(0,$.jsx)(ar,{src:Ie(t),alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(ir,{children:[(0,$.jsx)(or,{children:i({id:K(t)})}),(0,$.jsx)(sr,{title:n,children:n})]})]}),N?(0,$.jsx)(cr,{children:(0,$.jsx)(tr,{type:`button`,disabled:r||p||h,onClick:()=>E(e),children:r&&_===e.id?i({id:`assign-detail-my-work-deleting`}):i({id:`assign-detail-my-work-delete`})})}):null,e.kind===`voice`&&o?(0,$.jsx)(lr,{controls:!0,preload:`metadata`,src:o,children:i({id:`assign-detail-my-work-play`})}):null]})},e.id)})}),n?null:(0,$.jsx)(fr,{ref:a,type:`file`,multiple:!0,accept:Sr,disabled:!M,"aria-label":i({id:`assign-detail-my-work-choose-file`}),onChange:e=>void z(e.target.files)})]}),(0,$.jsxs)(l,{opened:T!=null,onClose:()=>E(null),title:i({id:`assign-detail-my-work-delete-title`}),centered:!0,children:[(0,$.jsx)(gr,{children:i({id:`assign-detail-my-work-delete-confirm`})}),(0,$.jsxs)(hr,{children:[(0,$.jsx)(mr,{type:`button`,onClick:()=>E(null),children:i({id:`assign-detail-my-work-cancel`})}),(0,$.jsx)(on,{type:`button`,onClick:()=>void te(),children:i({id:`assign-detail-my-work-delete`})})]})]}),(0,$.jsx)(l,{opened:D!=null,onClose:F,title:D?.name||i({id:`assign-detail-asset-image-preview-title`}),centered:!0,size:`auto`,children:D?(0,$.jsx)(_r,{children:(0,$.jsx)(vr,{src:D.url,alt:D.name})}):null})]})}function wr(e){return new Promise(t=>{try{let n=URL.createObjectURL(e),r=new Audio,i=()=>{URL.revokeObjectURL(n),r.removeAttribute(`src`)};r.preload=`metadata`,r.onloadedmetadata=()=>{let e=r.duration;if(i(),!Number.isFinite(e)||e<=0){t(null);return}t(Math.round(e*1e3))},r.onerror=()=>{i(),t(null)},r.src=n}catch{t(null)}})}var Tr=_(`todo-rubric-grid-icon.png`),Er=c`
	.mantine-Modal-content.assignRubricModalContent {
		padding: 0 !important;
		overflow: hidden !important;
		background: ${v.colours.PaoloVeroneseGreen} !important;
	}

	.mantine-Modal-body.assignRubricModalBody {
		padding: 0 !important;
		padding-top: 0 !important;
	}
`;function Dr({rubric:e}){let{formatMessage:t}=o(),[n,r]=(0,S.useState)(!1),i=ye(e),a=be(e),s=()=>r(!1);return(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(Er,{}),(0,$.jsxs)(bn,{"aria-labelledby":`assign-detail-rubric-heading`,children:[(0,$.jsx)(Jt,{id:`assign-detail-rubric-heading`,children:t({id:`assign-detail-rubric-title`})}),(0,$.jsxs)(xn,{children:[(0,$.jsxs)(Sn,{children:[(0,$.jsx)(Cn,{src:Tr,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsx)(wn,{children:t({id:`assign-detail-rubric-assessment-system`})})]}),(0,$.jsx)(Tn,{type:`button`,onClick:()=>r(!0),children:t({id:`assign-detail-rubric-view`})})]})]}),(0,$.jsx)(l,{opened:n,onClose:s,withCloseButton:!1,padding:0,radius:20,size:920,centered:!0,"aria-labelledby":`assign-rubric-modal-title`,classNames:{content:`assignRubricModalContent`,body:`assignRubricModalBody`},styles:{content:{padding:0,overflow:`hidden`,background:v.colours.PaoloVeroneseGreen,boxShadow:`0 12px 40px rgba(0, 0, 0, 0.22)`},body:{padding:0},header:{display:`none`,padding:0,minHeight:0,height:0,border:`none`}},children:(0,$.jsxs)(En,{children:[(0,$.jsxs)(Dn,{children:[(0,$.jsx)(On,{id:`assign-rubric-modal-title`,children:e.title}),e.points_possible==null?null:(0,$.jsx)(kn,{children:t({id:`assign-detail-rubric-points-possible`},{points:e.points_possible})}),(0,$.jsx)(An,{type:`button`,onClick:s,"aria-label":t({id:`assign-detail-rubric-close`}),children:`×`})]}),(0,$.jsx)(jn,{children:i.map(e=>(0,$.jsxs)(Mn,{children:[(0,$.jsxs)(Nn,{children:[(0,$.jsx)(Pn,{children:e.label}),(0,$.jsx)(Fn,{children:t({id:`assign-detail-rubric-weight`},{weight:e.weight})})]}),(0,$.jsx)(In,{children:a.map(n=>{let r=xe(n.descriptor);return(0,$.jsxs)(Ln,{$active:r,children:[(0,$.jsx)(Rn,{children:n.label}),(0,$.jsx)(zn,{children:t({id:`assign-detail-rubric-level-points`},{points:n.points})}),r?(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(Vn,{"aria-hidden":!0,children:`✓`}),(0,$.jsx)(Hn,{children:n.descriptor})]}):(0,$.jsx)(Bn,{"aria-hidden":!0})]},`${e.id}-${n.key}-${n.points}`)})})]},e.id))}),(0,$.jsx)(Un,{children:(0,$.jsx)(Wn,{type:`button`,onClick:s,children:t({id:`assign-detail-rubric-close`})})})]})})]})}var Or=_(`star-6-1.svg`),kr=_(`todo-metric-clock.svg`),Ar=_(`todo-activity-book.png`),jr=_(`todo-activity-worksheet.png`),Mr=_(`todo-activity-quiz.png`),Nr=g(`hero-spark.png`),Pr=_(`todo-bird-hero.png`),Fr=_(`todo-bird-waiting.png`),Ir=_(`todo-bird-graded.svg`),Lr=_(`todo-waiting-banner-bird.png`),Rr=_(`todo-waiting-banner-bees.png`),zr=_(`todo-waiting-banner-decor.png`),Br=_(`todo-graded-teacher-avatar.png`);function Vr(e){return e===`waiting_on_teacher`?Fr:e===`assignment_graded`?Ir:Pr}function Hr(e){let t=e.trim().toLowerCase();return t===`book`||t===`lesson`||t===`scorm`?Ar:t===`quiz`||t===`quizes`?Mr:t===`worksheet`?jr:Ar}function Ur(e){let t=e.trim();return t?t.charAt(0).toUpperCase()+t.slice(1).toLowerCase():`Activity`}function Wr(){let{assignId:t}=r(),n=e(),{formatMessage:i,locale:a}=o(),[s,c]=(0,S.useState)(!0),[l,d]=(0,S.useState)(null),[f,p]=(0,S.useState)(null),[m,h]=(0,S.useState)(null),[g,_]=(0,S.useState)(null),v=(0,S.useCallback)(async()=>{let e=Number(t);if(!Number.isFinite(e)||e<=0){h(i({id:`assign-detail-load-error`})),p(null),c(!1);return}c(!0),h(null);try{p(await z(e))}catch(e){h(b(e,i({id:`assign-detail-load-error`}))),p(null)}finally{c(!1)}},[t,i]);(0,S.useEffect)(()=>{v()},[v]);let y=async e=>{if(f&&!se(f.lifecycle.mode,e)){if(_(null),e.activity_type===`worksheet`||e.activity_type===`ebook`){d(e.assign_activity_id);try{await te(e.assign_activity_id),await v()}catch(t){if(_(b(t,i({id:`assign-detail-submit-error`}))),e.activity_type===`worksheet`){d(null);return}}finally{d(null)}}e.activity_type!==`worksheet`&&e.path&&n(e.path)}},C=async()=>{if(!(!f||!_e(f))){_(null),d(-1);try{p(await ne(f.assign_id))}catch(e){_(b(e,i({id:`assign-detail-submit-error`})))}finally{d(null)}}},w=async()=>{if(!f||je({canShow:pe(f),busyId:l}))return;_(null),d(-2);let e=await Me({assignId:f.assign_id,redo:re,refresh:z});e.detail&&p(e.detail),e.ok||_(b(e.error,i({id:`assign-detail-redo-error`}))),d(null)},T=async e=>{if(!(!f||!me(e)||l!=null)){_(null),d(e.assign_activity_id);try{let t=await ie(e.assign_activity_id);p(t);let n=t.activities.find(t=>t.assign_activity_id===e.assign_activity_id);n&&await E(n)}catch(e){_(b(e,i({id:`assign-detail-activity-redo-error`})))}finally{d(null)}}},E=async e=>{e.activity_type!==`worksheet`&&e.path&&n(e.path)};if(s&&!f)return(0,$.jsx)(Ze,{children:(0,$.jsx)(Qe,{children:(0,$.jsx)(dt,{children:(0,$.jsx)(x,{})})})});if(!f)return(0,$.jsx)(Ze,{children:(0,$.jsx)(Qe,{children:(0,$.jsxs)(dt,{children:[(0,$.jsx)(ft,{to:`/todo`,children:i({id:`assign-detail-back`})}),(0,$.jsx)(gn,{children:m??i({id:`assign-detail-load-error`})})]})})});let D=ce(f.lifecycle.mode),O=de(D),k=ge(f),A=le(f.due_at,a),j=ue(f.lifecycle.submitted_at??f.progress.last_submitted_at,a),M=D===`waiting_on_teacher`,N=D===`assignment_graded`,P=ve(f),ee=P.showSubmit,F=pe(f),I=N?f.grade:null,L=ue(I?.finalized_at??null,a),R=he(I),B=f.assignment_xp??f.rubric?.points_possible??I?.possible_xp??null,V=I?.badge?.label??null,H=u.get(`username`)?.trim()||``,ae=I?.teacher_feedback??null,ye=ae?Se(ae,H):H?i({id:`assign-detail-graded-banner`},{name:H}):i({id:`assign-detail-graded-banner`},{name:``}).replace(/\s*,/,`!`),be=I?.teacher_photo_url?.trim()||Br,xe=I?.teacher_name?.trim()||``,we=Vr(D),Te=fe(f).showRubric,U=D===`homework_hero`,W=M||N;return(0,$.jsx)(Ze,{children:(0,$.jsxs)(Qe,{$peekBird:W,children:[(0,$.jsx)($e,{$peekBird:W,"aria-label":i({id:O.titleId}),children:(0,$.jsxs)(et,{children:[(0,$.jsx)(tt,{$waiting:W,$nudgeY:N?5:0,children:D===`homework_hero`?(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(nt,{children:[(0,$.jsx)(rt,{children:i({id:`assign-detail-hero-active-line-1`})}),(0,$.jsx)(rt,{children:i({id:`assign-detail-hero-active-line-2`})})]}),(0,$.jsxs)(it,{children:[(0,$.jsx)(at,{children:i({id:`assign-detail-hero-active-subtitle-line-1`})}),(0,$.jsx)(at,{children:i({id:`assign-detail-hero-active-subtitle-line-2`})})]})]}):(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(nt,{children:i({id:O.titleId})}),(0,$.jsx)(it,{children:i({id:O.subtitleId})})]})}),(0,$.jsx)(ot,{"aria-hidden":!0,children:(0,$.jsx)(st,{$underWhite:!0,children:(0,$.jsx)(ct,{$underWhite:U,$nudgeY:N?-55:0,children:(0,$.jsx)(lt,{src:Nr,alt:``,decoding:`async`})})})}),(0,$.jsx)(st,{$underWhite:U,"aria-hidden":!0,children:(0,$.jsx)(ct,{$underWhite:U,$nudgeY:N?-55:0,children:(0,$.jsx)(ut,{$underWhite:U,src:we,alt:``,decoding:`async`})})})]})}),(0,$.jsxs)(dt,{children:[(0,$.jsx)(ft,{to:`/todo`,children:i({id:`assign-detail-back`})}),(0,$.jsxs)(pt,{children:[(0,$.jsxs)(mt,{children:[P.subjectName?(0,$.jsx)(_t,{children:`${P.subjectName} ${i({id:`assign-detail-header-homework`})}`}):null,P.assignmentTitle?(0,$.jsx)(vt,{children:P.assignmentTitle}):null,P.contextLabel&&P.contextLabel!==P.assignmentTitle?(0,$.jsx)(yt,{children:P.contextLabel}):null,M?(0,$.jsxs)(bt,{children:[(0,$.jsx)(xt,{"aria-hidden":!0,children:(0,$.jsxs)(`svg`,{viewBox:`0 0 16 16`,fill:`none`,focusable:`false`,children:[(0,$.jsx)(`circle`,{cx:`8`,cy:`8`,r:`6.25`,stroke:`currentColor`,strokeWidth:`1.4`}),(0,$.jsx)(`path`,{d:`M8 8V3.5M8 8H12.25`,stroke:`currentColor`,strokeWidth:`1.4`,strokeLinecap:`round`})]})}),i({id:`assign-detail-under-review`})]}):null,N?(0,$.jsx)(bt,{children:i({id:`assign-detail-status-graded`})}):null,D===`homework_hero`&&f.lifecycle.is_overdue?(0,$.jsx)(Z,{children:i({id:`assign-detail-overdue`})}):null]}),(0,$.jsxs)(ht,{children:[ee?(0,$.jsx)(on,{type:`button`,$large:!0,disabled:l!=null,onClick:()=>void C(),children:i({id:`assign-detail-submit-assignment`})}):null,F||M&&j?(0,$.jsxs)(gt,{children:[M&&j?(0,$.jsx)(Z,{children:f.lifecycle.is_late?i({id:`assign-detail-submitted-late`},{when:j}):i({id:`assign-detail-submitted-at`},{when:j})}):null,F?(0,$.jsxs)(un,{type:`button`,disabled:l!=null,"aria-busy":l===-2,onClick:()=>void w(),children:[(0,$.jsx)(dn,{"aria-hidden":!0,children:(0,$.jsx)(`svg`,{viewBox:`0 0 24 24`,focusable:`false`,children:(0,$.jsx)(`path`,{fill:`currentColor`,d:`M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-9.33 4.97l-1.46 1.46A8 8 0 0 0 20 13c0-4.42-3.58-8-8-8zm-6.09 3.54A7.95 7.95 0 0 0 4 13c0 2.39 1.05 4.53 2.71 6l1.42-1.42A5.98 5.98 0 0 1 6 13c0-1.18.34-2.28.93-3.21l-1.02-1.25z`})})}),i({id:`assign-detail-redo-assignment`})]}):null]}):null,N&&L?(0,$.jsx)(Z,{children:i({id:`assign-detail-returned-at`},{when:L})}):null]})]}),M||N?(0,$.jsxs)(Ct,{children:[N?(0,$.jsxs)(Tt,{children:[(0,$.jsx)(Et,{children:i({id:`assign-detail-assignment-feedback-title`})}),(0,$.jsxs)(Dt,{children:[(0,$.jsx)(Ot,{src:be,alt:xe,decoding:`async`,onError:e=>{let t=e.currentTarget;t.src!==Br&&(t.src=Br)}}),(0,$.jsx)(kt,{children:(0,$.jsxs)(At,{children:[(0,$.jsx)(jt,{children:i({id:`assign-detail-waiting-message-label`})}),(0,$.jsx)(Mt,{children:ye})]})})]})]}):(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(wt,{src:Lr,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(kt,{children:[(0,$.jsx)(Nt,{src:Rr,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(At,{children:[(0,$.jsx)(jt,{children:i({id:`assign-detail-waiting-message-label`})}),(0,$.jsx)(Mt,{children:i({id:`assign-detail-waiting-banner`})})]})]})]}),(0,$.jsx)(Pt,{$alignEnd:N,children:N&&V?(0,$.jsxs)(_n,{children:[(0,$.jsx)(vn,{src:Rr,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(yn,{children:[V,V.endsWith(`!`)?``:`!`]}),(0,$.jsx)(Ft,{src:zr,alt:``,"aria-hidden":!0,decoding:`async`})]}):(0,$.jsx)(Ft,{src:zr,alt:``,"aria-hidden":!0,decoding:`async`})})]}):null,D===`homework_hero`&&f.lifecycle.is_overdue?(0,$.jsx)(St,{children:(0,$.jsx)(`span`,{children:i({id:`assign-detail-overdue-banner`})})}):null,g?(0,$.jsx)(gn,{children:g}):null,(0,$.jsxs)(It,{children:[(0,$.jsxs)(Lt,{children:[(0,$.jsx)(Rt,{children:i({id:`assign-detail-progress`},{completed:k.completed,total:k.total,completedWord:e=>(0,$.jsx)(`em`,{children:e})})}),(0,$.jsx)(Gt,{role:`progressbar`,"aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":k.percent,"aria-label":i({id:`assign-detail-progress-plain`},{completed:k.completed,total:k.total}),children:(0,$.jsx)(Kt,{$percent:k.percent})})]}),(0,$.jsxs)(zt,{children:[B==null?R?(0,$.jsxs)(Bt,{$solid:!0,children:[(0,$.jsx)(Wt,{src:Or,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(Vt,{children:[(0,$.jsx)(Ht,{children:i({id:`assign-detail-metric-xp`})}),(0,$.jsx)(Ut,{children:R.possible==null?i({id:`assign-detail-xp-earned`},{earned:R.earned}):i({id:`assign-detail-xp-earned-of-possible`},{earned:R.earned,possible:R.possible})})]})]}):null:(0,$.jsxs)(Bt,{$solid:!0,children:[(0,$.jsx)(Wt,{src:Or,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(Vt,{children:[(0,$.jsx)(Ht,{children:i({id:`assign-detail-metric-xp`})}),(0,$.jsx)(Ut,{children:i({id:`assign-detail-xp-possible`},{possible:B})})]})]}),A?(0,$.jsxs)(qt,{children:[(0,$.jsx)(Wt,{src:kr,alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsxs)(Vt,{children:[(0,$.jsx)(Ht,{children:i({id:`assign-detail-metric-due`})}),(0,$.jsx)(Ut,{children:A})]})]}):null]})]}),Te&&f.rubric?(0,$.jsx)(Dr,{rubric:f.rubric}):null,(0,$.jsx)(Jt,{$gapBefore:!0,children:i({id:`assign-detail-instructions-title`})}),(0,$.jsx)(Yt,{children:i({id:`assign-detail-instructions-hint`})}),(0,$.jsx)(Xt,{children:f.activities.map(e=>{let t=oe(e),n=se(f.lifecycle.mode,e),r=me(e),a=Ur(e.activity_type),o=e.title?.trim()||``,s=o.toLowerCase().startsWith(`${a.toLowerCase()}:`)?o:o?`${a}: ${o}`:a;return(0,$.jsxs)(Zt,{$completed:t,children:[(0,$.jsxs)(Qt,{children:[(0,$.jsx)($t,{src:Hr(e.activity_type),alt:``,"aria-hidden":!0,decoding:`async`}),(0,$.jsx)(en,{children:(0,$.jsx)(tn,{children:s})})]}),(0,$.jsx)(nn,{children:t?(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(rn,{children:i({id:`assign-detail-activity-completed`})}),r?(0,$.jsx)(an,{type:`button`,disabled:l!=null,onClick:()=>void T(e),"aria-label":i({id:`assign-detail-activity-redo`}),children:(0,$.jsx)(`svg`,{viewBox:`0 0 24 24`,focusable:`false`,"aria-hidden":!0,children:(0,$.jsx)(`path`,{fill:`currentColor`,d:`M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-9.33 4.97l-1.46 1.46A8 8 0 0 0 20 13c0-4.42-3.58-8-8-8zm-6.09 3.54A7.95 7.95 0 0 0 4 13c0 2.39 1.05 4.53 2.71 6l1.42-1.42A5.98 5.98 0 0 1 6 13c0-1.18.34-2.28.93-3.21l-1.02-1.25z`})})}):null]}):(0,$.jsx)(on,{type:`button`,disabled:n||l!=null,onClick:()=>void y(e),children:i({id:`assign-detail-start-activity`})})})]},e.assign_activity_id)})}),(0,$.jsx)(xr,{items:f.materials}),(0,$.jsx)(Cr,{assignId:f.assign_id,items:f.my_work,locked:Ce(f),onRefresh:v}),f.teacher_feedback_items.length>0?(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(Jt,{children:i({id:`assign-detail-activity-feedback-title`})}),(0,$.jsx)(fn,{children:f.teacher_feedback_items.map(e=>(0,$.jsxs)(pn,{children:[(0,$.jsxs)(mn,{children:[e.activity_type,`: `,e.activity_title]}),(0,$.jsx)(hn,{children:e.teacher_feedback})]},e.assign_activity_id))})]}):null]})]})})}export{Wr as default};