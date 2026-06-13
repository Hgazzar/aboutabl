import { createSlice } from "@reduxjs/toolkit";

export interface PagesState {
  page: string;
  subPage: string;
}

const initialState: PagesState = {
  page: "Dashboard",
  subPage: "",
};

const pagesSlice = createSlice({
  name: "pages",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setSubPage: (state, action) => {
      state.subPage = action.payload;
    },
  },
});

export const { setPage, setSubPage } = pagesSlice.actions;

export default pagesSlice.reducer;
