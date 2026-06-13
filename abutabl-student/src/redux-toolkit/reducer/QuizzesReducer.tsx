import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest } from 'lib/requests';

export const quizesList: any = createAsyncThunk(
	'quizesList',
	async ({ id, type, type_id }: { id: number; type: string; type_id: string }) => {
		const result = await getRequest(`quizesList/${id}?type=${type}&type_id=${type_id}`);
		return result;
	}
);

const initialState: any = {
	loading: true,
	quizesListData: [],
	gamesDetailstData: {},
};

const quizzesListSlice: any = createSlice({
	name: 'quizzesListSlice',
	initialState,
	reducers: {},

	extraReducers(builder) {
		builder.addCase(quizesList.fulfilled, (state, action) => {
			state.loading = false;
			state.quizesListData = action.payload;
		});
	},
});

export const {} = quizzesListSlice.actions;
export default quizzesListSlice.reducer;
