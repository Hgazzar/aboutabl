import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginRequest } from 'lib/requests';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { Ilogin } from 'views/auth/types/login.type';
import { withDefaultStudentAvatar } from 'lib/studentAvatar';

function decodeToken(token: string) {
	const payloadBase64 = token.split('.')[1];
	const decodedPayload = atob(payloadBase64);
	return JSON.parse(decodedPayload);
}

export function persistStudentSession(
	user: {
		api_token: string;
		id: string | number;
		name?: string;
		code?: string;
		verify?: number | string;
		[key: string]: unknown;
	},
	remember?: boolean
) {
	const apiToken = user.api_token;
	const cookieOptions = remember ? { expires: 7 } : {};

	Cookies.set('token_', apiToken, cookieOptions);
	Cookies.set('username', user.name ?? user.code ?? '', cookieOptions);
	Cookies.set('abotable_id', String(user.id), cookieOptions);
	Cookies.set('expiration', String(decodeToken(apiToken).exp * 1000), cookieOptions);
	localStorage.setItem('user_info', JSON.stringify(withDefaultStudentAvatar(user)));
}

export type StudentLoginOutcome =
	| { ok: true; needsAvatarSelection?: boolean }
	| { ok: false; reason: 'inactive' | 'failed'; message?: string };

/** Student login only. Callers may fall back to staff login without double-toasting failures. */
export const loginUser: any = createAsyncThunk(
	'auth/login',
	async (loginData: Ilogin): Promise<StudentLoginOutcome> => {
		try {
			const response = await loginRequest('login', loginData);

			if (response?.user?.verify == 0) {
				toast.error("Your account isn't activated, please active account");
				return { ok: false, reason: 'inactive' };
			}

			if (response?.user?.verify == 1 && response.user.api_token) {
				persistStudentSession(response.user, loginData.remember);
				toast.success('Login Successfully');
				return {
					ok: true,
					needsAvatarSelection: response.user.needs_avatar_selection === true,
				};
			}

			return {
				ok: false,
				reason: 'failed',
				message: response?.msg || 'Login failed',
			};
		} catch (error: any) {
			const msg =
				error?.response?.data?.msg ??
				error?.message ??
				'Login failed. Check your connection and try again.';
			return { ok: false, reason: 'failed', message: msg };
		}
	}
);

const initialState = {
	user: null as StudentLoginOutcome | null,
};

const LoginReducer: any = createSlice({
	name: 'LoginReducer',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loginUser.fulfilled, (state, action) => {
			state.user = action.payload;
		});
	},
});

export default LoginReducer.reducer;
