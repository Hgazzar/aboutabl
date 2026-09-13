import{t as e}from"./jsx-runtime-BFsvmiJY.js";import{r as t}from"./styled-components.browser.esm-DYpzEdZF.js";import{t as n}from"./Input-CkIlr6Tj.js";import{n as r}from"./global-styles-8ZhPevyo.js";import{a as i,l as a}from"./styles-1DuHe0DE.js";var o=t.div`
	margin-bottom: ${r.space_size};
	label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		border: 1px solid ${r.colours.BrightGray};
		height: 60px;
		border-radius: 16px;
		box-shadow: 0px 4px 0px 0px ${r.colours.Platinum};
		-webkit-box-shadow: 0px 4px 0px 0px ${r.colours.Platinum};
		-moz-box-shadow: 0px 4px 0px 0px ${r.colours.Platinum};
		.mantine-Input-icon {
			width: 40px;
			height: 40px;
			border-right: 1px solid #f0eeed;
		}
		p {
			font-family: ${r.fonts.Regular};
			font-weight: 400;
			font-size: 12px;
			color: ${r.colours[`Spanish Gray`]};
			visibility: ${e=>e.islabelVisible?`visible`:`hidden`};
			left: 55px;
			width: fit-content;
			top: 5px;
			span {
				color: ${r.colours.error};
			}
		}
		input {
			width: 100%;
			font-family: ${r.fonts.Bold};
			font-size: 14px;
			font-weight: 500;
			color: rgb(0, 0, 0);
			border: none;
			outline: none;
			border-radius:10px;
			margin-bottom: 9px;
			&::placeholder {
				color: ${r.colours.BrightGray};
			}
			&:-webkit-autofill,
			:-webkit-autofill:focus {
				transition: background-color 0s 600000s, color 0s 600000s;
			}
			&:disabled,
			&:read-only {
				background-color: ${r.colours.BrightGray};
				color: ${r.colours.SpanishGray};
				opacity: 0.6;
				cursor: not-allowed;
			}
			&[data-with-icon] {
				padding-left: 55px;
			}
		}
		&.disabled {
			background-color: ${r.colours.BrightGray};
		}
	}
	& > p {
		color: ${r.colours.error};
		margin-top: 8px;
		font-size: 12px;
		font-family: ${r.fonts.Medium};
	}
`,s=e();function c({icon:e,name:t,registerOptions:r,type:c=`text`,placeholder:l,label:u,readonly:d,labelVisibility:f=!0,className:p,disabled:m,min:h,max:g,value:_,defaultValue:v,onChange:y}){let{register:b,formState:x}=a(),{errors:S}=x,C=e=>{let n={...b&&{...b(`${t}`,r)}};Object.keys(n).length!==0&&n.onChange(e),y&&y(e)};return(0,s.jsxs)(o,{islabelVisible:f,className:p,children:[(0,s.jsxs)(`label`,{className:`${m?`disabled`:``}`,children:[u&&(0,s.jsxs)(`p`,{children:[u,typeof r?.required==`object`&&r?.required.value]}),(0,s.jsx)(n,{icon:e,type:c,placeholder:l,...b(t,r),readOnly:d,disabled:m,min:h,max:g,value:_,defaultValue:v,onChange:C})]}),!!S&&!!S[t]&&(0,s.jsx)(`div`,{className:`ErrorMessageStyle`,children:(0,s.jsx)(i,{errors:S,name:t,render:({message:e})=>(0,s.jsx)(`p`,{children:e})})})]})}export{c as t};