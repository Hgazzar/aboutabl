import React from 'react'
import shapes from 'assets/images/png/shapes.png';
import iol from 'assets/images/svg/Group_quiz.svg';
import quizes from 'assets/images/svg/Background_Complete.svg';
import { Box, Button, Flex, Text } from '@mantine/core';
import { useSelector } from 'react-redux';
import Star from '../../../../../assets/images/svg/star.svg'
import { useNavigate, useParams } from 'react-router-dom';

const Result = () => {
    const detailsQuiz = useSelector((state: any) => state.QuizReducer);
    const { score } = useParams();
    const navigate = useNavigate();


    return (
        <>
            <div className="bg-PaoloVeroneseGreen transition-all flex flex-col justify-start items-center relative h-[100vh]">
                <img src={shapes} alt="shapes" />
                <img src={iol} alt="logo" width={250} className=" md:block md:absolute bottom-0 right-0" />

                <div className="w-full h-[85vh] md:p-0 flex justify-center relative">
                    <img src={quizes} className="absolute  h-[600px]" alt="" />

                    <Box className='flex flex-col justify-center text-center'>


                        <div className="border border-Platinum bg-white w-full  md:p-10 flex flex-col justify-start items-center gap-6  rounded-[25px] shadow-custom-sm mx-2 ">

                            <Text className='font-bold px-20  text=3xl'>The Score </Text>
                            <Text className='font-bold  text-2xl text-LightSeaGreen flex'> <img src={Star} className='pr-2' />{score} points  </Text>
                            <Text className='text-gray'>Out of {detailsQuiz?.gamesDetailstData?.quize?.score_to_pass} points</Text>
                            <Button
                                type="submit"
                                className=" bg-Sunglow  rounded-[15px] shadow-custom-sm-warning self-end m-auto hover:bg-Warning text-white"
                                onClick={() => {
                                    navigate('/learn')

                                }}
                            >
                                Back to Home
                            </Button>{' '}
                        </div>
                    </Box>
                </div>
            </div></>
    )
}

export default Result