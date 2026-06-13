import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postRequest } from 'lib/requests';
import { toast } from 'react-toastify';
import { Ilogin } from 'views/auth/types/login.type';
import Cookies from 'js-cookie';

function clearStudentSession() {
    Cookies.remove('token_');
    Cookies.remove('username');
    Cookies.remove('abotable_id');
    Cookies.remove('expiration');
    try {
        localStorage.clear();
    } catch {
        /* ignore */
    }
}

export const logout: any = createAsyncThunk('auth/logout', async (loginData: Ilogin | Record<string, never>) => {
    try {
        const response = await postRequest('logout', loginData);
        return response;
    } catch (error: any) {
        const msg = error?.response?.data?.msg;
        if (msg) toast.error(msg);
        throw error;
    } finally {
        clearStudentSession();
    }
});
const initialState = {
    user: null,
};
const LoginReducer: any = createSlice({
    name: 'logoutReducer',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(logout.fulfilled, (state, action) => {
            state.user = action.payload;
        });
    },
});
export default LoginReducer.reducer;
