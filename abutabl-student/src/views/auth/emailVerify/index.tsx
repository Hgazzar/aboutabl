import React, { useState, useEffect } from 'react';
import { Button, Flex } from '@mantine/core';
import { useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import Input from 'components/input';
import { FORM_REGEX_VALIDATORS } from 'app-constants/form-validations';
import { LoginWrapper } from '../styles';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { EmailVerfication } from 'redux-toolkit/reducer/EmailVerficationReducer';

function VerifyEmail() {
    const { formatMessage } = useIntl();
    const methods = useForm();
    const { handleSubmit } = methods;
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const error = useSelector((state: any) => state.EmailVerficationReducer)


    const onSubmit = async (data: any) => {
        const result = await dispatch(EmailVerfication(data))
        result.payload != undefined && navigate('/login/verify')
    };

    return (
        <LoginWrapper>
            <div className={`w-full flex flex-col gap-6`}>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Flex direction={'column'} gap={8} className="wellcome_wrapper">
                            <h1>{formatMessage({ id: 'Verification Code' })}</h1>
                            <p className="text-Grey-body text-sm font-bold">
                                {formatMessage({ id: 'Please-verify' })}
                            </p>
                        </Flex>
                        <Input
                            name="code"
                            label="code"
                            placeholder="code"
                            registerOptions={{
                                required: {
                                    value: true,
                                    message: 'requiredField',
                                },
                                pattern: {
                                    value: FORM_REGEX_VALIDATORS.numbersOnly,
                                    message: formatMessage({ id: 'code' }),
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            className="bg-LightSeaGreen hover:bg-LightSeaGreen rounded-2xl shadow-custom-sm-green"
                            px={32}
                            py={16}
                            size="xl"
                        >
                            <span className="text-Lotion font-medium">{formatMessage({ id: 'Continue' })}</span>
                        </Button>

                    </form>
                </FormProvider>
            </div>
        </LoginWrapper>
    );
}

export default VerifyEmail;
