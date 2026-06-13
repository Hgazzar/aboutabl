import { Box, Flex, Text } from '@mantine/core';
import React, { useEffect, useState } from 'react';

const Progress = ({ number, length }: { number: number; length: number }) => {
    const [num, setNum] = useState(0);

    // 1 2 3 4
    useEffect(() => {
        if (number > 0) {
            setNum((prevP: number) => prevP + 100 / length);
        }
    }, [number, length]);

    return (
        <>
            <Flex className="align-center justify-between">
                <Text className="pb-2 text-gray text-sm">Your progress</Text>
                <Text className="pb-2 text-black text-sm">Completed {num}%</Text>
            </Flex>

            <Box className="bg-gray rounded-xl black ">
                <Box className="bg-gray rounded-xl ">
                    <div className={`h-[15px] bg-Warning rounded-xl `} style={{ width: `${num}%` }}>
                        {/* <div className="h-[4px] bg-Sunglow w-[98%] rounded-2xl absolute bottom-1 mx-1 "></div> */}
                    </div>
                </Box>
            </Box>
        </>
    );
};

export default Progress;
