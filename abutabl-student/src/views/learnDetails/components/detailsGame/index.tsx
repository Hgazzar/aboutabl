/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import 'react-accessible-accordion/dist/fancy-example.css';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Flex, Text } from '@mantine/core';
import Arrow from 'assets/images/svg/arrow.svg';
import Arrow2 from 'assets/images/svg/arrow2.svg';
import { useNavigate } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import './index.css';
import { studentBrandLogoUrl } from 'config/figmaAssets';
import { useParams } from 'react-router-dom';
import { gameDetails, gamesList } from 'redux-toolkit/reducer/GamesReducer';
import { toStudentScormUrl } from 'utils/functions';

const DetailsGames = () => {
	const dispatch = useDispatch();
	const nagivate = useNavigate();
	const statusGames = useSelector((state: any) => state.GamesReducer);

	const { id, idGame } = useParams();
	const [item, setItem] = useState<any>();
	const [contentArr, setContentArr] = useState<any>();
	const [activeId, setActiveId] = useState<any>();
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(true);

	// Enrollment-based: load games by subject id (no assignment required).
	useEffect(() => {
		if (!id || !idGame) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				await dispatch(gameDetails(idGame));
				await dispatch(gamesList({ id }));
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, idGame, dispatch]);

	useEffect(() => {
		setItem(statusGames?.gamesDetailstData?.game);
		setActiveId(statusGames?.gamesDetailstData?.game?.id);
	}, [statusGames?.gamesDetailstData]);

	useEffect(() => {
		setContentArr(statusGames?.gamesListData?.games);
	}, [statusGames?.gamesListData?.games]);

	return (
		<>
			<Box className="flex items-center mx-5 w-100 mt-3 mb-3">
				<Box
					className="cursor-pointer mx-5"
					onClick={() => {
						nagivate('/learn');
					}}
				>
					<img src={studentBrandLogoUrl()} alt="ABOUTABL" width={120} height={25} style={{ height: 28, width: 'auto' }} />
				</Box>
				<Text className={`${show ? 'ms-5' : 'ms-48'} text-LightSeaGreen text-l font-semibold`}>{item?.name}</Text>
				<Flex className="justify-between ml-auto">
						<button
							type="button"
							className={`hover:font-semibold hover:text-base transition-all mx-5 ${
								contentArr?.findIndex((g: any) => g.id == activeId) == 0 || activeId == ''
									? 'text-gray'
									: 'text-LightSeaGreen'
							}`}
							disabled={
								contentArr?.findIndex((g: any) => g.id == activeId) == 0 || activeId == ''
							}
							onClick={async () => {
								const index = contentArr?.findIndex((g: any) => g.id == activeId);
								if (typeof index === 'number' && index != -1) {
									setActiveId(contentArr[index - 1]?.id);
									setItem(contentArr[index - 1]);
									setLoading(true);
									await dispatch(gameDetails(contentArr[index - 1].id));
									setLoading(false);
								}
							}}
						>
							<div className="mx-2 flex justify-center">
								<div>Previous</div>
							</div>
						</button>
						<button
							type="button"
							onClick={async () => {
								const index = contentArr?.findIndex((g: any) => g.id == activeId);
								if (typeof index === 'number' && index != -1) {
									setActiveId(contentArr[index + 1]?.id);
									setItem(contentArr[index + 1]);
									setLoading(true);
									await dispatch(gameDetails(contentArr[index + 1].id));
									setLoading(false);
								}
							}}
							className={`hover:font-semibold hover:text-base transition-all ${
								contentArr?.findIndex((g: any) => g.id == activeId) ==
									contentArr?.length - 1 || activeId == ''
									? 'text-gray'
									: 'text-LightSeaGreen'
							} `}
							disabled={
								contentArr?.findIndex((g: any) => g.id == activeId) ==
									contentArr?.length - 1 || activeId == ''
							}
						>
							Next
							<span className="mx-2">{/* <KeyboardBackspaceIcon className="rotate-180" /> */}</span>
						</button>
					</Flex>
			</Box>

			{statusGames?.gamesDetailstData?.status === false ? (
				<Box className="mt-48 flex justify-center">
					<Text className="text-stone-500">Unable to load this game.</Text>
				</Box>
			) : (
			<Flex>
				<Box className={`${show && 'hidden'} transition-all`}>
					<Box className="accordionLessonContainer">
						{statusGames?.gamesListData?.games?.map((game: { name: string; id: number; index: number }) => {
							return (
								<Box
									className={`cursor-pointer subLesson ${activeId == game?.id && 'activeLesson'}`}
									onClick={async () => {
										setActiveId(game.id);
										setLoading(true);
										setItem(game);
										await dispatch(gameDetails(game.id));

										setLoading(false);
									}}
								>
									<Box className="accordionGames" key={id}>
										{game.name}
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>
				<Box
					className={`${show ? 'absoluteIconAfter' : 'absoluteIcon'} cursor-pointer`}
					onClick={() => {
						setShow(!show);
					}}
				>
					<Box>{show ? <img src={Arrow} alt="" /> : <img src={Arrow2} alt="" />}</Box>
				</Box>
				{loading ? (
					<LoadingPartially />
				) : !item?.path ? (
					<Box className="content w-full flex justify-center items-center">
						<Text className="text-stone-500">{contentArr?.length ? 'Select a game from the list' : 'No game available'}</Text>
					</Box>
				) : (
					<Box className="content w-full">
						{item?.type == 'image' ? (
							<div className="imageIframe">
								<img src={toStudentScormUrl(item?.path)} />
							</div>
						) : item?.type == 'word' ? (
							<iframe
								title="Word and excel Viewer"
								className="w-full h-full"
								height={'100%'}
								width={'100%'}
								src={'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(toStudentScormUrl(item?.path))}
							></iframe>
						) : (
							<iframe src={toStudentScormUrl(item?.path)} allowFullScreen style={{ width: '100%', height: '90vh' }} scrolling="no" />
						)}
					</Box>
				)}
			</Flex>
			)}
		</>
	);
};

export default DetailsGames;
