import { Box, Button, Flex, Text } from '@mantine/core';
import Good from 'assets/images/png/good.png';
import Done from 'assets/images/svg/done.svg';
import InCorrect from 'assets/images/svg/incorrect.svg';
const InCorrectAnswer = ({ handleNext, handleEmpty }: { handleNext: () => void, handleEmpty: () => void }) => {
    return (
        <>
            <Flex className="bg-error justify-between mt-auto ">
                <Flex className=" p-5 gap-2">
                    <Box>
                        <img src={InCorrect} className="h-[42px] w-[42px]" />
                    </Box>
                    <Box className="mt-2">
                        <Text className="font-bold text-Danger">Not Correct</Text>
                        {/* <Text className='text-gray text-sm'>Well done, you are awesome </Text> */}
                    </Box>
                </Flex>
                <Button
                    type="submit"
                    className=" bg-Danger rounded-[15px] shadow-custom-sm-red w-[100px] mt-5 mr-5 hover:bg-Danger text-white"
                    onClick={() => { handleNext(); handleEmpty() }}

                >
                    Continue
                </Button>{' '}
            </Flex>
        </>
    )
}

export default InCorrectAnswer