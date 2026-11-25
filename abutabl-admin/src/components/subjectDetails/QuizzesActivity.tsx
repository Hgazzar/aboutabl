import { Box, Grid, Typography, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DataTable from "../shared/DataTable";
import AddIcon from "@mui/icons-material/Add";
import ActionDropdown from "../shared/ActionDropdown";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteContent,
  getActivities,
  getActivityLessons,
  getActivityLessonDetails,
  deleteActivity,
  deleteLessonActivity,
  changeQuizStatus,
  updateQuizListFields,
} from "../../redux/reducers/subjectsReducer";
import Placeholder from "../shared/Placeholder";
import AddLessonModal from "../modals/AddLessonModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import ContentStatusModal from "../modals/ContentStatusModal";
import DisplayContent from "../modals/DisplayContent";
import SwitchBox from "../shared/SwitchBox";
import { useTranslation } from "react-i18next";
import AddActivityModal from "../modals/AddActivityModal";
import Cookies from "js-cookie";
import Pagination from "../shared/Pagination";
import QuizWorkbookImportPage from "../../pages/subjects/QuizWorkbookImportPage";
import { isAdminUser } from "../../utils/authSession";

const QuizzesActivity = () => {
  const handleChangePage = async (page: number) => {
    await dispatch(getActivityLessonDetails({ paginate: 10, page }));
  };
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.login?.user);
  const showScoreToPass = isAdminUser(user as Record<string, unknown> | null | undefined);
  const saveFieldRef = React.useRef<
    (id: number, patch: { score_to_pass?: string; code?: string }) => Promise<void>
  >(async () => {});
  const columns = [
    {
      name: t("fileName"),
      selector: (row: any) =>
        lang === "en"
          ? row.title_en ?? row.title_ar
          : row.title_ar ?? row.title_en,
      width: "20%",
    },
    ...(showScoreToPass
      ? [
          {
            name: t("scoretopass"),
            width: "15%",
            cell: (row: any) => (
              <input
                type="number"
                min={0}
                data-testid="quiz-score-to-pass"
                defaultValue={row.score_to_pass ?? 0}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onBlur={(event) => {
                  const next = event.target.value;
                  if (String(row.score_to_pass ?? "") === next) return;
                  saveFieldRef.current(row.id, { score_to_pass: next });
                }}
                style={{ width: "100%", border: "1px solid #091E4224", borderRadius: 4, padding: "6px 8px" }}
              />
            ),
          },
        ]
      : []),

    {
      name: t("createdAt"),
      selector: (row: any) => row.created_at,
      width: "20%",
    },
    {
      name: t("code"),
      width: "14%",
      cell: (row: any) => (
        <input
          type="text"
          maxLength={255}
          defaultValue={row.code ?? ""}
          placeholder="code"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onBlur={(event) => {
            const next = event.target.value;
            if (String(row.code ?? "") === next) return;
            saveFieldRef.current(row.id, { code: next });
          }}
          style={{ width: "100%", border: "1px solid #091E4224", borderRadius: 4, padding: "6px 8px" }}
        />
      ),
    },
    {
      name: t("status"),
      selector: (row: any) => row.status,
    },
    // {
    //   name: t("action"),
    //   selector: (row: any) => row.action,
    //   width: "10%",
    // },
  ];
  const param = useParams();
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState({
    unitModal: false,
    lessonModal: false,
    deleteContentModal: false,
    deleteActivityModal: false,
    deleteLessonActivityModal: false,
    contentModal: false,
    contentStatusModal: false,
    displayModal: false,
  });

  const subjectActivityState = useSelector(
    (state: RootState) => state?.subjects?.activities
  );
  const [lessonData, setLessonData] = useState<any>({});
  const [action, setAction] = useState<"add" | "edit">("add");
  const [activityId, setActivityId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState<any>({});
  const [lessonId, setLessonId] = useState<any>("");
  const [rows, setRows] = useState<any>([]);
  saveFieldRef.current = async (id, patch) => {
    try {
      const result = await dispatch(updateQuizListFields({ id, ...patch })).unwrap();
      const saved = result?.quiz ?? result?.data?.quiz;
      setRows((current: any[]) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                score_to_pass: saved?.score_to_pass ?? patch.score_to_pass ?? item.score_to_pass,
                code: saved?.code ?? (patch.code === "" ? null : patch.code ?? item.code),
              }
            : item
        )
      );
    } catch (error) {
      return;
    }
  };
  const [updateContent, setUpdateContent] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);
  const [lessonActivityToDelete, setLessonActivityToDelete] = useState<any>(null);
  const navigate = useNavigate();
  // ------------ functions --------------
  const handleOpen = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: true }));
  const handleClose = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: false }));

  const updateLessons = async (data: any) => {
    if (lessonId) {
      dispatch(
        getActivityLessonDetails({ id: lessonId, paginate: 10, page: 1 })
      )
        .unwrap()
        .then((result: any) => {
          result?.quizzes &&
            setRows(
              result?.quizzes?.map((item: any) => {
                return {
                  ...item,
                  status: (
                    <SwitchBox
                      value={(item.status_raw == 1 || item.status !== "In-active") ? 1 : 0}
                      onChange={async () => {
                        try {
                          await dispatch(changeQuizStatus(item.id)).unwrap();
                          setUpdateContent((current) => !current);
                        } catch (error) {
                          return;
                        }
                      }}
                    />
                  ),
                  // action: (
                  //   <ActionDropdown
                  //     actions={[
                  //       {
                  //         name: <p className="cursor-pointer">{t("edit")}</p>,
                  //         action: () => {
                  //           navigate(
                  //             `/subjects/Edit-content/${param.id}/${item.id}`
                  //           );
                  //         },
                  //       },
                  //       {
                  //         name: (
                  //           <p className="text-red cursor-pointer">
                  //             {t("delete")}
                  //           </p>
                  //         ),
                  //         action: async () => {
                  //           await dispatch(deleteContent(item?.id))
                  //             .unwrap()
                  //             .then(() => {
                  //               setUpdateContent(!updateContent);
                  //             });
                  //         },
                  //       },
                  //     ]}
                  //   />
                  // ),
                };
              })
            );
        });
    }
  };
  // ------------ side effects -------------

  useEffect(() => {
    (async () => {
      await dispatch(getActivities({ type: "quizzes" }));
    })();
  }, []);

  useEffect(() => {
    if (lessonId) {
      dispatch(
        getActivityLessonDetails({ id: lessonId, paginate: 10, page: 1 })
      )
        .unwrap()
        .then((result: any) => {
          result?.quizzes &&
            setRows(
              result?.quizzes?.map((item: any) => {
                return {
                  ...item,
                  status: (
                    <SwitchBox
                      value={(item.status_raw == 1 || item.status !== "In-active") ? 1 : 0}
                      onChange={async () => {
                        try {
                          await dispatch(changeQuizStatus(item.id)).unwrap();
                          setUpdateContent((current) => !current);
                        } catch (error) {
                          return;
                        }
                      }}
                    />
                  ),
                  // action: (
                  //   <ActionDropdown
                  //     actions={[
                  //       {
                  //         name: <p className="cursor-pointer">{t("edit")}</p>,
                  //         action: () => {
                  //           navigate(
                  //             `/subjects/Edit-content/${param.id}/${item.id}`
                  //           );
                  //         },
                  //       },
                  //       {
                  //         name: (
                  //           <p className="text-red cursor-pointer">
                  //             {t("delete")}
                  //           </p>
                  //         ),
                  //         action: async () => {
                  //           await dispatch(deleteContent(item?.id))
                  //             .unwrap()
                  //             .then(() => {
                  //               setUpdateContent(!updateContent);
                  //             });
                  //         },
                  //       },
                  //     ]}
                  //   />
                  // ),
                };
              })
            );
        });
    }
  }, [lessonId, updateContent]);

  const permissionState = useSelector((state: RootState) => state.permissions);
  const addUnits = permissionState?.permissions?.units?.find(
    (permission: any) => permission["add-units"] === "1"
  );
  const editUnits = permissionState?.permissions?.units?.find(
    (permission: any) => permission["edit-units"] === "1"
  );
  const deleteUnits = permissionState?.permissions?.units?.find(
    (permission: any) => permission["delete-units"] === "1"
  );
  const addLessons = permissionState?.permissions?.lessons?.find(
    (permission: any) => permission["add-lessons"] === "1"
  );
  const editLessons = permissionState?.permissions?.lessons?.find(
    (permission: any) => permission["edit-lessons"] === "1"
  );
  const deleteLessons = permissionState?.permissions?.lessons?.find(
    (permission: any) => permission["delete-lessons"] === "1"
  );
  const addquizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["add-quizes"] === "1"
  );
  const viewquizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["view-quizes"] === "1"
  );

  const handleRowClick = (row: any) => {
    viewquizes && navigate(`/subjects/quiz/${row.id}`);
  };

  return (
    <>
      <Grid container sx={{ my: 1 }} spacing={2}>
        <Grid
          item
          xs={11}
          md={3.8}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                p: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                component={"p"}
                sx={{ fontSize: "18px", fontWeight: "600" }}
              >
                {t("activities")}{" "}
              </Typography>
              {addUnits && (
                <Button
                  onClick={() => {
                    setAction("add");
                    handleOpen("unitModal");
                  }}
                  icon={AddIcon}
                  className="w-10 h-10 flex justify-center item-center"
                />
              )}
            </Box>
            <Divider />

            {!subjectActivityState?.length ||
            !subjectActivityState?.some(
              // @ts-ignore
              (item: any) => +item.subject_id === +param.id
            ) ? (
              <div className="flex flex-col gap-4 items-center justify-center w-full pb-20">
                <Placeholder name={t("quizzes")} text={t("startCourseText")} />
              </div>
            ) : (
              subjectActivityState?.map((item: any) => {
                // @ts-ignore
                if (+item.subject_id !== +param.id) return null;
                return (
                  <div
                    key={item?.id}
                    onClick={() => {
                      dispatch(getActivityLessons({ id: item?.id }))
                        .unwrap()
                        .then((result: any) => {
                          setLessonData(result);
                        });
                      setRows([]);
                      setLessonId("");
                      setActivityId(item?.id);
                    }}
                    className={`flex cursor-pointer flex-row items-center gap-3 hover:bg-lightGreen border-l-4 hover:border-green p-6 ${
                      item?.id === lessonData?.subject_activity?.id
                        ? "bg-lightGreen border-green"
                        : "border-white"
                    }`}
                  >
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/menu.png")}
                      alt="drag and drop icon"
                    />
                    <p>{lang === "en" ? item?.name_en : item?.name_ar}</p>
                  </div>
                );
              })
            )}
          </Box>
        </Grid>
        <Grid
          item
          xs={11}
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}>
            {lessonData?.lessons && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    p: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    component={"p"}
                    sx={{ fontSize: "18px", fontWeight: "600" }}
                  >
                    {lang === "en"
                      ? lessonData?.subject_activity?.name_en
                      : lessonData?.subject_activity?.name_ar}
                    <span className="bg-lightGreen text-xs text-green py-2 px-5 mx-2">
                      {lessonData?.subject_activity?.type}
                    </span>
                    {lessonData?.subject_activity?.for_teacher === "1" && (
                      <span className="bg-lightGray text-xs text-gray py-2 px-5 mx-2">
                        {t("forTeacher")}
                      </span>
                    )}
                  </Typography>

                  <ActionDropdown
                    color={"#c1c1c1"}
                    actions={[
                      editUnits
                        ? {
                            name: t("editActivityName"),
                            action: () => {
                              setAction("edit");
                              handleOpen("unitModal");
                            },
                          }
                        : "",
                      deleteUnits
                        ? {
                            name: (
                              <p className="text-red">{t("deleteActivity")}</p>
                            ),
                            action: () => {
                              setActivityToDelete(lessonData?.subject_activity);
                              handleOpen("deleteActivityModal");
                            },
                          }
                        : "",
                    ]}
                  />
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    p: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ fontSize: "18px", fontWeight: "300" }}>
                    {t("lessons")}{" "}
                  </Typography>

                  {addLessons && (
                    <Button
                      onClick={() => {
                        setAction("add");
                        handleOpen("lessonModal");
                      }}
                      icon={AddCircleOutlineRoundedIcon}
                      label={t("lessonsAdd.addLesson")}
                      type="bordered"
                      className="w-30 m-3"
                    />
                  )}
                </Box>
              </>
            )}
            {!lessonData?.lessons?.length ? (
              <div className="flex flex-col gap-4 items-center justify-center w-full pb-20">
                <Placeholder name={t("items")} text={t("startCourseText")} />
              </div>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    p: 2,
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {lessonData?.lessons?.length &&
                    lessonData?.lessons?.map((item: any) => {
                      return (
                        <>
                          <div
                            onClick={() => setLessonId(item?.id)}
                            className={`lesson-card relative border p-5 rounded-lg w-44 cursor-pointer hover:border-green hover:bg-lightGreen flex flex-col items-start gap-2 ${
                              lessonId === item?.id
                                ? "bg-lightGreen border-green"
                                : " border-lightGray"
                            }`}
                          >
                            <div className="absolute right-3 top-3">
                              <ActionDropdown
                                color={"#c1c1c1"}
                                id={item.id}
                                actions={[
                                  editLessons
                                    ? {
                                        name: t("edit"),
                                        action: () => {
                                          setAction("edit");
                                          setSelectedLesson({
                                            id: item?.id,
                                            name_en: item?.name_en,
                                            name_ar: item?.name_ar,
                                            status: 1,
                                          });
                                          handleOpen("lessonModal");
                                        },
                                      }
                                    : "",
                                  deleteLessons
                                    ? {
                                        name: t("delete"),
                                        action: () => {
                                          setLessonActivityToDelete(item);
                                          handleOpen("deleteLessonActivityModal");
                                        },
                                      }
                                    : "",
                                ]}
                              />
                            </div>
                            <div className="lesson-card__icon rounded-md w-12 h-12 flex justify-center items-center">
                              <img
                                className="w-6 h-6"
                                src={require("../../assets/bookmark.png")}
                                alt="bookmark"
                              />
                            </div>
                            <p className="font-semibold">
                              {lang === "en" ? item?.name_en : item?.name_ar}
                            </p>
                            <p className="text-gray">{item?.files_count}</p>
                          </div>
                        </>
                      );
                    })}
                </Box>
                <Divider sx={{ mx: 4 }} />
                {lessonId && (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        p: 2,
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        component={"p"}
                        sx={{ fontSize: "16px", fontWeight: "600" }}
                      >
                        {rows?.length} files
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexDirection: "row",
                        }}
                      >
                        {addquizes && (
                          <Button
                            label={t("addquiz")}
                            className="w-30 m-3"
                            onClick={() =>
                              navigate(
                                `/subjects/${param.id}/add-quiz${lessonId ? `?activity_lesson_id=${lessonId}` : ""}`
                              )
                            }
                          />
                        )}
                      </Box>
                    </Box>
                    <QuizWorkbookImportPage
                      activityLessonId={Number(lessonId)}
                      onCommitted={() => updateLessons(lessonData)}
                    />
                    <DataTable
                      data={rows}
                      columns={columns}
                      handleRowClick={handleRowClick}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
      <DisplayContent
        open={open.displayModal}
        onClose={() => handleClose("displayModal")}
        content={rows}
      />

      <ContentStatusModal
        open={open.contentStatusModal}
        onClose={() => handleClose("contentStatusModal")}
        unitID={lessonData}
        updateLessons={updateLessons}
        lessonData={lessonData}
      />

      <AddActivityModal
        open={open.unitModal}
        onClose={() => handleClose("unitModal")}
        type="quizzes"
        activityId={activityId}
        action={action}
        editActivityState={{
          name_en: lessonData?.subject_activity?.name_en || "",
          name_ar: lessonData?.subject_activity?.name_ar || "",
        }}
      />

      <AddLessonModal
        setAction={setAction}
        open={open.lessonModal}
        onClose={() => {
          setAction("add");
          handleClose("lessonModal");
        }}
        action={action}
        unitId={lessonData?.subject_activity?.id}
        editLessonState={selectedLesson}
        updateLessons={updateLessons}
        type={"activity"}
        setLessonData={setLessonData}
      />

      <DeleteConfirmationModal
        open={open.deleteContentModal}
        onClose={() => handleClose("deleteContentModal")}
        onConfirm={() => {}}
        item={"Content"}
      />
      <DeleteConfirmationModal
        open={open.deleteActivityModal}
        onClose={() => {
          handleClose("deleteActivityModal");
          setActivityToDelete(null);
        }}
        onConfirm={async () => {
          if (activityToDelete) {
            await dispatch(deleteActivity(activityToDelete?.id))
              .unwrap()
              .then((result: any) => {
                setLessonData({});
                dispatch(getActivities({ type: "quizzes" }));
              })
              .catch((error: any) => {
                console.log(error);
              });
          }
        }}
        item={"Activity"}
      />
      <DeleteConfirmationModal
        open={open.deleteLessonActivityModal}
        onClose={() => {
          handleClose("deleteLessonActivityModal");
          setLessonActivityToDelete(null);
        }}
        onConfirm={async () => {
          if (lessonActivityToDelete) {
            await dispatch(deleteLessonActivity(lessonActivityToDelete?.id));
            updateLessons(lessonData);
          }
        }}
        item={"Lesson"}
      />
      {rows?.quizzes?.length >= 10 && (
        <Pagination
          from={rows?.quizzes?.from}
          to={rows?.quizzes?.to}
          lastPage={rows?.quizzes?.last_page}
          currentPage={rows?.quizzes?.current_page}
          total={rows?.quizzes?.total}
          perPage={rows?.quizzes?.per_page}
          handleChangePage={handleChangePage}
        />
      )}
    </>
  );
};

export default QuizzesActivity;
