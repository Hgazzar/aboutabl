import{r as e,t}from"./jsx-runtime-BFsvmiJY.js";import{t as n}from"./useIntl-BWNRJaAP.js";import{r}from"./styled-components.browser.esm-DYpzEdZF.js";import{n as i}from"./global-styles-8ZhPevyo.js";var a=[`#FFB300`,`#BA68C8`,`#4FC3F7`,`#81C784`,`#FF8A65`,`#9575CD`];function o(e){return e==null||e<=0?a[0]:a[e%a.length]}function s(e){return e.assign_id?`/todo/assign/${e.assign_id}`:`/todo`}var c=t(),l=r(e)`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 100px;
	height: ${32}px;
	padding: 0 20px;
	border-radius: 999px;
	background: linear-gradient(90deg, #4fc3f7 0%, #039be5 100%);
	box-shadow: 0 2px 0 rgba(3, 155, 229, 0.35);
	font-family: ${i.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: ${i.colours.white};
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;function u({item:e}){let{formatMessage:t}=n();return(0,c.jsx)(l,{to:s(e),"data-assign-action":`view`,"data-assign-id":e.assign_id,children:t({id:`dashboard-view`})})}export{o as n,u as t};