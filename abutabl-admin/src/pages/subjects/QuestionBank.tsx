import {
  Alert,
  Box,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import CloseIcon from "@mui/icons-material/Close";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteQuestion,
  getQuestionList,
  uploadEditedQuestions,
  uploadQuestions,
} from "@/redux/reducers/questionBankReducer";
import { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { buildTemplateUrl } from "../../utils/fetchMethods";
import SelectBox from "@/components/shared/SelectBox";
import {
  getSubjectsList,
  getUnitsformSubject,
  lessonToUnitList,
} from "@/redux/reducers/subjectsReducer";
import DatePicker from "@/components/shared/MuiDatePicker";
import dayjs from "dayjs";
import { dateFormat } from "@/utils/functions";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { notify } from "../../utils/notify";
import { questionFieldToPlainLabel } from "@/utils/answerContent";

const QuestionBank = () => {
  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionsQuistions = permissionState?.permissions?.questions;

  const viewSubjects = permissionState?.permissions?.subjects?.find(
    (permission: any) => permission["view-subjects"] === "1"
  );
  const editQuistions = permissionsQuistions?.find(
    (permission: any) => permission["edit-questions"] === "1"
  );
  const deleteQuistions = permissionsQuistions?.find(
    (permission: any) => permission["delete-questions"] === "1"
  );
  const addQuistions = permissionsQuistions?.find(
    (permission: any) => permission["add-questions"] === "1"
  );
  const columns = [
    {
      name: "Question",
      selector: (row: any) => row.question,
      width: "30%",
    },
    {
      name: "Question type",
      selector: (row: any) => row.type,
      width: "30%",
    },
    {
      name: "Created at",
      selector: (row: any) => row.created_at,
      width: "30%",
    },
    editQuistions || deleteQuistions
      ? {
          name: "Action",
          selector: (row: any) => row.action,
          width: "6%",
        }
      : "",
  ];

  // ------------- hooks -------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>([]);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const questionBankState = useSelector((state: RootState) => state.questions);
  const [file, setFile] = useState<any>(null);
  const fileInput: any = useRef(null);
  const fileUploadInput: any = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<any>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const formik: any = useFormik({
    initialValues: {
      search: "",
      type: "",
      subjectId: "",
      unitId: "",
      lessonId: "",
      classId: "",
      dateFrom: null,
      dateTo: dateFormat(new Date()),
    },
    onSubmit: async (values) => {},
  });
  const [subjectList, setSubjectList] = useState<any>([]);
  const [unitList, setUnitList] = useState<any>([]);
  const [lessonList, setLessonList] = useState<any>([]);
  const [uploadType, setUploadType] = useState<"add" | "edit">("add");
  const [lastImportBrief, setLastImportBrief] = useState<{
    mode: "add" | "edit";
    msg: string;
    summary: {
      imported?: number;
      updated?: number;
      duplicates?: number;
      skipped_other?: number;
      skipped?: number;
      errors?: string[];
    };
  } | null>(null);

  // ----------- questions ------------
  const handleRowClick = (row: any) => {
    if (row?.id) {
      navigate(`/question-bank/edit/${row.id}`);
    }
  };

  const handleChangePage = async (page: number) => {
    setIsLoading(true);
    await dispatch(getQuestionList({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };

  // ------------ side effect ------------
  useEffect(() => {
    (async () => {
      try {
        const result = await dispatch(getQuestionList({ paginate: 10 }));
        console.log("Question list API response:", result);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching question list:", error);
        setIsLoading(false);
      }
      viewSubjects &&
        dispatch(getSubjectsList()).then((res: any) => {
          setSubjectList(
            res?.payload?.subjects?.map((item: any) => {
              return {
                label: item.name,
                value: item.id,
              };
            })
          );
        });
    })();
  }, [viewSubjects]);

  useEffect(() => {
    (async () => {
      if (!file) return;
      setIsUploading(true);
      setLastImportBrief(null);
      try {
        if (uploadType === "add") {
          const action = await dispatch(
            uploadQuestions({
              file,
              subject_id: formik.values.subjectId || undefined,
            })
          );
          if (uploadQuestions.fulfilled.match(action)) {
            const p = action.payload as {
              msg?: string;
              import_summary?: {
                imported?: number;
                updated?: number;
                duplicates?: number;
                skipped_other?: number;
                skipped?: number;
                errors?: string[];
              };
            };
            setLastImportBrief({
              mode: "add",
              msg: p?.msg ?? "",
              summary: p?.import_summary ?? {},
            });
          }
          await dispatch(getQuestionList({ paginate: 10 }));
        } else {
          const action = await dispatch(uploadEditedQuestions({ file }));
          if (uploadEditedQuestions.fulfilled.match(action)) {
            const p = action.payload as {
              msg?: string;
              import_summary?: {
                imported?: number;
                updated?: number;
                duplicates?: number;
                skipped_other?: number;
                skipped?: number;
                errors?: string[];
              };
            };
            setLastImportBrief({
              mode: "edit",
              msg: p?.msg ?? "",
              summary: p?.import_summary ?? {},
            });
          }
          await dispatch(getQuestionList({ paginate: 10 }));
        }
      } finally {
        setFile(null);
        setIsUploading(false);
      }
    })();
  }, [file]);

  useEffect(() => {
    const questionData = questionBankState?.questionList?.question?.data;
    console.log("Question bank state:", questionBankState);
    console.log("Question data:", questionData);
    if (questionData && Array.isArray(questionData)) {
      setRows(
        questionData.map((item: any) => {
          const plainTitle = questionFieldToPlainLabel(item?.question);
          return {
            ...item,
            question: !item?.question
              ? "File"
              : plainTitle || "—",
            created_at: item?.created_at?.split("T")[0],
            action: (
              <ActionDropdown
                id={item.id}
                actions={
                  deleteQuistions
                    ? [
                        {
                          name: "Delete",
                          action: () => {
                            setQuestionToDelete(item);
                            setDeleteModalOpen(true);
                          },
                        },
                      ]
                    : [""]
                }
              />
            ),
          };
        })
      );
    } else {
      // Set empty array if data is not available
      setRows([]);
    }
  }, [questionBankState]);

  useEffect(() => {
    if (formik.values.subjectId.toString().length) {
      dispatch(getUnitsformSubject({ id: formik.values.subjectId })).then(
        (res: any) => {
          setUnitList(
            res.payload.units.map((item: any) => {
              return {
                label: item.name,
                value: item.id,
              };
            })
          );
        }
      );
    }
  }, [formik.values.subjectId]);

  useEffect(() => {
    if (formik.values.unitId.toString().length) {
      dispatch(lessonToUnitList(formik.values.unitId)).then((res: any) => {
        setLessonList(
          res.payload.lessons.map((item: any) => {
            return {
              label: item.name,
              value: item.id,
            };
          })
        );
      });
    }
  }, [formik.values.unitId]);
  // console.log(questionBankState?.questionList?.question)
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">Question bank</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            onClick={async () => {
              window.open(
                buildTemplateUrl(process.env.REACT_APP_BASE_URL, "/Questions Bank Template.xlsx")
              );
            }}
            label="Download Template"
            className="w-30 m-3"
          />
          <Typography variant="body2" sx={{ color: "text.secondary", ml: 1, alignSelf: "center" }}>
            Using Activities template? Select a subject in the filter before uploading.
          </Typography>
        </Box>
      </Box>

      {lastImportBrief && (
        <Box sx={{ mr: 2, mb: 1 }}>
          <Alert
            severity={
              lastImportBrief.mode === "add"
                ? (lastImportBrief.summary.imported ?? 0) > 0
                  ? "success"
                  : "warning"
                : (lastImportBrief.summary.updated ?? 0) > 0
                  ? "success"
                  : "warning"
            }
            onClose={() => setLastImportBrief(null)}
          >
            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600 }}>
              {lastImportBrief.msg}
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 0.75 }}>
              {lastImportBrief.mode === "add" ? (
                <>
                  <strong>New (uploaded):</strong>{" "}
                  {lastImportBrief.summary.imported ?? 0}
                  {" · "}
                  <strong>Duplicates skipped:</strong>{" "}
                  {lastImportBrief.summary.duplicates ?? 0}
                  {" · "}
                  <strong>Other rows skipped:</strong>{" "}
                  {lastImportBrief.summary.skipped_other ?? 0}
                </>
              ) : (
                <>
                  <strong>Updated:</strong>{" "}
                  {lastImportBrief.summary.updated ?? 0}
                  {" · "}
                  <strong>Duplicates skipped:</strong>{" "}
                  {lastImportBrief.summary.duplicates ?? 0}
                  {" · "}
                  <strong>Other rows skipped:</strong>{" "}
                  {lastImportBrief.summary.skipped_other ?? 0}
                </>
              )}
            </Typography>
            {Array.isArray(lastImportBrief.summary.errors) &&
              lastImportBrief.summary.errors.length > 0 && (
                <Box
                  component="ul"
                  sx={{ mt: 1, mb: 0, pl: 2.5, fontSize: "0.8125rem" }}
                >
                  {lastImportBrief.summary.errors.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </Box>
              )}
          </Alert>
        </Box>
      )}

      <Box
        sx={{
          my: 2,
          mr: 2,
          boxShadow: "unset",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
          }}
        >
          <Searchbar />
          {!selectedRows.length ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isFiltered && (
                <Typography
                  component={"p"}
                  sx={{
                    color: "#1EBBA3",
                    fontWeight: "400",
                    mx: 4,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    formik.resetForm();
                    dispatch(
                      getQuestionList({ paginate: 10, page: currentPage })
                    );
                  }}
                >
                  Clear filters
                </Typography>
              )}
              {permissionsQuistions?.find(
                (permission: any) => permission["export-questions"] === "1"
              ) && (
                <Button
                  onClick={() => {
                    setUploadType("edit");
                    fileUploadInput?.current?.click();
                  }}
                  label="Export Updated File"
                  type="bordered"
                  className="w-30 m-3"
                />
              )}
              {addQuistions && (
                <Button
                  onClick={() => {
                    setUploadType("add");
                    fileInput?.current?.click();
                  }}
                  label="Upload Questions"
                  className="w-30 m-3"
                />
              )}
              {!isUploading && (
                <>
                  <input
                    style={{ display: "none" }}
                    ref={fileInput}
                    type="file"
                    id="file-upload-questions"
                    name="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event: any) => {
                      const fileList = event.target.files;
                      if (!fileList) return;
                      setFile(fileList[0]);
                    }}
                  />
                  <input
                    style={{ display: "none" }}
                    ref={fileUploadInput}
                    type="file"
                    id="file-export-updated"
                    name="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event: any) => {
                      const fileList = event.target.files;
                      if (!fileList) return;
                      setFile(fileList[0]);
                    }}
                  />
                </>
              )}
              <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => {
                  if (isFiltered) {
                    formik.resetForm();
                    dispatch(
                      getQuestionList({ paginate: 10, page: currentPage })
                    );
                  }
                  setIsFiltered(!isFiltered);
                }}
                className="w-30 m-3"
              />
              {isFiltered && (
                <Button
                  label="Search"
                  onClick={async () => {
                    await dispatch(
                      getQuestionList({
                        search: formik.values.search.length
                          ? formik.values.search
                          : null,
                        type: formik.values.type.length
                          ? formik.values.type
                          : null,
                        subject_id: formik.values.subjectId.toString().length
                          ? formik.values.subjectId
                          : null,
                        unit_id: formik.values.unitId.toString().length
                          ? formik.values.unitId
                          : null,
                        lesson_id: formik.values.lessonId.toString().length
                          ? formik.values.lessonId
                          : null,
                        date_from: formik.values.dateFrom
                          ? formik.values.dateFrom
                          : null,
                        date_to: formik.values.dateTo
                          ? formik.values.dateTo
                          : null,
                        paginate: 10,
                        page: currentPage,
                      })
                    );
                  }}
                />
              )}
            </Box>
          ) : (
            <div className="flex flex-row ">
              {deleteQuistions && (
                <Button
                  label="Delete"
                  type="danger"
                  onClick={() => {
                    setBulkDeleteModalOpen(true);
                  }}
                  className="w-30 m-3"
                />
              )}
            </div>
          )}
        </Box>
        <Divider />
        {isFiltered && (
          <>
            <Grid
              container
              columnGap={1}
              sx={{ bgcolor: "#F7F9FA", justifyContent: "space-between", p: 3 }}
            >
              <Grid item xs={12} sm={3.6}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Question</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="search"
                    value={formik.values.search}
                    onChange={formik.handleChange}
                    name="search"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Unit</label>

                  <SelectBox
                    values={unitList}
                    id="unitId"
                    name="unitId"
                    value={formik.values.unitId}
                    onChange={formik.handleChange}
                    styles={{ backgroundColor: "#fff" }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">To</label>
                  <DatePicker id="dateTo" formik={formik} />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.6}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Question type
                  </label>
                  <SelectBox
                    values={[
                      {
                        label: "True & False",
                        value: "TF",
                      },
                      {
                        label: "MCQ",
                        value: "MCQ",
                      },
                      {
                        label: "Short notes",
                        value: "SHN",
                      },
                      {
                        label: "Matching",
                        value: "Matching",
                      },
                    ]}
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    styles={{ backgroundColor: "#fff" }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Lesson</label>
                  <SelectBox
                    values={lessonList}
                    id="lessonId"
                    name="lessonId"
                    value={formik.values.lessonId}
                    onChange={formik.handleChange}
                    styles={{ backgroundColor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.6}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Subject</label>
                  <SelectBox
                    values={subjectList}
                    id="subjectId"
                    name="subjectId"
                    value={formik.values.subjectId}
                    onChange={formik.handleChange}
                    styles={{ backgroundColor: "#fff" }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">From</label>
                  <DatePicker id="dateFrom" formik={formik} />
                </div>
              </Grid>
            </Grid>
          </>
        )}
        <DataTable
          handleRowClick={handleRowClick}
          data={rows}
          columns={columns}
          isLoading={isLoading}
          setSelectedRows={setSelectedRows}
        />
        <Pagination
          from={+questionBankState?.questionList?.question?.from}
          to={+questionBankState?.questionList?.question?.to}
          lastPage={+questionBankState?.questionList?.question?.last_page}
          currentPage={+questionBankState?.questionList?.question?.current_page}
          total={+questionBankState?.questionList?.question?.total}
          perPage={+questionBankState?.questionList?.question?.per_page}
          handleChangePage={handleChangePage}
        />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setQuestionToDelete(null);
        }}
        item="question"
        onConfirm={async () => {
          if (questionToDelete) {
            setIsLoading(true);
            await dispatch(deleteQuestion({ id: [questionToDelete.id] }));
            await dispatch(
              getQuestionList({ paginate: 10, page: currentPage })
            );
            setIsLoading(false);
          }
        }}
      />
      <DeleteConfirmationModal
        open={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
        }}
        item="question"
        count={selectedRows.length}
        onConfirm={async () => {
          if (selectedRows.length > 0) {
            setIsLoading(true);
            await dispatch(
              deleteQuestion({
                id: selectedRows.map((item: any) => item.id),
              })
            );
            await dispatch(
              getQuestionList({ paginate: 10, page: currentPage })
            );
            setIsLoading(false);
            setSelectedRows([]);
          }
        }}
      />
    </Box>
  );
};

export default QuestionBank;
