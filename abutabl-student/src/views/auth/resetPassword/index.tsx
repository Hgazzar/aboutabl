import React from 'react';
import { Button, Flex } from '@mantine/core';
import { useIntl } from 'react-intl';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import InputPassword from 'components/inputPassword';
import { LoginWrapper } from '../styles';
import { useDispatch } from 'react-redux';
import { ForgetPassword } from 'redux-toolkit/reducer/ForgetPasswordReducer';

function Reset() {
	const { formatMessage } = useIntl();
	const methods = useForm();
	const { handleSubmit } = methods;

	const dispatch = useDispatch()
	const newPassword = useWatch({
		control: methods.control,
		name: 'new_password',
	});

	methods.formState.isValid;

	const confirmValidation = (value: string) => value === newPassword || `${formatMessage({ id: 'PasswordMismatch' })}`;

	methods.register('confirm_new_password', {
		required: 'requiredField',
		validate: confirmValidation,
	});
	const onSubmit = (data: any) => {
		dispatch(ForgetPassword({ ...data, verification_code: localStorage.getItem('verfication-code') }))
	};
	return (
		<LoginWrapper>
			<div className={`w-full flex flex-col gap-6`}>
				<FormProvider {...methods}>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Flex direction={'column'} gap={8} className="wellcome_wrapper">
							<h1>{formatMessage({ id: 'Reset-password' })}</h1>
							<p>{formatMessage({ id: 'Enter-strong-password' })}</p>
						</Flex>

						<InputPassword
							name="new_password"
							label={formatMessage({ id: 'Password' })}
							placeholder={formatMessage({ id: 'Password' })}
							registerOptions={{
								required: {
									value: true,
									message: 'requiredField',
								},
							}}
						/>
						<InputPassword
							name="confirm_new_password"
							label={formatMessage({ id: 'ConfirmPassword' })}
							placeholder={formatMessage({ id: 'ConfirmPassword' })}
							registerOptions={{
								required: {
									value: true,
									message: 'requiredField',
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
							<span className="text-Lotion font-medium">{formatMessage({ id: 'Submit' })}</span>
						</Button>
					</form>
				</FormProvider>
			</div>
		</LoginWrapper>
	);
}

export default Reset;
