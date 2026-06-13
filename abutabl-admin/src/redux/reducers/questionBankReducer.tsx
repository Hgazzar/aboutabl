import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getQuestionList: any = createAsyncThunk(
  "getQuestionList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/questions/list");

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const exportQuestionToEdit: any = createAsyncThunk(
  "exportQuestionToEdit",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/questions/export");

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const uploadQuestions: any = createAsyncThunk(
  "uploadQuestions",
  async (body: any) => {
    try {
      // Convert file object to FormData
      let requestBody: any = body;
      
      if (body.file && body.file instanceof File) {
        const formData = new FormData();
        formData.append('file', body.file);
        if (body.subject_id != null && body.subject_id !== '') {
          formData.append('subject_id', String(body.subject_id));
        }
        requestBody = formData;
      }

      const result = await postRequest(requestBody, "/api/questions/fileImport");
      const summary = result?.import_summary;
      const msg = result?.msg ?? "Import completed.";
      if (summary && (summary.imported ?? 0) === 0) {
        notify(msg, "warning");
      } else {
        notify(msg, "success");
      }
      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const uploadEditedQuestions: any = createAsyncThunk(
  "uploadEditedQuestions",
  async (body: any) => {
    try {
      // Convert file object to FormData
      let requestBody: any = body;
      
      if (body.file && body.file instanceof File) {
        const formData = new FormData();
        formData.append('file', body.file);
        requestBody = formData;
      }

      const result = await postRequest(requestBody, "/api/questions/fileImportUpdate");
      const summary = result?.import_summary;
      const msg = result?.msg ?? "Import completed.";
      if (summary && (summary.updated ?? 0) === 0) {
        notify(msg, "warning");
      } else {
        notify(msg, "success");
      }
      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const deleteQuestion: any = createAsyncThunk(
  "deleteQuestion",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/questions/delete`);

      notify("Question deleted successfully", "success");
      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const getQuestionDetails: any = createAsyncThunk(
  "getQuestionDetails",
  async (id: string | number) => {
    try {
      const result = await getRequest({}, `/api/questions/show/${id}`);

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const updateQuestion: any = createAsyncThunk(
  "updateQuestion",
  async ({ id, body }: { id: string | number; body: any }) => {
    try {
      // Convert body to FormData if it contains files
      let requestBody: any = body;
      
      // Check if body contains file fields
      const hasFiles = Object.keys(body).some(key => 
        body[key] instanceof File || 
        (typeof body[key] === 'object' && body[key] !== null && body[key] !== undefined && body[key].file instanceof File)
      );

      if (hasFiles) {
        const formData = new FormData();
        
        // Append all fields to FormData
        Object.keys(body).forEach(key => {
          if (body[key] instanceof File) {
            formData.append(key, body[key]);
          } else if (body[key] !== null && body[key] !== undefined) {
            if (Array.isArray(body[key])) {
              body[key].forEach((item: any, index: number) => {
                formData.append(`${key}[${index}]`, item);
              });
            } else {
              formData.append(key, body[key].toString());
            }
          }
        });
        
        requestBody = formData;
      }

      const result = await putRequest(requestBody, `/api/questions/update/${id}`);

      notify("Question updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message || "Failed to update question", "error");
      throw new Error(error);
    }
  }
);

// ------------ initial state -----------
export interface questionState {
  questionList: any;
}

const initialState: questionState = {
  questionList: {},
};

// ------------ reducers ---------------
export const questionSlice = createSlice({
  name: "question",
  initialState,
  reducers: {},
  extraReducers: {
    [getQuestionList.pending]: (state: any) => {
      // Keep existing state while loading
    },
    [getQuestionList.fulfilled]: (state: any, { payload }) => {
      state.questionList = payload;
    },
    [getQuestionList.rejected]: (state: any, { error }) => {
      // Reset to empty state on error
      state.questionList = { question: { data: [] } };
      console.error("Failed to fetch questions:", error);
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = questionSlice.actions;

export default questionSlice.reducer;
