import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getSchoolList: any = createAsyncThunk(
  "getSchoolList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/school/list");

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

export const uploadSchools: any = createAsyncThunk(
  "uploadSchools",
  async (body: any) => {
    try {
      const hasFile = body?.file != null;
      const isFileInstance = hasFile && body.file instanceof File;
      if (hasFile && !isFileInstance) {
        notify("Please select a valid file to upload.", "error");
        throw new Error("Please select a valid file to upload.");
      }
      let requestBody: any = body;
      if (hasFile && isFileInstance) {
        const formData = new FormData();
        formData.append("file", body.file);
        requestBody = formData;
      }

      const result = await postRequest(
        requestBody,
        "/api/school/fileImport"
      );

      notify("File uploaded successfully", "success");
      return result;
    } catch (error: any) {
      notify(error?.message ?? "Upload failed", "error");
      throw new Error(error);
    }
  }
);

export const getSchoolDetails: any = createAsyncThunk(
  "getSchoolDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/school/show/${params}`);
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

export const addSchool: any = createAsyncThunk("addSchool", async (body: any) => {
  try {
    // Check if body contains a file (logo)
    const hasFile = body?.logo instanceof File;
    
    // Convert to FormData if there's a file, otherwise prepare regular object
    let requestBody: any;
    if (hasFile) {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.keys(body).forEach((key: string) => {
        if (key === 'logo' && body[key] instanceof File) {
          formData.append('logo', body[key]);
        } else if (body[key] !== null && body[key] !== undefined) {
          formData.append(key, body[key]);
        }
      });
      
      requestBody = formData;
    } else {
      // Remove logo field if it's not a File (e.g., empty string)
      const { logo, ...rest } = body;
      requestBody = rest;
    }
    
    const result = await postRequest(requestBody, "/api/school/store");

    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("School created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editSchool: any = createAsyncThunk(
  "editSchool",
  async (body: any) => {
    try {
      // Check if body.data contains a file (logo)
      const hasFile = body?.data?.logo instanceof File;
      
      // Convert to FormData if there's a file
      let requestBody: any = body?.data;
      if (hasFile) {
        const formData = new FormData();
        
        // Append all fields to FormData
        Object.keys(body.data).forEach((key) => {
          if (key === 'logo' && body.data[key] instanceof File) {
            formData.append('logo', body.data[key]);
          } else if (body.data[key] !== null && body.data[key] !== undefined) {
            formData.append(key, body.data[key]);
          }
        });
        
        requestBody = formData;
      }
      
      const result = await postRequest(
        requestBody,
        `/api/school/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("School updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteAssignSchool: any = createAsyncThunk(
  "deleteAssignSchool",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/assignsSchools/delete`);

      notify("School Assignment deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteSchool: any = createAsyncThunk(
  "deleteSchool",
  async (body) => {
    try {
      const result = await deleteRequest(body, `/api/school/delete/${body}`);

      notify("School deleted successfully", "success");
      return result;
    } catch (error: any) {
      console.log(error);

      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const setSchoolStatus: any = createAsyncThunk(
  "setSchoolStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/school/status/${body}`);

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

export const assignSubjectToSchool: any = createAsyncThunk(
  "assignSubjectToSchool",
  async (body: any) => {
    try {
      const result = await postRequest(
        body?.data,
        `/api/school/assign_subject/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Subject assigned successfully", "success");
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.msg || "An error occurred";
      notify(errorMessage, "error");
      throw error;
    }
  }
);

export const assignTeacherToClass: any = createAsyncThunk(
  "assignTeacherToClass",
  async (body: any) => {
    try {
      const result = await postRequest(body, `/api/subject/assignTeacher`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Employee added successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const assignToStudent: any = createAsyncThunk(
  "assignToStudent",
  async (body: any) => {
    try {
      const result = await postRequest(body, `/api/assigns/store`);

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

export const deleteAssigning: any = createAsyncThunk(
  "deleteAssigning",
  async (body: any) => {
    try {
      const result = await deleteRequest(body, `/api/assigns/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Assign deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

// ------------ initial state -----------
export interface SchoolState {
  schoolList: any;
  schoolDetails: any;
  stepTaps: number;
  schoolID: any;
  schoolTap:
    | "Overview"
    | "Subjects"
    | "Grades & Classes"
    | "School Employees"
    | "Students";
}

const initialState: SchoolState = {
  schoolList: {},
  schoolDetails: {},
  stepTaps: 0,
  schoolID: null,
  schoolTap: "Overview",
};

// ------------ reducers ---------------
export const schoolSlice = createSlice({
  name: "school",
  initialState,
  reducers: {
    nextStep: (state: any) => {
      state.stepTaps++;
    },
    prevStep: (state: any) => {
      state.stepTaps--;
    },
    resetSteps: (state: any) => {
      state.stepTaps = 0;
    },
    setSchoolID: (state: any, { payload }) => {
      state.schoolID = payload;
    },
    setSchoolTap: (state: any, { payload }) => {
      state.schoolTap = payload;
    },
    clearSchoolDetails: (state: any) => {
      state.schoolDetails = {};
    },
  },
  extraReducers: {
    [getSchoolList.fulfilled]: (state: any, { payload }) => {
      state.schoolList = payload;
    },
    [getSchoolDetails.fulfilled]: (state: any, { payload }) => {
      state.schoolDetails = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { nextStep, resetSteps, prevStep, setSchoolID, setSchoolTap, clearSchoolDetails } =
  schoolSlice.actions;

export default schoolSlice.reducer;
