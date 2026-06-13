import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getFilesList: any = createAsyncThunk(
  "getFilesList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/file_maanger/list");

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

export const addFile: any = createAsyncThunk("addFile", async (body:any) => {
  try {
    // Validate files
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      notify("Please select at least one file", "error");
      throw new Error("No files selected");
    }
    
    // Convert files array to FormData
    const formData = new FormData();
    
    // Append each file with the key 'files[]' so Laravel receives it as an array
    body.files.forEach((file: File) => {
      formData.append('files[]', file);
    });
    
    // Append school_id if present (can be null)
    if (body.school_id !== null && body.school_id !== undefined) {
      formData.append('school_id', body.school_id.toString());
    }
    
    const result = await postRequest(formData, "/api/file_maanger/store");
  
    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("File added successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const deleteFile: any = createAsyncThunk("deleteFile", async (body) => {
  try {
    const result = await deleteRequest({}, `/api/file_maanger/delete/${body}`);

    if (!result.status) {
      throw new Error(result.msg);
    }
    notify("File deleted successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

// ------------ initial state -----------
export interface FilesState {
  filesList: any;
}

const initialState: FilesState = {
  filesList: {},
};

// ------------ reducers ---------------
export const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {},
  extraReducers: {
    [getFilesList.fulfilled]: (state: any, { payload }) => {
      state.filesList = payload;
    },
  },
});

export default filesSlice.reducer;
