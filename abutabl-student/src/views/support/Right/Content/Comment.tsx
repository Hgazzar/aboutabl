import React from 'react'
import {  IReply } from '../..';
import AvatarIcon from '../../svgs/AvatarIcon';
import { langState } from 'store';
import { useRecoilValue } from 'recoil';
import { whoAmi } from '../Footer';
function Comment({ comment }: { comment:IReply }) {
	const langType = useRecoilValue(langState);

	return (
		<div
			className="message flex gap-2 "
			style={{
				flexDirection: comment.sender === whoAmi ? 'row-reverse' : 'row',
			}}
		>
			<div className="icon bg-white w-14 h-14 shadow-[0px_4px_4px_rgba(0,0,0,0.05)] rounded-full flex items-center justify-center">
				<AvatarIcon />
			</div>
			<div
				style={{
					borderRadius: comment.sender === whoAmi ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
					backgroundColor: comment.sender === whoAmi ? '#F3FFFA' : '#FAF9F9',
					opacity: comment.sender === whoAmi && comment.messageStatus === 'client' ? 0.5 : 1,
				}}
				className="relative message-content p-4 bg-[#FAF9F9] border border-[#eee]  w-fit"
			>
				{comment.sender === whoAmi && comment.messageStatus === 'client' && (
					<div
						style={{
							[langType === 'ar' ? 'left' : 'right']: '0px',
						}}
						className=" absolute w-2 h-2 rounded-full border -bottom-3 text-[#1ebba3]"
					></div>
				)}
				{comment.sender === whoAmi && comment.messageStatus === 'sent' && (
					<div
						style={{
							[langType === 'ar' ? 'left' : 'right']: '5px',
						}}
						className=" absolute w-2 h-2 bottom-3 text-[#1ebba3]"
					>
						&#x2713;
					</div>
				)}
				<h1 dangerouslySetInnerHTML={{ __html: comment.message }} className="text-sm" />
			</div>
		</div>
	);
}

export default Comment