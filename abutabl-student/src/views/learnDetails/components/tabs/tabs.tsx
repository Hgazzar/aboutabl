import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Eye from '../../../../assets/images/svg/eye.svg?react';
import EyeInactive from '../../../../assets/images/svg/iconsGray.svg?react';
import Video from '../../../../assets/images/svg/video-play.svg?react';
import VideoInactive from '../../../../assets/images/svg/videoGray.svg?react';
import Game from '../../../../assets/images/svg/game.svg?react';
import GameInactive from '../../../../assets/images/svg/gameGray.svg?react';
import QuizInactive from '../../../../assets/images/svg/quizInactive.svg?react';
import QuizActive from '../../../../assets/images/svg/quisActive.svg?react';
import SheetTab from '../../../../assets/images/svg/sheets.svg?react';
import 'react-tabs/style/react-tabs.css';
import './index.css';
import Overview from './overview';
import LoadingPartially from 'components/loading-partially';
import { useSelector } from 'react-redux';

import Units from '../units';

import LearnDetailsGames from '../games';
import LearnDetailsQuiz from '../quizzes';
import LearnDetailsWorksheets from '../worksheets';

const TabsComponent = (loading: { loading: boolean }) => {
    const [searchParams] = useSearchParams();
    const openUnitsTab = Boolean(searchParams.get('focusLesson') || searchParams.get('focusUnit'));
    const [index, setIndex] = useState(() => (openUnitsTab ? 1 : 0));
    const subjectDetails = useSelector((state: any) => state.SubjectsReducer);

    const handleTabSelect = (index: any) => {
        setIndex(index);
    };
    // console.log(loading, "loading");


    return (
        <Tabs style={{ display: 'block' }} onSelect={handleTabSelect}>
            <TabList>
                <Tab>
                    {' '}
                    {index == 0 ? <Eye style={{ marginRight: '10px' }} /> : <EyeInactive style={{ marginRight: '10px' }} />}{' '}
                    <span>Overview</span>
                </Tab>
                <Tab>
                    {' '}
                    {index == 1 ? (
                        <Video style={{ marginRight: '10px' }} />
                    ) : (
                        <VideoInactive style={{ marginRight: '10px' }} />
                    )}{' '}
                    Units
                </Tab>
                <Tab>
                    {index == 2 ? <Game style={{ marginRight: '10px' }} /> : <GameInactive style={{ marginRight: '10px' }} />}{' '}
                    Games
                </Tab>
                <Tab>
                    {index == 3 ? <QuizActive style={{ marginRight: '10px', height: "20px", marginTop: "4px" }} /> : <QuizInactive style={{ marginRight: '10px', height: "20px", marginTop: "4px" }} />}{' '}
                    Quizzes
                </Tab>
                <Tab>
                    <SheetTab
                        style={{
                            marginRight: '10px',
                            width: 22,
                            height: 22,
                            opacity: index == 4 ? 1 : 0.45,
						}}
                    />{' '}
                    Worksheets
                </Tab>
            </TabList>
            {loading.loading ? (
                <TabPanel>
                    <LoadingPartially />
                </TabPanel>
            ) : (
                <>
                    <TabPanel>
                        <Overview />
                    </TabPanel>
                    <TabPanel>
                        <Units />
                    </TabPanel>
                    <TabPanel>
                        <LearnDetailsGames />
                    </TabPanel>
                    <TabPanel>
                        <LearnDetailsQuiz />
                    </TabPanel>
                    <TabPanel>
                        <LearnDetailsWorksheets />
                    </TabPanel>
                </>
            )}
        </Tabs>
    );
};

export default TabsComponent;
