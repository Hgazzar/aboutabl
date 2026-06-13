import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest } from 'lib/requests';



export const quizDetails: any = createAsyncThunk('quizDetails', async (id: number) => {
    const result = await getRequest(`quizes/show/${id}`);
    return result;
});
const initialState: any = {
    loading: true,

    gamesDetailstData: {}

};

const quizDetailsSlice: any = createSlice({
    name: 'quizDetailsSlice',
    initialState,
    reducers: {},

    extraReducers(builder) {

        builder.addCase(quizDetails.fulfilled, (state, action) => {
            state.loading = false;
            state.gamesDetailstData = action.payload
        });
    },
});

export const { } = quizDetailsSlice.actions;
export default quizDetailsSlice.reducer;
