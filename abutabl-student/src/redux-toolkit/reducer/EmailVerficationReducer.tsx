import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loginRequest } from 'lib/requests';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const EmailVerfication: any = createAsyncThunk('EmailVerfication', async (body: any) => {
    try {
        const response = await loginRequest(`forgetPassword`, body);
        // console.log(response);


        return response;
    } catch (error: any) {

        toast.error(error?.response?.data?.msg);
    }
});
const initialState = {
    user: null,
};
const EmailVerficationReducer: any = createSlice({
    name: 'EmailVerfication',
    initialState,
    reducers: {
        resetResponse(state: any = initialState) {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(EmailVerfication.fulfilled, (state, action) => {
            state.user = action.payload;
            // console.log(action);
        });
    },
});
export const { resetResponse } = EmailVerficationReducer.actions;
export default EmailVerficationReducer.reducer;
