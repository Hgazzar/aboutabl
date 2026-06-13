import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getPermissions: any = createAsyncThunk(
  "getPermissions",
  async (params: any = {}) => {    
    try {
      const result = await getRequest(params, "/api/permissions");

      if (!result.status) {
        throw new Error(result.msg);
      }
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

// ------------ initial state -----------
export interface PermissionsState {
    permissions: any;
    loading: any;
  }
  
  const initialState: PermissionsState = {
    permissions: {},
    loading: false
  }; 

  // ------------ reducers ---------------
export const permissionsSlice = createSlice({
    name: "permissions",
    initialState,
    reducers: {
      clearPermissions: (state: any) => {
        state.permissions = {};
        state.loading = false;
      },
    },
    extraReducers: {
      [getPermissions.fulfilled]: (state: any, { payload }) => {
        state.permissions = payload.permissions;
        state.loading = false
      },
      [getPermissions.pending]: (state: any) => {
        state.loading = true
      },
      [getPermissions.rejected]: (state: any) => {
        state.loading = false;
        state.permissions = {}
      }
    },
  });
  

  export const { clearPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;

  