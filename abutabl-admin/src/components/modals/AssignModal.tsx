import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import Button from "../shared/Button";
import SelectBox from "../shared/SelectBox";
import TextField from "@mui/material/TextField";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectBoxOptions } from "../../utils/functions";
import { useParams } from "react-router-dom";
import {
  getAssigningList,
  getClassList,
  getCommonGradeList,
  getCommonSubjectsList,
  getLessonContentList,
  getLessonList,
  getStudentList,
  getTodosList,
  getUnitList,
} from "../../redux/reducers/commonReducer";
import { assignToStudent } from "../../redux/reducers/schoolReducer";
import { getSubjectsList } from "@/redux/reducers/subjectsReducer";
import { getEmployeeGrades } from "@/redux/reducers/employeeReducer";
import { getQuizzesformSubject } from "@/redux/reducers/subjectsReducer";
import { notify } from "@/utils/notify";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 500,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const AssignModal = ({
  open,
  onClose,
  id,
  schoolId,
  isTeacher,
  student,
}: any) => {
  // ----------- hooks ------------
  const dispatch = useDispatch();
  const param = useParams();
  const [assignValues, setAssignValues] = useState<any>({
    type: "",
    type_id: "",
  });
  const [assignedIds, setAssignedIds] = useState<any>({
    subjects: "",
    units: "",
    lessons: "",
    lessons_contents: "",
    quizes: "",
    games: "",
    assignments: "",
    worksheets: "",
  });
  const [assignTo, setAssignTo] = useState<any>(student ? "student" : "");
  const [assignee, setAssignee] = useState<any>(
    student ? [student?.studentDetails?.id] : []
  );

  const commonState = useSelector((state: RootState) => state?.common);
  const subjectState = useSelector((state: RootState) => state?.subjects);
  const loginUser = useSelector((state: RootState) => state?.login?.user);
  // const gradeState = useSelector((state: RootState) => state.employee);

  const [gradeEmp, setGradeEmp] = useState<any>();
  const [classEmp, setClassEmp] = useState<any>();
  const [dueDate, setDueDate] = useState<string>("");

  // ------------ side effects -------------

  // subject ===================
  useEffect(() => {
    if (
      assignValues.type === "subjects" ||
      assignValues.type === "units" ||
      assignValues.type === "lessons" ||
      assignValues.type === "lessons_contents" ||
      assignValues.type === "quizes"
    ) {
      if (
        commonState?.subjectList?.length ||
        subjectState?.subjectsList?.subjects?.data.lenght
      ) {
        return;
      }
      student
        ? dispatch(
            getSubjectsList({
              paginate: 10,
              school_id: student?.studentDetails?.school_id,
            })
          )
        : dispatch(getCommonSubjectsList({ school_id: schoolId && schoolId }));
    }
  }, [assignValues]);
  // console.log(schoolId);

  // Quizes ===================
  const quizState = useSelector((state: RootState) => state?.subjects?.quizzes);
  useEffect(() => {
    if (assignedIds?.subjects !== "" && assignValues.type === "quizes") {
      dispatch(getQuizzesformSubject({ subject_id: assignedIds?.subjects }));
    }
  }, [assignedIds?.subjects]);
  // unit ===================
  useEffect(() => {
    if (assignedIds?.subjects !== "") {
      dispatch(getUnitList({ id: assignedIds?.subjects }));
    }
  }, [assignedIds?.subjects]);

  // lessons ===================
  useEffect(() => {
    if (assignedIds?.units !== "") {
      dispatch(getLessonList(assignedIds?.units));
    }
  }, [assignedIds?.units]);

  // lessons content ===================
  useEffect(() => {
    if (assignedIds?.lessons !== "") {
      dispatch(getLessonContentList(assignedIds?.lessons));
    }
  }, [assignedIds?.lessons]);

  // assign to ===================
  useEffect(() => {
    if (assignTo === "student") {
      dispatch(getStudentList({ school_id: schoolId }));
    }
    if (assignTo === "grade") {
      if (isTeacher) {
        dispatch(
          getEmployeeGrades({ data: { school_id: schoolId }, id: param.id })
        )
          .unwrap()
          .then((result: any) => {
            setGradeEmp(result);
          });
      } else {
        dispatch(getCommonGradeList({ school_id: schoolId }));
      }
    }
    if (assignTo === "class") {
      if (isTeacher) {
        dispatch(getClassList({ teacher_id: param.id }))
          .unwrap()
          .then((result: any) => {
            setClassEmp(result);
          });
      } else {
        (async () => {
          await dispatch(getCommonGradeList({ school_id: schoolId }));
          await dispatch(
            getClassList({
              school_id: schoolId,
              grade_id: commonState?.gradeList?.[0]?.id,
            })
          );
        })();
      }
    }
  }, [assignTo]);

  // console.log(assignee);

  return (
    <>
      <Modal
        open={open}
        onClose={() => {
          setAssignedIds({
            subjects: "",
            units: "",
            lessons: "",
            lessons_contents: "",
            quizes: "",
            games: "",
            assignments: "",
            worksheets: "",
          });
          setAssignValues({
            type: "",
          });

          setAssignTo(student ? "student" : "");
          setAssignee(student ? [student?.studentDetails?.id] : []);
          onClose();
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1F1E1E",
              mb: 2,
              width: 400,
              maxHeight: 500,
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Assign
            </Typography>

            <span
              className="cursor-pointer"
              onClick={() => {
                setAssignedIds({
                  subjects: "",
                  units: "",
                  lessons: "",
                  lessons_contents: "",
                  quizes: "",
                  games: "",
                  assignments: "",
                  worksheets: "",
                });
                setAssignValues({
                  type: "",
                });

                setAssignTo(student ? "student" : "");
                setAssignee(student ? [student?.studentDetails?.id] : []);
                onClose();
              }}
            >
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {!id && (
              <>
                <div className="flex flex-col gap-0 w-full">
                  <label className="text-sm font-semibold mb-1">
                    Assign to <span className="text-red">*</span>
                  </label>
                  <SelectBox
                    values={[
                      {
                        label: "Students",
                        value: "student",
                      },
                      {
                        label: "Grades",
                        value: "grade",
                      },
                      {
                        label: "Classes",
                        value: "class",
                      },
                    ]}
                    id="school_id"
                    name="school_id"
                    value={assignTo}
                    onChange={(e: any) => {
                      setAssignTo(e.target.value);
                    }}
                  />
                </div>

                {assignTo === "student" && (
                  <div className="flex flex-col gap-0 w-full">
                    <label className="text-sm font-semibold mb-1">
                      Students <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        commonState?.studentList?.length > 0
                          ? selectBoxOptions(commonState?.studentList, "name")
                          : []
                      }
                      id="school_id"
                      name="school_id"
                      value={assignee}
                      onChange={(e: any) => {
                        setAssignee([e.target.value]);
                      }}
                    />
                  </div>
                )}
                {assignTo === "grade" && (
                  <div className="flex flex-col gap-0 w-full">
                    <label className="text-sm font-semibold mb-1">
                      Grades <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        isTeacher
                          ? gradeEmp?.grades?.length > 0
                            ? selectBoxOptions(gradeEmp?.grades, "name")
                            : []
                          : commonState?.gradeList?.length > 0
                          ? selectBoxOptions(commonState?.gradeList, "name")
                          : []
                      }
                      id="school_id"
                      name="school_id"
                      value={assignee}
                      onChange={(e: any) => {
                        setAssignee([e.target.value]);
                      }}
                    />
                  </div>
                )}
                {assignTo === "class" && (
                  <div className="flex flex-col gap-0 w-full">
                    <label className="text-sm font-semibold mb-1">
                      Classes <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        isTeacher
                          ? classEmp?.length > 0
                            ? selectBoxOptions(classEmp, "name")
                            : []
                          : commonState?.classList?.length > 0
                          ? selectBoxOptions(commonState?.classList, "name")
                          : []
                      }
                      id="school_id"
                      name="school_id"
                      value={assignee}
                      onChange={(e: any) => {
                        setAssignee([e.target.value]);
                      }}
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                Type <span className="text-red">*</span>
              </label>
              <SelectBox
                values={[
                  {
                    label: "Subjects",
                    value: "subjects",
                  },
                  {
                    label: "Units",
                    value: "units",
                  },
                  {
                    label: "Lessons",
                    value: "lessons",
                  },
                  {
                    label: "Lessons content",
                    value: "lessons_contents",
                  },
                  {
                    label: "Quizzes",
                    value: "quizes",
                  },
                  {
                    label: "Games",
                    value: "games",
                  },
                  {
                    label: "Assignments",
                    value: "assigments",
                  },
                  {
                    label: "Worksheets",
                    value: "worksheets",
                  },
                ]}
                id="school_id"
                name="school_id"
                value={assignValues.type}
                onChange={(e: any) => {
                  setAssignValues((prev: any) => {
                    return {
                      ...prev,
                      type: e.target.value,
                    };
                  });
                }}
              />
            </div>
            {/* assign subjects ================ */}
            {(assignValues.type === "subjects" ||
              assignValues.type === "units" ||
              assignValues.type === "lessons" ||
              assignValues.type === "lessons_contents" ||
              assignValues.type === "quizes") && (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Subject name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    student
                      ? subjectState?.subjectsList?.subjects?.data.length > 0
                        ? selectBoxOptions(
                            subjectState?.subjectsList?.subjects?.data,
                            "name"
                          )
                        : []
                      : commonState?.subjectList?.length > 0
                      ? selectBoxOptions(commonState?.subjectList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.subjects}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        subjects: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            )}
            {/* assign units ================ */}
            {(assignValues.type === "units" ||
              assignValues.type === "lessons" ||
              assignValues.type === "lessons_contents") &&
            assignedIds?.subjects !== "" ? (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Unit name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.unitList?.length > 0
                      ? selectBoxOptions(commonState?.unitList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.units}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        units: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            ) : null}
            {/* assign lessons ================ */}
            {(assignValues.type === "lessons" ||
              assignValues.type === "lessons_contents") &&
            assignedIds?.units !== "" ? (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Lessons name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.lessonList?.length > 0
                      ? selectBoxOptions(commonState?.lessonList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.lessons}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        lessons: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            ) : null}
            {/* assign lessons_contents ================ */}
            {assignValues.type === "lessons_contents" &&
            assignedIds?.lessons !== "" ? (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Lessons content name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.lessonContentList?.length > 0
                      ? selectBoxOptions(commonState?.lessonContentList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.lessons_contents}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        lessons_contents: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            ) : null}
            {/* assign quizes ================ */}
            {assignValues.type === "quizes" && assignedIds?.subjects !== "" && (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Quiz name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    quizState?.length > 0
                      ? selectBoxOptions(quizState, "title")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.quizes}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        quizes: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            )}
            {/* assign games ================ */}
            {assignValues.type === "games" && (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Assignment name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.subjectList?.length > 0
                      ? selectBoxOptions(commonState?.lessonContentList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.games}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        games: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            )}
            {/* assign assigments ================ */}
            {assignValues.type === "assigments" && (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Assignment name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.subjectList?.length > 0
                      ? selectBoxOptions(commonState?.lessonContentList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.assigments}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        assigments: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            )}

            {/* assign worksheets ================ */}
            {assignValues.type === "worksheets" && (
              <div className="flex flex-col gap-0 w-full">
                <label className="text-sm font-semibold mb-1">
                  Quiz name <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.subjectList?.length > 0
                      ? selectBoxOptions(commonState?.lessonContentList, "name")
                      : []
                  }
                  id="subject_id"
                  name="subject_id"
                  value={assignedIds.worksheets}
                  onChange={(e: any) => {
                    setAssignedIds((prev: any) => {
                      return {
                        ...prev,
                        worksheets: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            )}
          </Box>

          <Box sx={{ mt: 2, width: "100%" }}>
            <label className="text-sm font-semibold mb-1 block">
              Due date <span className="text-red">*</span>
            </label>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              color: "#1F1E1E",
              gap: 3,
              mt: 2,
            }}
          >
            <Button
              onClick={() => {
                setAssignedIds({
                  subjects: "",
                  units: "",
                  lessons: "",
                  lessons_contents: "",
                  quizes: "",
                  games: "",
                  assignments: "",
                  worksheets: "",
                });
                setAssignValues({
                  type: "",
                });
                setDueDate("");

                setAssignee(student ? [student?.studentDetails?.id] : []);
                setAssignTo(student ? "student" : "");
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                if (!dueDate) {
                  notify("Please select a due date", "error");
                  return;
                }
                const teacher_id = isTeacher
                  ? param.id
                  : loginUser?.id ?? null;
                await dispatch(
                  assignToStudent({
                    teacher_id: teacher_id,
                    type: assignValues?.type,
                    type_id: assignedIds?.[assignValues.type],
                    school_id: schoolId ? schoolId : param?.id,
                    due_date: dueDate,
                    // student_id: id,
                    [`${
                      assignTo === "student"
                        ? "student_id"
                        : assignTo === "grade"
                        ? "grade_id"
                        : assignTo === "class"
                        ? "class_id"
                        : "student_id"
                    }`]: id ?? assignee,
                  })
                )
                  .then(async () => {
                    setAssignedIds({
                      subjects: "",
                      units: "",
                      lessons: "",
                      lessons_contents: "",
                      quizes: "",
                      games: "",
                      assignments: "",
                      worksheets: "",
                    });
                    setAssignValues({
                      type: "",
                    });
                    setDueDate("");
                    setAssignTo(student ? "student" : "");
                    setAssignee(student ? [student?.studentDetails?.id] : []);
                    if (!id) {
                      await dispatch(getAssigningList(param.id));
                      await dispatch(getTodosList(param.id));
                    }
                    onClose();
                  })
                  .catch((err: any) => {
                    console.log(err);
                  });
              }}
              className="w-24"
              label="Save"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AssignModal;
