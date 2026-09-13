import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postRequest } from 'lib/requests';
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

export const logout: any = createAsyncThunk('auth/logout', async (_loginData: Ilogin | Record<string, never>) => {
    try {
        if (Cookies.get('token_')) {
            await postRequest('logout', {});
        }
    } catch {
        // Local session is always cleared; server logout is best-effort.
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
