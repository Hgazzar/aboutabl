import shapes from 'assets/images/png/shapes.png';
import iol from 'assets/images/svg/Group_quiz.svg';
import quizes from 'assets/images/svg/Background_Complete.svg';
import Quiz from 'assets/images/svg/quiz.svg';
import Star from 'assets/images/svg/star.svg';
import Code from 'assets/images/svg/code.svg';
import Time from 'assets/images/svg/time.svg';
import Date from 'assets/images/svg/date.svg';
import man from 'assets/images/svg/background_quiz.svg';
import { Box, Button, Flex, Text } from '@mantine/core';
import PageHeader from '../../pageHeader';
import { ReactElement, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { quizDetails } from 'redux-toolkit/reducer/QuizReducer';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
export default function QuizDetails() {
    const { idQuiz } = useParams();
    const dispatch = useDispatch();
    const nagivate = useNavigate();
    const detailsQuiz = useSelector((state: any) => state.QuizReducer);
    useEffect(() => {
        dispatch(quizDetails(idQuiz));
    }, [dispatch]);


    const contant = [
        // { image: Video, label: '65 hours on demand videos' },
        // { image: Download, label: '49 downloadable resources' },
        {
            image: Quiz,
            title: detailsQuiz?.gamesDetailstData?.quize?.title_en,
            label: <> Title</>

        },
        {
            image: Star,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.score_to_pass} Points`,
            label: <> for each question</>

        },
        {
            image: Date,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.start_date}`,
            label: <> Start Date</>

        },
        {
            image: Date,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.due_date}`,
            label: <> End Date</>

        },
        {
            image: Time,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.time_limit}`,
            label: <> Time Limit</>

        },
        {
            image: Time,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.type_time}`,
            label: <>Type Time </>

        },
        {
            image: Code,
            title: `${detailsQuiz?.gamesDetailstData?.quize?.code}`,
            label: <>Code</>

        },
    ];

    return (
        // {detailsQuiz?.gamesDetailstData?.quize?.title}
        <>
            <PageHeader title='' route="/learn" />
            <div className="bg-PaoloVeroneseGreen transition-all flex flex-col justify-start items-center relative w-full h-[680px] ">
                <img src={shapes} className="h-[0px] " alt="shapes" />
                <img src={iol} alt="logo" width={250} className=" md:block md:absolute bottom-0 right-0" />

                <div className="w-full h-[85vh] md:p-0 flex justify-center relative">
                    <img src={quizes} alt="" className="absolute w-[100px] h-[100px]" />

                    <Box>
                        <img src={man} alt="" className="m-auto w-[100px] h-[100px]" />

                        <div className="border border-Platinum bg-white  p-5 md:p-10 flex flex-col justify-start items-center gap-6  rounded-[25px] shadow-custom-sm mx-2 ">
                            {!detailsQuiz?.loading ? <>

                                <Text className="font-bold text-lg text-DavysGrey">Interesting quiz awaits you</Text>
                                <Text className="text-gray">Play quizzes and get points to reach the next level</Text>
                                <Flex className="gap-5 m-5 flex-wrap" >
                                    {contant?.map((item: { [key: string]: string | JSX.Element }) => {
                                        return (

                                            <Box className="border border-Platinum rounded-[15px]  flex flex-col justify-start items-center mw-[100px] h-[130px] m-auto p-5 w-[130px]">
                                                <img src={`${item.image}`} />
                                                <Text className="font-medium text-l">{item.title}</Text>
                                                <Text className="text-gray text-xs">{item.label}</Text>
                                            </Box>

                                        )
                                    })}
                                </Flex>
                                <Button
                                    type="submit"
                                    className="bg-Sunglow hover:bg-Sunglow rounded-[15px] shadow-custom-sm-warning w-[100%]"
                                    onClick={() => {
                                        nagivate(`/learn/quiz/${idQuiz}`)
                                    }}
                                >
                                    Start quiz
                                </Button>
                                <Button
                                    type="submit"
                                    className="text-EerieBlack border-Platinum hover:bg-white rounded-[15px] shadow-custom-sm w-[100%]"
                                    onClick={() => {
                                        nagivate(`/learn`)
                                    }}
                                >
                                    Skip
                                </Button></> : <><LoadingPartially /></>}

                        </div>
                    </Box>
                </div>
            </div >
        </>
    );
}
