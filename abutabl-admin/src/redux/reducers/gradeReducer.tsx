import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getGradeList: any = createAsyncThunk(
  "getGradeList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/grade/list");

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

export const geGradeDetails: any = createAsyncThunk(
  "geGradeDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/grade/show/${params.id}`);
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

export const addGrade: any = createAsyncThunk("addGrade", async (body) => {
  try {
    const result = await postRequest(body, "/api/grade/store");

    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("Grade created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editGrade: any = createAsyncThunk(
  "editGrade",
  async (body: any) => {
    try {
      const result = await putRequest(
        body?.data,
        `/api/grade/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Grade updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteGrade: any = createAsyncThunk(
  "deleteGrade",
  async (body) => {
    try {
      const result = await postRequest({}, `/api/grade/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Grade deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);
export const deleteGradeWithParams = createAsyncThunk(
  "deleteGradeWithParams",
  // @ts-ignore
  async ({ body, params }) => {
    try {
      const result = await postRequest(
        body || {},
        `/api/grade/delete/${params ?? body}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Grade deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const setGradeStatus: any = createAsyncThunk(
  "setGradeStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/grade/status/${body}`);

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
export interface GradeState {
  gradeList: any;
  gradeDetails: any;
}

const initialState: GradeState = {
  gradeList: {},
  gradeDetails: {},
};

// ------------ reducers ---------------
export const gradeSlice = createSlice({
  name: "grade",
  initialState,
  reducers: {},
  extraReducers: {
    [getGradeList.fulfilled]: (state: any, { payload }) => {
      state.gradeList = payload;
    },
    [geGradeDetails.fulfilled]: (state: any, { payload }) => {
      state.gradeDetails = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = gradeSlice.actions;

export default gradeSlice.reducer;
