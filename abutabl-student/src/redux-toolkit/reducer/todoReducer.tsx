import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRequest, postRequest } from 'lib/requests';

export const todoList: any = createAsyncThunk('todoList', async (body: any) => {
    const result = await getRequest(`todaoList`, body);
    return result;
});

/** Marks assign as opened for this student, then refreshes the todo list. */
export const markTodoAssignOpened: any = createAsyncThunk(
    'todo/markOpened',
    async (assignId: number, { dispatch }) => {
        await postRequest('todo/markOpened', { assign_id: assignId });
        await dispatch(todoList());
        return assignId;
    }
);


const initialState: any = {
    loading: true,
    todoListData: [],

};

const TodoistSlice: any = createSlice({
    name: 'TodoistSlice',
    initialState,
    reducers: {},

    extraReducers(builder) {
        builder.addCase(todoList.fulfilled, (state, action) => {
            state.loading = false;
            state.todoListData = action.payload
        });

    },
});

export const { } = TodoistSlice.actions;
export default TodoistSlice.reducer;
