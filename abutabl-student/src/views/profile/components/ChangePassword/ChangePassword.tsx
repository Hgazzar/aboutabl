import { useState } from 'react';
import Modal from 'components/modal';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Button, Divider, Flex, Grid } from '@mantine/core';
import PasswordIcon from 'assets/images/svg/lock.svg?react';
import InputPassword from 'components/inputPassword';
import { postRequest } from 'lib/requests';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { toast } from 'react-toastify';
import { EditContainer } from './../styles';

type ChangePasswordProps = {
	passwordModalOpened: boolean;
	setPasswordModalOpened: React.Dispatch<React.SetStateAction<boolean>>;
};

function ChangePassword({ passwordModalOpened, setPasswordModalOpened }: ChangePasswordProps) {
	const { formatMessage } = useIntl();
	const [submitting, setSubmitting] = useState(false);
	const methods = useForm();
	const { handleSubmit } = methods;

	const newPassword = useWatch({
		control: methods.control,
		name: 'NewPassword',
	});

	const confirmValidation = (value: string) =>
		value === newPassword || `${formatMessage({ id: 'PasswordMismatch' })}`;

	methods.register('ConfirmPassword', {
		required: 'requiredField',
		validate: confirmValidation,
	});

	const onSubmit = async (data: {
		CurrentPassword?: string;
		NewPassword?: string;
		ConfirmPassword?: string;
	}) => {
		setSubmitting(true);
		try {
			const res = await postRequest('changePassword', {
				password: data.CurrentPassword,
				new_password: data.NewPassword,
				confirm_new_password: data.ConfirmPassword,
			});
			if (res?.status === false) {
				throw new Error(typeof res.msg === 'string' ? res.msg : formatMessage({ id: 'profile-password-error' }));
			}
			toast.success(formatMessage({ id: 'profile-password-success' }));
			setPasswordModalOpened(false);
			methods.reset();
		} catch (err) {
			toast.error(getApiErrorMessage(err, formatMessage({ id: 'profile-password-error' })));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<Modal
				radius="8px"
				opened={passwordModalOpened}
				onClose={() => setPasswordModalOpened(false)}
				title="ChangePassword"
				size="xl"
				padding={32}
			>
				<EditContainer>
					<FormProvider {...methods}>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Grid gutter={32}>
								<Grid.Col m={0} py={0} xs={12}>
									<h4>1. {formatMessage({ id: 'PersonalInfo' })}</h4>
								</Grid.Col>
								<Grid.Col xs={12}>
									<InputPassword
										icon={<PasswordIcon />}
										name="CurrentPassword"
										label={formatMessage({ id: 'CurrentPassword' })}
										placeholder={formatMessage({ id: 'CurrentPassword' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
										}}
									/>
								</Grid.Col>
								<Grid.Col xs={12}>
									<InputPassword
										icon={<PasswordIcon />}
										name="NewPassword"
										label={formatMessage({ id: 'NewPassword' })}
										placeholder={formatMessage({ id: 'NewPassword' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
										}}
									/>
								</Grid.Col>
								<Grid.Col xs={12}>
									<InputPassword
										icon={<PasswordIcon />}
										name="ConfirmPassword"
										label={formatMessage({ id: 'ConfirmPassword' })}
										placeholder={formatMessage({ id: 'ConfirmPassword' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
										}}
									/>
								</Grid.Col>
							</Grid>
							<Divider mt={32} size="xs" />
							<Flex
								className="action_container"
								direction={{ base: 'column', sm: 'row' }}
								gap={22}
								justify={'space-between'}
								align={'center'}
							>
								<Button type="submit" disabled={submitting}>
									{formatMessage({ id: 'SaveChanges' })}
								</Button>
								<Button type="button" onClick={() => setPasswordModalOpened(false)}>
									{formatMessage({ id: 'Discard' })}
								</Button>
							</Flex>
						</form>
					</FormProvider>
				</EditContainer>
			</Modal>
		</div>
	);
}

export default ChangePassword;
