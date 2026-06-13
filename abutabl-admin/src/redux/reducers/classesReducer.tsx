import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getClassList: any = createAsyncThunk(
  "getClassList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params,
        `/api/class/list?grade_id=${params.id}`
      );

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

export const getSingleClassList: any = createAsyncThunk(
  "getSingleClassList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/class/show/${params.id}`);
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

export const addClass: any = createAsyncThunk("addClass", async (body) => {
  try {
    const result = await postRequest(body, "/api/class/store");

    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("Class created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editClass: any = createAsyncThunk(
  "editClass",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        // body?.data,
        `/api/class/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Class updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteClass: any = createAsyncThunk(
  "deleteClass",
  async (body) => {
    try {
      const result = await deleteRequest(body, `/api/class/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Class deleted successfully", "success");

      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const setClassStatus: any = createAsyncThunk(
  "setClassStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/class/status/${body}`);

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
export interface ClassState {
  classList: any;
  singleClassList: any;
}

const initialState: ClassState = {
  classList: {},
  singleClassList: {},
};

// ------------ reducers ---------------
export const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {},
  extraReducers: {
    [getClassList.fulfilled]: (state: any, { payload }) => {
      state.classList = payload;
    },
    [getSingleClassList.fulfilled]: (state: any, { payload }) => {
      state.singleClassList = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = classSlice.actions;

export default classSlice.reducer;
