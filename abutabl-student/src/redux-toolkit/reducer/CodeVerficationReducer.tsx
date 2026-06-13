import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loginRequest } from 'lib/requests';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const CodeVerfication: any = createAsyncThunk('CodeVerfication', async (body: any) => {
    try {
        const response = await loginRequest(`verification_code`, body);
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
const CodeVerficationReducer: any = createSlice({
    name: 'CodeVerfication',
    initialState,
    reducers: {
        resetResponse(state: any = initialState) {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(CodeVerfication.fulfilled, (state, action) => {
            state.user = action.payload;
            // console.log(action);
        });
    },
});
export const { resetResponse } = CodeVerficationReducer.actions;
export default CodeVerficationReducer.reducer;
