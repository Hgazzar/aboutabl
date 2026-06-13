import React, { useState, useEffect } from 'react';
import { Button, Flex } from '@mantine/core';
import { useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import Input from 'components/input';
import { FORM_REGEX_VALIDATORS } from 'app-constants/form-validations';
import { LoginWrapper } from '../styles';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CodeVerfication } from 'redux-toolkit/reducer/CodeVerficationReducer';

function Verify() {
	const { formatMessage } = useIntl();
	const methods = useForm();
	const { handleSubmit } = methods;
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [remainingTime, setRemainingTime] = useState(60); // Initial remaining time in seconds
	const [isResendDisabled, setIsResendDisabled] = useState(true);

	useEffect(() => {
		const timer = setInterval(() => {
			if (remainingTime > 0) {
				setRemainingTime((prevTime) => prevTime - 1);
			} else {
				setIsResendDisabled(false); // Enable the "Resend code" button
				clearInterval(timer);
			}
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, [remainingTime]);

	const handleResendClick = () => {
		setIsResendDisabled(true);
		setRemainingTime(60); // Reset the timer to 60 seconds
	};

	const onSubmit = async (data: any) => {
		const result = await dispatch(CodeVerfication(data));
		// console.log(result, "kkkkkkkkkk");

		if (result.payload != undefined) {
			localStorage.setItem('verfication-code', data);
			navigate(`/reset-password`);
		}
	};

	return (
		<LoginWrapper>
			<div className={`w-full flex flex-col gap-6`}>
				<FormProvider {...methods}>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Flex direction={'column'} gap={8} className="wellcome_wrapper">
							<h1>{formatMessage({ id: 'Verification' })}</h1>
							<p className="text-Grey-body text-sm font-bold">
								{formatMessage({ id: 'Please-verify' })} ahmed@gmail.com{' '}
							</p>
						</Flex>
						<Input
							name="verification_code"
							label="OTP"
							placeholder="OTP"
							registerOptions={{
								required: {
									value: true,
									message: 'requiredField',
								},
								pattern: {
									value: FORM_REGEX_VALIDATORS.otpNumber,
									message: formatMessage({ id: 'verification_code' }),
								},
							}}
						/>
						<p className="text-Morning-Blue text-sm font-normal">
							{formatMessage({ id: 'Time-remaining' })}{' '}
							<span className="font-medium text-EerieBlack px-2">
								00:{remainingTime < 10 ? `0${remainingTime}` : remainingTime}
							</span>{' '}
						</p>
						<Button
							type="submit"
							className="bg-LightSeaGreen hover:bg-LightSeaGreen rounded-2xl shadow-custom-sm-green"
							px={32}
							py={16}
							size="xl"
						>
							<span className="text-Lotion font-medium">{formatMessage({ id: 'Continue' })}</span>
						</Button>
						<p className="text-Morning-Blue text-sm font-normal">
							{formatMessage({ id: 'Didnt-get-code' })}{' '}
							<button
								disabled={isResendDisabled}
								className={`font-medium ${isResendDisabled ? 'text-LightSeaGreenDisabled' : 'text-LightSeaGreen'} px-2`}
								onClick={handleResendClick}
							>
								{formatMessage({ id: 'Resend-code' })}
							</button>{' '}
						</p>
					</form>
				</FormProvider>
			</div>
		</LoginWrapper>
	);
}

export default Verify;
