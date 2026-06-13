import React, { useEffect, useRef, useState } from 'react';
import { IDataList, IReply } from '..';
import { langState } from 'store';
import { useRecoilValue } from 'recoil';
import { Divider, Loader } from '@mantine/core';
import ScrollerRenderView from 'components/ScrollerRenderView';
import { AxiosResponse } from 'axios';
import instance from 'axios-instance';
import Head from './Header/head';
import Footer, { whoAmi } from './Footer';

import Comment from './Content/Comment';
import Ticket from './Content/Ticket';
// var toolbarOptions = ['bold', 'italic', 'underline', 'strike'];
import ContactUs from 'assets/images/chat/contact-vector.avif'
interface IRight {
	selectedId: null | number;
}
function Right({ selectedId }: IRight) {
	const langType = useRecoilValue(langState);

	const [showData, setShowData] = useState<IDataList | null>(null);
	const [comments, setComments] = useState<IReply[] | []>([]);
	const [loading, setLoading] = useState(false);
	const [scrollData, setScrollData] = useState<any>({});

	async function fetchTickets(id: number) {
		setLoading(true);
		try {
			const res: AxiosResponse<IDataList> = await instance.get<IDataList>(`/tickets/${id}`);

			setShowData(res.data);
			setComments(res.data.meta.replies);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching list:', error);
		}
	}

// 	useEffect(() => {
// let intervalCall: string | number | NodeJS.Timer | undefined;
// 		if (selectedId) {
// 		 intervalCall =setInterval(()=>{

// 				fetchTickets(selectedId);
// 			},1000)


// 		}
// 		return()=>{
// 			clearInterval(intervalCall);
// 		}
// 	}, [selectedId]);

	   useEffect(() => {
					if(selectedId)
						fetchTickets(selectedId);
			}, [selectedId]);
  

			useEffect(()=>{
				let interval:any;
				if(selectedId&&showData?.status==="Open"){
				 interval= window.setInterval(async()=>{
							try {
								const res: AxiosResponse<IDataList> = await instance.get<IDataList>(`/tickets/${selectedId}`);
								setComments(res.data.meta.replies);
							} catch (error) {
								console.error('Error fetching list:', error);
							}
					},2000)
				}
				return () => window.clearInterval(interval);
			},[selectedId , comments]);
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			(messagesEndRef.current as any).scrollToBottom();
			// (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
		}
	};
	useEffect(() => {
		const iSlastMessageOutShow =
			scrollData.scrollHeight - (scrollData.scrollTop + scrollData.clientHeight) > scrollData.lastMessageHeight;
		if (comments.at(-1)?.sender === whoAmi || (comments.at(-1)?.sender !== whoAmi && !iSlastMessageOutShow))
			scrollToBottom();
		else if (comments.at(-1)?.sender !== whoAmi && iSlastMessageOutShow) {
		}
	}, [comments]);

	return (
		<div className="right w-full lg:w-[calc(100%-350px)] h-full">
			<Head showData={showData} />

			<style>{`
					.scroll-wraper{
						height:calc(100dvh - 80px - ${showData?.status === 'Open' ? '140px' : '46px'} - 3rem - 166px) !important;
					}
		@media (  min-width: 768px) {
						.scroll-wraper{
						height:calc(100dvh - 80px - ${showData?.status === 'Open' ? '140px' : '46px'} - 3rem - 206px) !important;
					}
			
					@media (  min-width: 992px) {
						.scroll-wraper{
						height:calc(100dvh - 80px - ${showData?.status === 'Open' ? '140px' : '46px'} - 3rem - 130px) !important;
					}
					}
				`}</style>

			<ScrollerRenderView
				ref={messagesEndRef}
				className={`scroll-wraper`}
				onScroll={(value: any) => {
					const lastMessageHeight = [...value.srcElement.children[0].children[0].children[2].children].at(
						-1
					).clientHeight;
					const scrollData = {
						clientHeight: value.srcElement.clientHeight,
						scrollHeight: value.srcElement.scrollHeight,
						scrollTop: value.srcElement.scrollTop,
						lastMessageHeight,
					};

					setScrollData(scrollData);
				}}
				autoHide
				autoHideTimeout={1000}
				autoHideDuration={200}
			>
				{selectedId ? (
					<>
						{!loading ? (
							<section className="ticket-box-view py-6 px-8  overflow-y-auto">
								<section className="ticket-data h-full">
									<Ticket showData={showData} />

									<Divider my="xs" label={<div className="bg-[#eee] p-1 rounded text-xs">All Replies</div>} />
									<article className="ticket-replayes flex flex-col gap-6">
										{comments.length > 0 && (
											<>
												{comments.map((comment: IReply) => (
													<Comment key={comment.id} comment={comment} />
												))}
											</>
										)}
									</article>
								</section>
							</section>
						) : (
							<div className="h-full flex justify-center items-center">
								<Loader color="teal" variant="dots" />
							</div>
						)}
					</>
				) : (
					<div className="h-full flex justify-center items-center">
						<img className="filter hue-rotate-[295deg] opacity-50" width={626} height={455} src={ContactUs} />
					</div>
				)}
			</ScrollerRenderView>
			<Footer showData={showData} replies={comments} setReplies={setComments} />
		</div>
	);
}

export default Right;
