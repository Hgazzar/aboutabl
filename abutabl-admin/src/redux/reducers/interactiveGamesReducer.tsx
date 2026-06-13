import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type InteractiveLiveEvent = {
  actor_id: number;
  actor_type: string;
  name: string;
  status: boolean | number | string;
  interactive_game_id: number;
};

type State = {
  liveEvents: InteractiveLiveEvent[];
};

const initialState: State = {
  liveEvents: [],
};

const interactiveGamesSlice = createSlice({
  name: "interactiveGames",
  initialState,
  reducers: {
    pushLiveEvent(state, action: PayloadAction<InteractiveLiveEvent>) {
      state.liveEvents.push(action.payload);
    },
    clearLiveEvents(state) {
      state.liveEvents = [];
    },
  },
});

export const { pushLiveEvent, clearLiveEvents } = interactiveGamesSlice.actions;
export default interactiveGamesSlice.reducer;
