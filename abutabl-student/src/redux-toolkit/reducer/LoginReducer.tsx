import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginRequest } from 'lib/requests';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { Ilogin } from 'views/auth/types/login.type';

function decodeToken(token: string) {
	const payloadBase64 = token.split('.')[1];
	const decodedPayload = atob(payloadBase64);
	return JSON.parse(decodedPayload);
}

export const loginUser: any = createAsyncThunk('auth/login', async (loginData: Ilogin) => {
	try {
		const response = await loginRequest('login', loginData);

		if (response?.user?.verify == 0) {
			toast.error("Your account isn't activated, please active account");
			return;
		}

		if (response?.user?.verify == 1) {
			const apiToken = response.user.api_token;
			const cookieOptions = loginData.remember ? { expires: 7 } : {};

			Cookies.set('token_', apiToken, cookieOptions);
			Cookies.set('username', response.user.name ?? response.user.code ?? '', cookieOptions);
			Cookies.set('abotable_id', String(response.user.id), cookieOptions);
			Cookies.set(
				'expiration',
				String(decodeToken(apiToken).exp * 1000),
				cookieOptions
			);

			localStorage.setItem('user_info', JSON.stringify(response.user));

			toast.success('Login Successfully');
			return response.data;
		}
	} catch (error: any) {
		toast.error(error?.response?.data?.msg);
	}
});
const initialState = {
    user: null,
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
