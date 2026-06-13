import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";

// ----------- redux thunk ----------
export const getSubjectsList: any = createAsyncThunk(
  "getSubjectsList",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, "/api/subject/list");

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

export const getSubjectDetails: any = createAsyncThunk(
  "getSubjectDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/subject/show/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const getUnitsformSubject: any = createAsyncThunk(
  "getUnitsformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params.data,
        `/api/subject/units/${params.id}`
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

export const getGradesformSubject: any = createAsyncThunk(
  "getGradesformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params.data,
        `/api/subject/grades/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.grade;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getTeachersformSubject: any = createAsyncThunk(
  "getTeachersformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params.data,
        `/api/subject/teachers/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.teachers;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getStudentsformSubject: any = createAsyncThunk(
  "getStudentsformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        params.data,
        `/api/subject/students/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.students;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const addSubject: any = createAsyncThunk("addSubject", async (body: any) => {
  try {
    // Check if body contains a file (photo)
    const hasFile = body?.photo instanceof File;
    
    // Convert to FormData if there's a file, otherwise prepare regular object
    let requestBody: any;
    if (hasFile) {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.keys(body).forEach((key: string) => {
        if (key === 'photo' && body[key] instanceof File) {
          formData.append('photo', body[key]);
        } else if (body[key] !== null && body[key] !== undefined) {
          formData.append(key, body[key]);
        }
      });
      
      requestBody = formData;
    } else {
      // Remove photo field if it's not a File (e.g., null)
      const { photo, ...rest } = body;
      requestBody = rest;
    }
    
    const result = await postRequest(requestBody, "/api/subject/store");

    if (!result.status) {
      throw new Error(result.msg);
    }

    notify("Subject created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editSubject: any = createAsyncThunk(
  "editSubject",
  async (body: any) => {
    try {
      // Check if body contains a file (photo)
      const hasFile = body?.data?.photo instanceof File;
      
      // Convert to FormData if there's a file, otherwise prepare regular object
      let requestBody: any;
      if (hasFile) {
        const formData = new FormData();
        
        // Append all fields to FormData
        Object.keys(body.data).forEach((key: string) => {
          if (key === 'photo' && body.data[key] instanceof File) {
            formData.append('photo', body.data[key]);
          } else if (body.data[key] !== null && body.data[key] !== undefined) {
            // Convert values to strings for FormData
            if (typeof body.data[key] === 'boolean' || typeof body.data[key] === 'number') {
              formData.append(key, body.data[key].toString());
            } else {
              formData.append(key, body.data[key]);
            }
          }
        });
        
        requestBody = formData;
      } else {
        // Remove photo field if it's not a File (e.g., null or string)
        const { photo, ...rest } = body.data;
        requestBody = rest;
      }
      
      const result = await postRequest(
        requestBody,
        `/api/subject/update/${body.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Subject updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteSubject: any = createAsyncThunk(
  "deleteSubject",
  async (body: any) => {
    try {
      const result = await postRequest(
        body?.data,
        `/api/subject/delete/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Subject deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const assignSubjectToGrade: any = createAsyncThunk(
  "assignSubjectToGrade",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body.data, _method: "PUT" },
        `/api/subject/assignGrade/${body?.id}`
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

export const setSubjectStatus: any = createAsyncThunk(
  "setSubjectStatus",
  async (body: any) => {
    try {
      const result = await postRequest(
        { _method: "PUT", ...body.data },
        `/api/subject/status/${body.id}`
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

export const addUnitToSubject: any = createAsyncThunk(
  "addUnitToSubject",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/units/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Unit created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const editUnitToSubject: any = createAsyncThunk(
  "editUnitToSubject",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        `/api/units/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Unit updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const changeUnitType: any = createAsyncThunk(
  "changeUnitType",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, _method: "PUT" },
        `/api/units/status_type/${body?.id}`
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

export const deleteUnit: any = createAsyncThunk(
  "deleteUnit",
  async (body: any) => {
    try {
      const result = await deleteRequest({}, `/api/units/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Unit deleted successfully", "success");
      return result;
    } catch (error: any) {
      if (error?.message?.slice(-3) == "400") {
        notify(
          "The unit cannot be deleted because it contains lessons",
          "error"
        );
      } else {
        notify(error?.message, "error");
      }
      // throw new Error(error);
    }
  }
);

export const getQuizzesformSubject: any = createAsyncThunk(
  "getQuizzesformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/quizes/list`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      return result?.quizes;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);

// activites Get Data
export const getActivities: any = createAsyncThunk(
  "getActivities",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        { params: {} },
        `/api/subject_activities/list/${params.type}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      return result?.data;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const getActivityLessons: any = createAsyncThunk(
  "getActivityLessons",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        { params: {} },
        `/api/subject_activities/show/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const getActivityLessonDetails: any = createAsyncThunk(
  "getActivityLessonDetails",
  async (params: any = {}) => {
    try {
      const result = await getRequest(
        { params: {} },
        `/api/activity_lessons/show/${params.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);

export const addActivityToSubject: any = createAsyncThunk(
  "addActivityToSubject",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/subject_activities/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Activity created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);

export const editActivityToSubject: any = createAsyncThunk(
  "editActivityToSubject",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body?.data, method: "PUT" },
        `/api/subject_activities/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("activity updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const deleteActivity: any = createAsyncThunk(
  "deleteActivity",
  async (id) => {
    try {
      const result = await postRequest(
        { method: "delete" },
        `/api/subject_activities/delete/${id}`
      );

      if (!result.status) {
        notify(result.msg, "error");
        return;
      }

      notify("activity deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);

export const addLessonToActivity: any = createAsyncThunk(
  "addLessonToActivity",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/activity_lessons/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Lesson created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const editLessonInActivity: any = createAsyncThunk(
  "editLessonInActivity",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body, method: "PUT" },
        `/api/activity_lessons/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("lesson updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const deleteLessonActivity: any = createAsyncThunk(
  "deleteLessonActivity",
  async (id) => {
    try {
      const result = await postRequest(
        { method: "delete" },
        `/api/activity_lessons/delete/${id}`
      );

      if (!result.status) {
        notify(result.msg, "error");
        return;
      }

      notify("lesson deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      // throw new Error(error);
    }
  }
);
export const uploadDataActivity: any = createAsyncThunk(
  "uploadDataActivity",
  async (body: any) => {
    try {
      // Always send as FormData when a file is present so the backend receives it (JSON would drop the File)
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
        if (body.subject_id != null && body.subject_id !== undefined) {
          formData.append("subject_id", String(body.subject_id));
        }
        if (body.activity_lesson_id != null && body.activity_lesson_id !== undefined) {
          formData.append("activity_lesson_id", String(body.activity_lesson_id));
        }
        requestBody = formData;
      }

      const result = await postRequest(
        requestBody,
        "/api/activity_lessons/fileImport"
      );

      if (!result?.status) {
        notify(result?.msg ?? "Upload failed", "error");
        throw new Error(result?.msg ?? "Upload failed");
      }

      const summary = result?.import_summary;
      const msg = result?.msg ?? "Import completed.";
      const newWork =
        (summary?.imported ?? 0) +
        (summary?.links_added ?? 0) +
        (summary?.quizzes_new ?? 0) +
        (summary?.games_new ?? 0) +
        (summary?.worksheets_new ?? 0);
      if (summary && newWork === 0) {
        notify(msg, "warning");
      } else {
        notify(msg, "success");
      }
      return result;
    } catch (error: any) {
      notify(error?.message ?? "Upload failed", "error");
    }
  }
);
export const QuizDetailsformSubject: any = createAsyncThunk(
  "QuizDetailsformSubject",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/quizes/show/${params}`);

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

export const addQuizToSubject: any = createAsyncThunk(
  "addQuizToSubject",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/quizes/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Quiz created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const deleteQuiz: any = createAsyncThunk(
  "deleteQuiz",
  async (body: any) => {
    try {
      const result = await deleteRequest({}, `/api/quizes/delete/${body}`);

      if (!result.status) {
        notify(result.msg, "error");
        return;
      }

      notify("Quiz deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);
export const getQuizDetails: any = createAsyncThunk(
  "getQuizDetails",
  async (body: any) => {
    try {
      const result = await getRequest({}, `/api/quizes/show/${body}`);

      if (!result.status) {
        notify(result.msg, "error");
        return;
      }

      // notify("Quiz deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const editQuiz = createAsyncThunk(
  "editQuiz",
  // @ts-ignore
  async ({ body, params }) => {
    try {
      const result = await postRequest(body, `/api/quizes/update/${params}`);

      if (!result.status) {
        throw new Error(result.msg);
      }
      notify("Quiz updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const getLessonDetails: any = createAsyncThunk(
  "getLesson",
  async (body: any) => {
    try {
      const result = await getRequest({}, `/api/lessons/show/${body}`);

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

export const deleteLesson: any = createAsyncThunk(
  "deleteLesson",
  async (body: any) => {
    try {
      const result = await deleteRequest({}, `/api/lessons/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Lesson deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const lessonToUnitList: any = createAsyncThunk(
  "lessonToUnitlist",
  async (body) => {
    try {
      const result = await getRequest({}, `/api/units/show/${body}`);

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

export const addLessonToUnit: any = createAsyncThunk(
  "addLessonToUnit",
  async (body) => {
    try {
      const result = await postRequest(body, `/api/lessons/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Lesson created successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const editLessonToUnit: any = createAsyncThunk(
  "editLessonToUnit",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body.data, _method: "PUT" },
        `/api/lessons/update/${body.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Lesson updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

// Helper function to determine file type from file extension
const getFileTypeFromExtension = (fileName: string): string => {
  if (!fileName) return "";
  
  const extension = fileName.split('.').pop()?.toLowerCase() || "";
  
  const typeMap: { [key: string]: string } = {
    // Video
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'wmv': 'video',
    'flv': 'video',
    'webm': 'video',
    'mkv': 'video',
    'm4v': 'video',
    '3gp': 'video',
    // Word
    'doc': 'word',
    'docx': 'word',
    // PowerPoint
    'ppt': 'powerpoints',
    'pptx': 'powerpoints',
    // Excel
    'xls': 'excel',
    'xlsx': 'excel',
    // Image
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'bmp': 'image',
    // Audio
    'mp3': 'audio',
    'wav': 'audio',
    'ogg': 'audio',
    // PDF
    'pdf': 'pdf',
    // SCORM
    'zip': 'scorm',
  };
  
  return typeMap[extension] || "";
};

export const addContentToLesson: any = createAsyncThunk(
  "addContentToLesson",
  async (body: any) => {
    try {
      // If adding SCORM from DDL, send JSON (no file)
      let requestBody: any = body;
      const isDdlScorm = body.source === "ddl" && body.scorm_directory;

      if (isDdlScorm) {
        requestBody = {
          source: "ddl",
          scorm_directory: body.scorm_directory,
          type: "scorm",
          name_en: body.name_en,
          name_ar: body.name_ar,
          about_en: body.about_en,
          about_ar: body.about_ar,
          status: body.status !== undefined ? body.status.toString() : "1",
          subject_id: body.subject_id?.toString(),
          lesson_id: body.lesson_id?.toString(),
          resource_id: body.resource_id,
        };
      } else if (body.file && body.file instanceof File) {
        const formData = new FormData();
        
        // Append file
        formData.append('file', body.file);
        
        // Determine type from file if not provided
        let fileType = body.type;
        if (!fileType && body.file.name) {
          fileType = getFileTypeFromExtension(body.file.name);
        }
        
        // Append all other fields
        if (body.name_en) formData.append('name_en', body.name_en);
        if (body.name_ar) formData.append('name_ar', body.name_ar);
        if (body.about_en) formData.append('about_en', body.about_en);
        if (body.about_ar) formData.append('about_ar', body.about_ar);
        if (fileType) formData.append('type', fileType);
        if (body.status !== undefined) formData.append('status', body.status.toString());
        if (body.subject_id) formData.append('subject_id', body.subject_id.toString());
        if (body.lesson_id) formData.append('lesson_id', body.lesson_id.toString());
        
        // Append resource_id array if present
        if (body.resource_id && Array.isArray(body.resource_id) && body.resource_id.length > 0) {
          body.resource_id.forEach((id: any) => {
            formData.append('resource_id[]', id.toString());
          });
        }
        
        requestBody = formData;
      }

      const result = await postRequest(requestBody, `/api/contents/store`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Content added successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const editContentInLesson: any = createAsyncThunk(
  "editContentInLesson",
  async (body: any) => {
    try {
      const result = await postRequest(
        body.data,
        `/api/contents/update/${body.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Content edited successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const addExternalLinkToContent: any = createAsyncThunk(
  "addExternalLinkToContent",
  async (body: any) => {
    try {
      const result = await postRequest(
        { ...body, type: "external_link" },
        `/api/resources/store`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("External link added successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

export const viewContent: any = createAsyncThunk(
  "viewContent",
  async (body: any) => {
    try {
      const result = await getRequest({}, `/api/contents/show/${body}`);

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

export const deleteContent: any = createAsyncThunk(
  "deleteContent",
  async (body: any) => {
    try {
      const result = await deleteRequest({}, `/api/contents/delete/${body}`);

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Content deleted successfully");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);
export const getGamesDetalis: any = createAsyncThunk(
  "getGamesDetalis",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/games/list`);

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
export const getGamesShow: any = createAsyncThunk(
  "getGamesDetalis",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/games/show/${params.id}`);

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

export const addGame: any = createAsyncThunk("addGame", async (body: any) => {
  try {
    // Check if body contains files (background or file)
    const hasBackgroundFile = body?.background instanceof File;
    const hasGameFile = body?.file instanceof File;
    const hasFiles = hasBackgroundFile || hasGameFile;
    
    // Convert to FormData if there are files, otherwise prepare regular object
    let requestBody: any;
    if (hasFiles) {
      const formData = new FormData();
      
      // Append files
      if (hasBackgroundFile) {
        formData.append('background', body.background);
      }
      if (hasGameFile) {
        formData.append('file', body.file);
      }
      
      // Append all other fields to FormData
      Object.keys(body).forEach((key: string) => {
        // Skip files as they're already appended
        if (key === 'background' || key === 'file') {
          return;
        }
        
        // Handle arrays (like skills_tags)
        if (Array.isArray(body[key])) {
          // Only append non-empty array items
          body[key].forEach((item: any) => {
            if (item !== null && item !== undefined && item !== '') {
              formData.append(`${key}[]`, item.toString());
            }
          });
        } else if (body[key] !== null && body[key] !== undefined && body[key] !== '') {
          formData.append(key, body[key].toString());
        }
      });
      
      requestBody = formData;
    } else {
      // Remove file fields if they're not Files (e.g., empty strings or null)
      const { background, file, ...rest } = body;
      requestBody = rest;
    }
    
    const result = await postRequest(requestBody, "/api/games/store");

    if (!result.status) {
      throw new Error(result.msg);
    }

    notify("Game created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});

export const editGame: any = createAsyncThunk("editGame", async (body: any) => {
  try {
    const result = await postRequest(body, `/api/games/update/${body?.id}`);

    if (!result.status) {
      throw new Error(result.msg);
    }

    notify("Game updated successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});
export const deleteGame: any = createAsyncThunk(
  "deleteGame",
  async (body: any) => {
    try {
      const result = await deleteRequest(
        { ...body?.data, _method: "PUT" },
        `/api/games/delete/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Game deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);
export const getSheetsDetalis: any = createAsyncThunk(
  "getSheetsDetalis",
  async (params: any = {}) => {
    try {
      const result = await getRequest(params, `/api/worksheets/list`);

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
export const addSheet: any = createAsyncThunk("addSheet", async (body: any) => {
  try {
    // Check if body contains files (background or file)
    const hasBackgroundFile = body?.background instanceof File;
    const hasWorksheetFile = body?.file instanceof File;
    const hasFiles = hasBackgroundFile || hasWorksheetFile;
    
    // Convert to FormData if there are files, otherwise prepare regular object
    let requestBody: any;
    if (hasFiles) {
      const formData = new FormData();
      
      // Append files
      if (hasBackgroundFile) {
        formData.append('background', body.background);
      }
      if (hasWorksheetFile) {
        formData.append('file', body.file);
      }
      
      // Append all other fields to FormData
      Object.keys(body).forEach((key: string) => {
        // Skip files as they're already appended
        if (key === 'background' || key === 'file') {
          return;
        }
        
        // Handle arrays (like skills_tags)
        if (Array.isArray(body[key])) {
          // Only append non-empty array items
          body[key].forEach((item: any) => {
            if (item !== null && item !== undefined && item !== '') {
              formData.append(`${key}[]`, item.toString());
            }
          });
        } else if (body[key] !== null && body[key] !== undefined && body[key] !== '') {
          formData.append(key, body[key].toString());
        }
      });
      
      requestBody = formData;
    } else {
      // Remove file fields if they're not Files (e.g., empty strings or null)
      const { background, file, ...rest } = body;
      requestBody = rest;
    }
    
    const result = await postRequest(requestBody, "/api/worksheets/store");

    if (!result.status) {
      throw new Error(result.msg);
    }

    notify("Worksheet created successfully", "success");
    return result;
  } catch (error: any) {
    notify(error.message, "error");
    throw new Error(error);
  }
});
export const editSheet: any = createAsyncThunk(
  "editSheet",
  async (body: any) => {
    try {
      const result = await postRequest(
        body,
        `/api/worksheets/update/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Worksheet updated successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);
export const getSheetShow: any = createAsyncThunk(
  "getSheetShow",
  async (params: any = {}) => {
    try {
      const result = await getRequest({}, `/api/worksheets/show/${params.id}`);

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
export const deleteSheet: any = createAsyncThunk(
  "deleteSheet",
  async (body: any) => {
    try {
      const result = await deleteRequest(
        { ...body?.data, _method: "PUT" },
        `/api/worksheets/delete/${body?.id}`
      );

      if (!result.status) {
        throw new Error(result.msg);
      }

      notify("Worksheet deleted successfully", "success");
      return result;
    } catch (error: any) {
      notify(error.message, "error");
      throw new Error(error);
    }
  }
);

// ------------ initial state -----------
export interface subjectsState {
  subjectsList: any;
  subjectOverview: any;
  units: any;
  grades: any;
  teachers: any;
  students: any;
  games: any;
  quizzes: any;
  sheets: any;
  activities: any;
}

const initialState: subjectsState = {
  subjectsList: {},
  subjectOverview: {},
  units: {},
  activities: {},
  grades: {},
  teachers: {},
  students: {},
  games: {},
  quizzes: {},
  sheets: {},
};

// ------------ reducers ---------------
export const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {},
  extraReducers: {
    [getSubjectsList.fulfilled]: (state: any, { payload }) => {
      state.subjectsList = payload;
    },
    [getSubjectDetails.fulfilled]: (state: any, { payload }) => {
      state.subjectOverview = payload;
    },
    [getUnitsformSubject.fulfilled]: (state: any, { payload }) => {
      state.units = payload;
    },
    [getGradesformSubject.fulfilled]: (state: any, { payload }) => {
      state.grades = payload;
    },
    [getTeachersformSubject.fulfilled]: (state: any, { payload }) => {
      state.teachers = payload;
    },
    [getStudentsformSubject.fulfilled]: (state: any, { payload }) => {
      state.students = payload;
    },
    [getGamesDetalis.fulfilled]: (state: any, { payload }) => {
      state.games = payload;
    },
    [getQuizzesformSubject.fulfilled]: (state: any, { payload }) => {
      state.quizzes = payload;
    },
    [getActivities.fulfilled]: (state: any, { payload }) => {
      state.activities = payload;
    },
    [getSheetsDetalis.fulfilled]: (state: any, { payload }) => {
      state.sheets = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {} = subjectsSlice.actions;

export default subjectsSlice.reducer;
