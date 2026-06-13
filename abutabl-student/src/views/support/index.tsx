import { ModuleViewWrapper } from 'components/module-view/styles';

import styled from 'styled-components';
import { theme } from 'global-styles';
import { CiSearch } from 'react-icons/ci';
import { langState } from 'store';
import { useRecoilValue } from 'recoil';

import { useDebouncedState } from '@mantine/hooks';
import { Input, Badge } from '@mantine/core';
import { BiSolidLeftArrow, BiSolidRightArrow } from 'react-icons/bi';
import { useEffect, useState } from 'react';
import Right from './Right';
import instance from 'axios-instance';
import { AxiosResponse } from 'axios';
import TicketSideBarIcon from './svgs/TicketSideBarIcon';
import FilterIcon from './svgs/FilterIcon';
import PageHeader from './components/pageHeader';
export const ModuleViewBodyWrapper = styled.div`
	width: 100%;
	// padding: 32px;
	overflow: hidden;
	background-color: ${theme.colours.white};
	border-radius: 20px;
	min-height: 100%;
`;

export interface IReply {
	id: number;
	message: string;
	messageStatus: 'seen' | 'delivered' | 'sent' | 'client';
	sender: any;
	reciever: 'admin' | 'student' | null;
}

interface IMeta {
	title: string;
	body: string;
	file: string;
	replies: IReply[];
}

export interface IDataList {
	id: number;
	title: string;
	shortDescription: string;
	status: 'Open' | 'Closed';
	lastReplayMessage: string;
	createdAt: string;
	meta: IMeta;
}

export interface GetTicketResponse {
	data: IDataList[];
}
export default function Support() {
	const langType = useRecoilValue(langState);
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useDebouncedState('', 300);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [data, setData] = useState<IDataList[]>([]);

	async function fetchTickets() {
		try {
			const res: AxiosResponse<IDataList[]> = await instance.get<IDataList[]>('/tickets');
			setData(res.data);
			// setSelectedId(res.data[0].id);
		} catch (error) {
			console.error('Error fetching list:', error);
		}
	}
	useEffect(() => {
		fetchTickets();
	}, []);

	return (
		<>
			<PageHeader />
			<ModuleViewWrapper>
				<ModuleViewBodyWrapper>
					<>
						{/* component */}
						<div className="flex min-h-full ">
							<div
								style={{
									[langType === 'en' ? 'left' : 'right']: isOpen ? '0px' : '-350px',
								}}
								className="transition-[left,right] ease-linear duration-500 absolute z-10 h-full w-[350px] bg-white lg:h-auto lg:static   border-[#F2F2F2] border"
							>
								<button
									onClick={() => setIsOpen((old) => !old)}
									style={{
										[langType === 'en' ? 'right' : 'left']: '-2rem',
									}}
									className="focus-visible:outline-none hover:bg-[#f3fffa] bg-white absolute top-1/2 -translate-y-1/2  flex items-center justify-center lg:invisible px-1 py-1 rounded-md border border-[#DEDDDD] cursor-pointer"
								>
									{isOpen ? <BiSolidLeftArrow /> : <BiSolidRightArrow />}
								</button>
								<header className="flex h-[80px] p-6 border-[#F2F2F2] border-b items-center relative">
									<h1 className="font-medium text-lg text-[#1F1E1E]">All Tickets</h1>
								</header>
								<div className="ticket-wraper ">
									<div className="search p-6">
										<div className="search flex gap-2">
											<Input
												className="w-full"
												icon={<CiSearch />}
												variant="filled"
												placeholder="Search"
												defaultValue={value}
												onChange={(event) => setValue(event.currentTarget.value)}
											/>
											<div className="filter w-10 h-10">
												<button className="px-2 py-2 rounded-md border border-[#DEDDDD] cursor-pointer">
													<FilterIcon />
												</button>
											</div>
										</div>
									</div>
									<div className="tickets">
										{data.length > 0 ? (
											data.map((item) => (
												<button
													onClick={() => {
														setSelectedId(item.id);
													}}
													key={item.id}
													className={`transition duration-300 w-full focus:outline-none ticket grid grid-cols-[3.5rem_1fr] gap-4 p-6 overflow-hidden text-ellipsis border-b border-[#eee] ${item.id === selectedId ? 'bg-[#F3FFFA]' : ''
														}`}
												>
													<div
														className={`icon w-14 h-14 rounded-full shadow flex justify-center items-center transition duration-300 ${item.status === 'Closed' ? 'bg-[#FAF9F9]' : 'bg-white'
															}`}
													>
														<TicketSideBarIcon />
													</div>
													<div className="ticket-data w-full">
														<header className="flex justify-between">
															<h1 className="font-medium text-sm text-[#1F1E1E]">{item.title}</h1>
															<span className="time text-[#9C9B9B] text-xs">{item.lastReplayMessage}</span>
														</header>
														<p className="overflow-hidden text-ellipsis max-w-[229px] whitespace-nowrap font-normal text-sm text-[#9C9B9B]">
															{item.shortDescription}
														</p>
														<div className="tag">
															<Badge color={item.status === 'Open' ? 'grape' : 'red'} radius="sm">
																{item.status}
															</Badge>
														</div>
													</div>
												</button>
											))
										) : (
											<></>
										)}
									</div>
								</div>
							</div>

							<Right selectedId={selectedId} />
						</div>
					</>
				</ModuleViewBodyWrapper>
			</ModuleViewWrapper>
		</>
	);
}
