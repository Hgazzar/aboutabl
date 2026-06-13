import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRequest } from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getGovernmentList: any = createAsyncThunk(
  "getGovernmentList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/govern/list`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.governs;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getCityList: any = createAsyncThunk(
  "getCityList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/city/list`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.cities;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getRoleList: any = createAsyncThunk(
  "getRoleList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/roles/list`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.roles;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getCommonSubjectsList: any = createAsyncThunk(
  "getCommonSubjectsList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/subject/list");

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.subjects;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getCommonGradeList: any = createAsyncThunk(
  "getCommonGradeList",
  async (params: any = {}) => {
    
    try {
      const result = await getRequest(params, "/api/grade/list");

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.grades;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

// ----------- redux thunk ----------
export const getClassList: any = createAsyncThunk(
  "getClassList",
  async (params: any = {}) => {
    
    try {
      const result = await getRequest(
        params,
        `/api/class/list?${params?.id ? "grade_id=" + params?.id : ""}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.classes;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getCommonClassList: any = createAsyncThunk(
  "getCommonClassList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/class/list`);

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

export const getJobList: any = createAsyncThunk(
  "getJobList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/jobs/list`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.jobs;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getCommonSchoolList: any = createAsyncThunk(
  "getCommonSchoolList",
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

export const getUnitList: any = createAsyncThunk(
  "getUnitList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params.data,
        `/api/subject/units/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.units;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getLessonList: any = createAsyncThunk(
  "getLessonList",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/units/show/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.lessons;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getLessonContentList: any = createAsyncThunk(
  "getLessonContentList",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/lessons/show/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result.contents;
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

      return result.students.data;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getAssigningList: any = createAsyncThunk(
  "getAssigningList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        { paginate: 20 },
        `/api/employees/assigning/${params}`
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

export const getTodosList: any = createAsyncThunk(
  "getTodosList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        { paginate: 20 },
        `/api/students/todo/${params}`
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
export interface GovernmentState {
  governmentList: any;
  cityList: any;
  roleList: any;
  subjectList: any;
  gradeList: any;
  classList: any;
  jobList: any;
  schoolList: any;
  unitList: any;
  lessonList: any;
  lessonContentList: any;
  studentList: any;
  assigningList: any;
  todosList: any;
}

const initialState: GovernmentState = {
  governmentList: {},
  cityList: {},
  roleList: {},
  subjectList: {},
  gradeList: {},
  classList: [],
  jobList: {},
  schoolList: {},
  unitList: {},
  lessonList: {},
  lessonContentList: {},
  studentList: {},
  assigningList: {},
  todosList: {},
};

// ------------ reducers ---------------
export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {},
  extraReducers: {
    [getGovernmentList.fulfilled]: (state: any, { payload }) => {
      state.governmentList = payload;
    },
    [getCityList.fulfilled]: (state: any, { payload }) => {
      state.cityList = payload;
    },
    [getRoleList.fulfilled]: (state: any, { payload }) => {
      state.roleList = payload;
    },
    [getCommonSubjectsList.fulfilled]: (state: any, { payload }) => {
      state.subjectList = payload;
    },
    [getCommonGradeList.fulfilled]: (state: any, { payload }) => {
      state.gradeList = payload;
    },
    [getClassList.fulfilled]: (state: any, { payload }) => {
      state.classList = payload;
    },
    [getJobList.fulfilled]: (state: any, { payload }) => {
      state.jobList = payload;
    },
    [getCommonSchoolList.fulfilled]: (state: any, { payload }) => {
      state.schoolList = payload;
    },
    [getUnitList.fulfilled]: (state: any, { payload }) => {
      state.unitList = payload;
    },
    [getLessonList.fulfilled]: (state: any, { payload }) => {
      state.lessonList = payload;
    },
    [getLessonContentList.fulfilled]: (state: any, { payload }) => {
      state.lessonContentList = payload;
    },
    [getStudentList.fulfilled]: (state: any, { payload }) => {
      state.studentList = payload;
    },
    [getAssigningList.fulfilled]: (state: any, { payload }) => {
      state.assigningList = payload;
    },
    [getTodosList.fulfilled]: (state: any, { payload }) => {
      state.todosList = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = commonSlice.actions;

export default commonSlice.reducer;
