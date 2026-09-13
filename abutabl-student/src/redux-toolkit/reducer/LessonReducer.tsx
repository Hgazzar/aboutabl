import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest } from 'lib/requests';

export const lessonContent: any = createAsyncThunk(
	'lessonContent',
	async ({ id, type, type_id }: { id: number; type?: string; type_id?: string | number }) => {
		const params = new URLSearchParams();
		if (type != null && type_id != null && String(type_id) !== '') {
			params.set('type', String(type));
			params.set('type_id', String(type_id));
		}
		const qs = params.toString();
		const result = await getRequest(`/lessons/show/${id}${qs ? `?${qs}` : ''}`);
		return result;
	}
);

const initialState: any = {
	loading: true,
	lessonContentData: [],
	lessonId: null,
};

const lessonContentSlice: any = createSlice({
	name: 'lessonContentSlice',
	initialState,
	reducers: {
		setLessonIds: (state = initialState, action) => {
			state.lessonId = action.payload;
		},
	},

	extraReducers(builder) {
		builder.addCase(lessonContent.fulfilled, (state, action) => {
			state.loading = false;
			state.lessonContentData = action.payload;
		});
	},
});

export const { setLessonIds } = lessonContentSlice.actions;
export default lessonContentSlice.reducer;
