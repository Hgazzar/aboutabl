import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRequest, postRequest, putRequest, deleteRequest } from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getEmployeeList: any = createAsyncThunk(
  "getEmployeeList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/employees/list");

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

export const uploadEmployees: any = createAsyncThunk(
  "uploadEmployees",
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
        if (body.school_id != null && body.school_id !== undefined) {
          formData.append("school_id", String(body.school_id));
        }
        requestBody = formData;
      }

      const result = await postRequest(
        requestBody,
        "/api/employees/fileImport"
      );

      notify("File uploaded successfully", "success");
      return result;
    } catch (error: any) {
      notify(error?.message ?? "Upload failed", "error");
      throw new Error(error);
    }
  }
);
export const exportEmployeeList: any = createAsyncThunk(
  "exportEmployeeList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/employees/export");

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

export const getUserList: any = createAsyncThunk(
  "getUserList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/admin/list");

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

export const getEmployeeDetails: any = createAsyncThunk(
  "getEmployeeDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/employees/show/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.user[0];
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const addEmployee: any = createAsyncThunk(
  "addEmployee",
  async (body) => {
    try {
      const result = await postRequest(body, "/api/employees/store");

      if (!result.status) {
        throw new Error(result.status);
      }
      notify("Employee created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);

      // console.log(error.message)
    }
  }
);

export const addUser: any = createAsyncThunk("addUser", async (body) => {
  try {
    const result = await postRequest(body, "/api/admin/store");

    if (!result.status) {
      throw new Error(result.status);
    }
    notify("User created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editEmployee: any = createAsyncThunk(
  "editEmployee",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        `/api/employees/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Employee updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const editUser: any = createAsyncThunk("editUser", async (body: any) => {
  try {
    const result = await postRequest(
      { ...body?.data, _method: "PUT" },
      `/api/admin/update/${body?.id}`
    );

    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("User updated successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editTeacher: any = createAsyncThunk(
  "editTeacher",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        `/api/employees/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("User updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteEmployee: any = createAsyncThunk(
  "deleteEmployee",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/employees/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Employee deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteUser: any = createAsyncThunk(
  "deleteUser",
  async (id) => {
    try {
      const result = await deleteRequest({}, `/api/admin/delete/${id}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("User deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const setEmployeeStatus: any = createAsyncThunk(
  "setEmployeeStatus",
  async (body) => {
    try {
      const result = await putRequest(body, `/api/employees/status/${body}`);

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

export const assignGradeToEmployee: any = createAsyncThunk(
  "assignGradeToEmployee",
  async (body: any) => {
    try {
      const result = await postRequest(
        body.data,
        `/api/employees/assign_grade/${body.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Grade assigned successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const assignSchoolToEmployee: any = createAsyncThunk(
  "assignSchoolToEmployee",
  async (body: any) => {
    try {
      const result = await postRequest(
        body.data,
        `/api/admin/assign_schools/${body.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("School assigned successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getEmployeeGrades: any = createAsyncThunk(
  "getEmployeeGrades",
  async (body: any) => {
    // console.log(body);

    try {
      const result = await getRequest(
        body.data,
        `/api/employees/grades/${body.id}`
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

// ------------ initial state -----------
export interface EmployeeState {
  employeeList: any;
  employeeDetails: any;
  isTeacher: boolean;
  employeeTap: "Overview" | "Classes" | "Assignings";
}

const initialState: EmployeeState = {
  employeeList: {},
  employeeDetails: {},
  isTeacher: false,
  employeeTap: "Overview",
};

// ------------ reducers ---------------
export const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    setIsTeacher: (state: any, { payload }) => {
      state.isTeacher = payload;
    },
    setEmployeeTap: (state: any, { payload }) => {
      state.employeeTap = payload;
    },
  },
  extraReducers: {
    [getEmployeeList.fulfilled]: (state: any, { payload }) => {
      state.employeeList = payload;
    },
    [getUserList.fulfilled]: (state: any, { payload }) => {
      state.employeeList = payload;
    },
    [getEmployeeDetails.fulfilled]: (state: any, { payload }) => {
      state.employeeDetails = {
        ...payload,
        full_name_en: payload?.full_name_en ?? payload?.name_en ?? payload?.name ?? "",
        full_name_ar: payload?.full_name_ar ?? payload?.name_ar ?? "",
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { setIsTeacher, setEmployeeTap } = employeeSlice.actions;

export default employeeSlice.reducer;
