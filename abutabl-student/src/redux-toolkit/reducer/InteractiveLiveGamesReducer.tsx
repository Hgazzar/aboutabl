import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type StudentLiveGameEvent = {
	actor_id: number;
	actor_type: string;
	name: string;
	status: boolean | number | string;
	interactive_game_id: number;
};

type State = {
	liveEvents: StudentLiveGameEvent[];
};

const initialState: State = {
	liveEvents: [],
};

const slice = createSlice({
	name: 'interactiveLiveGames',
	initialState,
	reducers: {
		pushStudentLiveEvent(state, action: PayloadAction<StudentLiveGameEvent>) {
			state.liveEvents.push(action.payload);
		},
		clearStudentLiveEvents(state) {
			state.liveEvents = [];
		},
	},
});

export const { pushStudentLiveEvent, clearStudentLiveEvents } = slice.actions;
export default slice.reducer;
