import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const uploadStudents: any = createAsyncThunk("uploadStudents", async (body: any) => {
  try {
    // Convert file object to FormData
    let requestBody: any = body;
    
    if (body.file && body.file instanceof File) {
      const formData = new FormData();
      formData.append('file', body.file);
      if (body.school_id !== null && body.school_id !== undefined) {
        formData.append('school_id', body.school_id.toString());
      }
      requestBody = formData;
    }

    const result = await postRequest(requestBody, "/api/students/fileImport");

    notify("File uploaded successfully", "success");
    return result;
  } catch (error: any) {
    throw new Error(error);
  }
});
export const exportStudentList: any = createAsyncThunk(
  "exportStudentList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/students/export");

      if (!result.status) {
        throw new Error(result.msg);
      }

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
export const getStudentList: any = createAsyncThunk(
  "getStudentList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/students/list");

      if (!result.status) {
        throw new Error(result.msg);
      }

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

export const getStudentDetails: any = createAsyncThunk(
  "getStudentDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/students/show/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.student[0];
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const addStudent: any = createAsyncThunk("addStudent", async (body) => {
  try {
    const result = await postRequest(body, "/api/students/store");

    if (!result.status) {
      throw new Error(result.msg);
    }

    notify("Student created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editStudent: any = createAsyncThunk(
  "editStudent",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        `/api/students/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Student updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteStudent: any = createAsyncThunk(
  "deleteStudent",
  async (body) => {
    try {
      const result = await deleteRequest(body, `/api/students/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Student deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const setStudentStatus: any = createAsyncThunk(
  "setStudentStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/students/status/${body}`);

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
export interface StudentState {
  studentList: any;
  studentDetails: any;
}

const initialState: StudentState = {
  studentList: {},
  studentDetails: {},
};

// ------------ reducers ---------------
export const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {},
  extraReducers: {
    [getStudentList.fulfilled]: (state: any, { payload }) => {
      state.studentList = payload;
    },
    [getStudentDetails.fulfilled]: (state: any, { payload }) => {
      state.studentDetails = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = studentSlice.actions;

export default studentSlice.reducer;
