import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRequest, postRequest } from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

export const getProfile: any = createAsyncThunk(
  "profile/getProfile",
  async () => {
    try {
      const result = await getRequest({}, "/api/profile");
      if (!result.status) {
        throw new Error(result.msg);
      }
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw error;
    }
  }
);

export const updateProfile: any = createAsyncThunk(
  "profile/updateProfile",
  async (body: FormData | Record<string, unknown>) => {
    try {
      const result = await postRequest(body, "/api/profile/update");
      if (!result.status) {
        throw new Error(result.msg);
      }
      notify(result.msg || "Profile updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw error;
    }
  }
);

const initialState: {
  profile: any;
  loading: boolean;
  updateLoading: boolean;
} = {
  profile: null,
  loading: false,
  updateLoading: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
    },
  },
  extraReducers: {
    [getProfile.pending]: (state) => {
      state.loading = true;
    },
    [getProfile.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.profile = payload;
    },
    [getProfile.rejected]: (state) => {
      state.loading = false;
    },
    [updateProfile.pending]: (state) => {
      state.updateLoading = true;
    },
    [updateProfile.fulfilled]: (state) => {
      state.updateLoading = false;
    },
    [updateProfile.rejected]: (state) => {
      state.updateLoading = false;
    },
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
