import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getRoleList: any = createAsyncThunk(
  "getRoleList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/roles/list");

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const addRole: any = createAsyncThunk("addRole", async (body) => {
  try {
    const result = await postRequest(body, "/api/roles/store");

    return result;
  } catch (error: any) {
    throw new Error(error);
  }
});

export const editRole: any = createAsyncThunk("editRole", async (body: any) => {
  try {
    const result = await postRequest(
      { ...body?.data, _method: "PUT" },
      `/api/roles/update/${body?.id}`
    );

    return result;
  } catch (error: any) {
    throw new Error(error);
  }
});

export const deleteRole: any = createAsyncThunk("deleteRole", async (body) => {
  try {
    const result = await deleteRequest(body, `/api/roles/delete/${body}`);

    return result;
  } catch (error: any) {
    throw new Error(error);
  }
});

export const setRolesStatus: any = createAsyncThunk(
  "setRolesStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/roles/status/${body}`);

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

export const getPermissionList: any = createAsyncThunk(
  "getPermissionList",
  async () => {
    try {
      const result = await getRequest({}, `/api/roles/create`);

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

export const getEditPermissionList: any = createAsyncThunk(
  "getEditPermissionList",
  async (param) => {
    try {
      const result = await getRequest({}, `/api/roles/edit?id=${param}`);

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
export interface roleState {
  roleList: any;
  permissionList: any;
}

const initialState: roleState = {
  roleList: {},
  permissionList: {},
};

// ------------ reducers ---------------
export const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {},
  extraReducers: {
    [getRoleList.fulfilled]: (state: any, { payload }) => {
      state.roleList = payload;
    },
    [getPermissionList.fulfilled]: (state: any, { payload }) => {
      state.permissionList = payload;
    },
    [getEditPermissionList.fulfilled]: (state: any, { payload }) => {
      state.permissionList = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = roleSlice.actions;

export default roleSlice.reducer;
