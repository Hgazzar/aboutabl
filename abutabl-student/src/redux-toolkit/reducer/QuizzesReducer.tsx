import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest } from 'lib/requests';

export const quizesList: any = createAsyncThunk(
	'quizesList',
	async ({ id, type, type_id }: { id: string | number; type?: string; type_id?: string | number }) => {
		const params = new URLSearchParams();
		if (type != null && type_id != null && String(type_id) !== '') {
			params.set('type', String(type));
			params.set('type_id', String(type_id));
		}
		const qs = params.toString();
		const result = await getRequest(`quizesList/${id}${qs ? `?${qs}` : ''}`);
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
