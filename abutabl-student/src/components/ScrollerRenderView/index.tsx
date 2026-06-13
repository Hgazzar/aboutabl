import Scrollbars from 'react-custom-scrollbars-2';
import { langState } from 'store';
import { useRecoilValue } from 'recoil';
import {  forwardRef } from 'react';
function ScrollerRenderView({ children, ...rest }: any , ref:any) {
  	const langType = useRecoilValue(langState);

	return (
		<Scrollbars
		ref={ref}
			{...rest}
			renderView={(el) => (
				<div
					style={{
						...el.style,
						marginInlineEnd: el.style.marginRight,
						marginRight: 'unset',
					}}
				></div>
			)}
			//   renderThumbVertical={(el) => {
			// console.log({el})
			//     return <div style={{...el.stle , backgroundColor:'red'}}  />
			//   }}

			renderTrackVertical={(el) => {
				return (
					<div
						style={{
							...el.style,
							[langType === 'ar' ? 'left' : 'right']: '2px',
							bottom: '2px',
							top: '2px',
							borderRadius: '3px',
						}}
					/>
				);
			}}
		>
			{children}
		</Scrollbars>
	);
}

export default forwardRef(ScrollerRenderView);
