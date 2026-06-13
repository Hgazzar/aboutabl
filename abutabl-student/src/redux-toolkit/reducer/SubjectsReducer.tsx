/* eslint-disable no-empty-pattern */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest } from 'lib/requests';

export const SubjectsList: any = createAsyncThunk('SubjectsList', async (body: any) => {
	const result = await getRequest(`getSubjects`, body);
	return result;
});
// export const SubjectDetails: any = createAsyncThunk('SubjectDetails', async (id: string) => {
// 	const result = await getRequest(`viewSubject/${id}`);
// 	return result;
// });

export const SubjectDetails: any = createAsyncThunk(
	'SubjectDetails',
	async ({ id, type, type_id }: { id: string; type: string; type_id: string }) => {
		const result = await getRequest(`viewSubject/${id}?type=${type}&type_id=${type_id}`);
		return result;
	}
);

const initialState: any = {
	loading: true,
	subjectsListData: [],
	subjectDetailsData: {},
};

const SubjectsListSlice: any = createSlice({
	name: 'SubjectsListSlice',
	initialState,
	reducers: {},

	extraReducers(builder) {
		builder.addCase(SubjectsList.fulfilled, (state, action) => {
			state.loading = false;
			state.subjectsListData = action.payload;
		});
		builder.addCase(SubjectDetails.fulfilled, (state, action) => {
			state.loading = false;
			state.subjectDetailsData = action.payload;
		});
	},
});

export const {} = SubjectsListSlice.actions;
export default SubjectsListSlice.reducer;
