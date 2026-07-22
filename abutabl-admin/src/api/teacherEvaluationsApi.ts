import { deleteRequest, postRequest, putRequest } from "@/utils/fetchMethods";
import { TeacherEvaluationNote } from "@/types/studentProfile";

const basePath = (classId: number, studentId: number) =>
  `/api/dashboard/teacher/classes/${classId}/students/${studentId}/evaluations`;

export type TeacherEvaluationMutationResponse = {
  status: boolean;
  item?: TeacherEvaluationNote;
  deleted?: boolean;
  msg?: string;
};

export const teacherEvaluationsApi = {
  create(
    classId: number,
    studentId: number,
    note: string
  ): Promise<TeacherEvaluationMutationResponse> {
    return postRequest({ note }, basePath(classId, studentId)) as Promise<
      TeacherEvaluationMutationResponse
    >;
  },

  update(
    classId: number,
    studentId: number,
    evaluationId: number,
    note: string
  ): Promise<TeacherEvaluationMutationResponse> {
    return putRequest(
      { note },
      `${basePath(classId, studentId)}/${evaluationId}`
    ) as Promise<TeacherEvaluationMutationResponse>;
  },

  remove(
    classId: number,
    studentId: number,
    evaluationId: number
  ): Promise<TeacherEvaluationMutationResponse> {
    return deleteRequest(
      {},
      `${basePath(classId, studentId)}/${evaluationId}`
    ) as Promise<TeacherEvaluationMutationResponse>;
  },
};
