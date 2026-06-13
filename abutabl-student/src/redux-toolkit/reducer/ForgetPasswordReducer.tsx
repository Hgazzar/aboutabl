import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loginRequest } from 'lib/requests';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const ForgetPassword: any = createAsyncThunk('ForgetPassword', async (body: any) => {
    try {
        const response = await loginRequest(`setPassword`, body);
        // console.log(response);

        if (response.status == 'passwords.sent') {
            // notify(response.status, "success");
        }
        if (response.status == 'passwords.throttled') {
            // notify("Reference business is incorrect ", "error");
        }
        return response;
    } catch (error: any) {
        toast.error(error?.response?.data?.msg);
    }
});
const initialState = {
    user: null,
};
const ForgetPasswordReducer: any = createSlice({
    name: 'ForgetPassword',
    initialState,
    reducers: {
        resetResponse(state: any = initialState) {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(ForgetPassword.fulfilled, (state, action) => {
            state.user = action.payload;
            // console.log(action);
        });
    },
});
export const { resetResponse } = ForgetPasswordReducer.actions;
export default ForgetPasswordReducer.reducer;
