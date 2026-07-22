import { getRequest, postRequest } from "@/utils/fetchMethods";
import { AssignmentDetailsResponse } from "@/types/classAssignments";

export type AssignModuleType =
  | "subjects"
  | "units"
  | "lessons"
  | "lessons_contents"
  | "quizes"
  | "games";

export type AssignModuleOption = {
  id: number;
  name: string;
};

export type CreateAssignmentPayload = {
  school_id: number;
  type: AssignModuleType;
  type_id: number;
  due_at: string;
  class_id?: number[];
  student_id?: number[];
  teacher_id?: number;
};

type ModuleDataResponse = {
  status?: boolean;
  data?: AssignModuleOption[];
};

type StoreAssignResponse = {
  status?: boolean;
  msg?: string;
};

export const fetchAssignModuleOptions = async (
  schoolId: number,
  type: AssignModuleType
): Promise<AssignModuleOption[]> => {
  const response = (await getRequest(
    { school_id: schoolId, type },
    "/api/assigns/get_module_data"
  )) as ModuleDataResponse;

  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name ?? ""),
    }))
    .filter((row) => row.id > 0);
};

export const storeAssignment = async (
  payload: CreateAssignmentPayload
): Promise<StoreAssignResponse> => {
  return postRequest(payload, "/api/assigns/store") as Promise<StoreAssignResponse>;
};

/** F-043 — Assignment Details (Screen #6). */
export const fetchAssignmentDetails = async (
  classId: number,
  assignmentId: number
): Promise<AssignmentDetailsResponse> => {
  return getRequest(
    {},
    `/api/dashboard/teacher/classes/${classId}/assignments/${assignmentId}`
  ) as Promise<AssignmentDetailsResponse>;
};
