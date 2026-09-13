import { useState } from 'react';
import { Button, Checkbox, Flex } from '@mantine/core';
import { useIntl } from 'react-intl';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import Input from 'components/input';
import InputPassword from 'components/inputPassword';
import { LoginFormGrid, LoginFormColumn, LoginIllustration, LoginWrapper } from '../styles';
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, persistStudentSession } from 'redux-toolkit/reducer/LoginReducer';
import { Ilogin } from '../types/login.type';
import LoadingPartially from 'components/loading-partially';
import { toast } from 'react-toastify';
import {
	attemptStaffOrSsoLogin,
	redirectStaffToAdminApp,
} from 'lib/staffLoginAttempt';

const BIRD_BOOK_ASSET = new URL('../../../assets/images/figma/auth/bird-book-2.png', import.meta.url).href;

function Login() {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const methods = useForm<Ilogin>({ defaultValues: { remember: false } });
	const { handleSubmit, control } = methods;
	const dispatch = useDispatch();

	const clearLocalSession = () => {
		Cookies.remove('token_');
		Cookies.remove('username');
		Cookies.remove('abotable_id');
		Cookies.remove('expiration');
		localStorage.removeItem('user_info');
	};

	const onSubmit: SubmitHandler<Ilogin> = async (data) => {
		if (loading) return;
		setLoading(true);
		clearLocalSession();

		let redirectingToAdmin = false;

		try {
			const studentResult = await dispatch(loginUser(data));
			const studentOutcome = studentResult?.payload as
				| { ok: boolean; reason?: string; message?: string }
				| undefined;

			if (studentOutcome?.ok && Cookies.get('token_')) {
				navigate(studentOutcome.needsAvatarSelection ? '/onboarding/avatar' : '/learn');
				return;
			}

			if (studentOutcome?.reason === 'inactive') {
				return;
			}

			const staff = await attemptStaffOrSsoLogin({
				identifier: String(data.code ?? ''),
				password: data.password,
				remember: data.remember,
			});

			if (staff.kind === 'student') {
				persistStudentSession(
					{
						...staff.user,
						api_token: staff.token,
						id: (staff.user.id as string | number) ?? '',
					},
					data.remember
				);
				toast.success('Login Successfully');
				const needsAvatar = staff.user.needs_avatar_selection === true;
				navigate(needsAvatar ? '/onboarding/avatar' : '/learn');
				return;
			}

			if (staff.kind === 'staff') {
				toast.success('Login Successfully');
				redirectingToAdmin = true;
				redirectStaffToAdminApp({
					token: staff.token,
					remember: data.remember,
					username: staff.username,
					userId: staff.userId,
					type: staff.type,
				});
				return;
			}

			toast.error(
				studentOutcome?.message ||
					staff.message ||
					'Login failed. Check your connection and try again.'
			);
		} catch (error: unknown) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String((error as { message?: string }).message)
					: 'Login failed. Check your connection and try again.';
			toast.error(message);
		} finally {
			if (!redirectingToAdmin) {
				setLoading(false);
			}
		}
	};

	return (
		<LoginFormGrid>
			<LoginFormColumn>
				<LoginWrapper>
					<FormProvider {...methods}>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Flex direction="column" gap={8} className="wellcome_wrapper">
								<h1>{formatMessage({ id: 'Welcome-back' })}</h1>
								<h3>{formatMessage({ id: 'Login-and-learn' })}</h3>
							</Flex>
							<Input
								className="login-field"
								name="code"
								label={formatMessage({ id: 'StudentCode' })}
								placeholder={formatMessage({ id: 'StudentCode' })}
								labelVisibility={false}
								registerOptions={{
									required: {
										value: true,
										message: 'requiredField',
									},
								}}
							/>
							<InputPassword
								className="login-field"
								name="password"
								label={formatMessage({ id: 'Password' })}
								placeholder={formatMessage({ id: 'Password' })}
								labelVisibility={false}
								registerOptions={{
									required: {
										value: true,
										message: 'requiredField',
									},
								}}
							/>

							<div className="remember-row">
								<Controller
									name="remember"
									control={control}
									render={({ field }) => (
										<Checkbox
											label={formatMessage({ id: 'Remember-me' })}
											checked={field.value ?? false}
											onChange={field.onChange}
											classNames={{
												root: 'remember-checkbox',
												input: 'remember-checkbox-input',
												label: 'remember-label',
											}}
										/>
									)}
								/>
								<Link to="/login/verifyEmail" className="forget-link">
									{formatMessage({ id: 'Forget-password' })}
								</Link>
							</div>
							<Button type="submit" className="login-submit" disabled={loading}>
								{loading ? <LoadingPartially /> : formatMessage({ id: 'Login' })}
							</Button>
						</form>
					</FormProvider>
				</LoginWrapper>
			</LoginFormColumn>
			<LoginIllustration>
				<img src={BIRD_BOOK_ASSET} alt="" width={363} height={372} />
			</LoginIllustration>
		</LoginFormGrid>
	);
}

export default Login;
