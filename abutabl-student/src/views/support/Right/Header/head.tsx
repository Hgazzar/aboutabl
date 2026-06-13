import React from 'react'
import { IDataList } from '../..';

function Head({ showData }: { showData: IDataList |null}) {
	return (
		<header className="flex flex-col justify-center h-[80px] py-[16px] px-[32px] border-[#eee] border-b bg-[#FCFCFC]">
			{showData ? (
				<h1 className="font-medium text-lg text-[#1F1E1E]">{showData.title}</h1>
			) : (
				<h1 className="font-medium text-lg text-[#aaa]">Contact us</h1>
			)}
			{showData ? <p className="font-normal text-xs text-[#9C9B9B]">{showData.createdAt}</p> : ''}
		</header>
	);
}

export default Head