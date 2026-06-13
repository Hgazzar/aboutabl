import { Box, Button, Flex, Text } from '@mantine/core';

import Good from 'assets/images/png/good.png';
import Done from 'assets/images/svg/done.svg';
import InCorrect from 'assets/images/svg/incorrect.svg';

const CorrectAnswer = ({ handleNext, handleEmpty }: { handleNext: () => void, handleEmpty: () => void }) => {
    return (
        <Box className='mt-auto'>
            <img src={Good} className="w-[150px]" />
            <Flex className="bg-Lotion justify-between ">
                <Flex className=" p-5 gap-2">
                    <Box>
                        <img src={Done} className="h-[42px] w-[42px]" />
                    </Box>
                    <Box>
                        <Text className="font-bold text-LightSeaGreen">Great Job!</Text>
                        <Text className="text-gray text-sm">Well done, you are awesome </Text>
                    </Box>
                </Flex>
                <Button
                    type="submit"
                    className=" bg-LightSeaGreen rounded-[15px] shadow-custom-sm-green w-[100px] mt-5 mr-5 hover:bg-LightSeaGreen text-white"
                    onClick={() => { handleNext(); handleEmpty() }}
                >
                    Continue
                </Button>{' '}
            </Flex>
        </Box>
    )
}

export default CorrectAnswer