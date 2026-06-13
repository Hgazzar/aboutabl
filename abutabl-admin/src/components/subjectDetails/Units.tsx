import { Box, Grid, Typography, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DataTable from "../shared/DataTable";
import AddIcon from "@mui/icons-material/Add";
import ActionDropdown from "../shared/ActionDropdown";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteContent,
  deleteLesson,
  deleteUnit,
  editContentInLesson,
  getLessonDetails,
  getUnitsformSubject,
  lessonToUnitList,
  viewContent,
} from "../../redux/reducers/subjectsReducer";
import Placeholder from "../shared/Placeholder";
import AddUnitModal from "../modals/AddUnitModal";
import AddLessonModal from "../modals/AddLessonModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import AddContentModal from "../modals/AddContentModal";
import ContentStatusModal from "../modals/ContentStatusModal";
import DisplayContent from "../modals/DisplayContent";
import SwitchBox from "../shared/SwitchBox";
import { useTranslation } from "react-i18next";

const Units = () => {
  const { t } = useTranslation();
  const columns = [
    {
      name: t("fileName"),
      selector: (row: any) => row.name,
      width: "20%",
    },
    {
      name: t("type"),
      selector: (row: any) => row.type,
      width: "15%",
    },

    {
      name: t("createdAt"),
      selector: (row: any) => row.created_at,
      width: "20%",
    },
    {
      name: t("createdBy"),
      selector: (row: any) => row.createdBy,
      width: "14%",
    },
    {
      name: t("status"),
      selector: (row: any) => row.status,
    },
    {
      name: t("action"),
      selector: (row: any) => row.action,
      width: "10%",
    },
  ];
  const param = useParams();
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState({
    unitModal: false,
    lessonModal: false,
    deleteContentModal: false,
    deleteUnitModal: false,
    deleteLessonModal: false,
    contentModal: false,
    contentStatusModal: false,
    displayModal: false,
  });
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"content" | "unit" | "lesson">("content");
  const subjectUnitState = useSelector(
    (state: RootState) => state?.subjects?.units
  );
  const [lessonData, setLessonData] = useState<any>({});
  const [action, setAction] = useState<"add" | "edit">("add");
  const [selectedUnit, setSelectedUnit] = useState<any>("");
  const [selectedLesson, setSelectedLesson] = useState<any>({});
  const [lessonId, setLessonId] = useState<any>("");
  const [rows, setRows] = useState<any>([]);
  const [updateContent, setUpdateContent] = useState(false);
  const navigate = useNavigate();
  // ------------ functions --------------
  const handleOpen = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: true }));
  const handleClose = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: false }));

  const updateLessons = async (data: any) => {
    await dispatch(lessonToUnitList(data))
      .unwrap()
      .then((result: any) => {
        setLessonData(result);
      });
  };
  // ------------ side effects -------------
  useEffect(() => {
    (async () => {
      await dispatch(
        getUnitsformSubject({ data: { paginate: 10 }, id: param.id })
      );
    })();
  }, []);

  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewUnits = permissionState?.permissions?.units?.find(
    (permission: any) => permission["view-units"] === "1"
  );
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
  const addContents = permissionState?.permissions?.contents?.find(
    (permission: any) => permission["add-contents"] === "1"
  );
  const editContents = permissionState?.permissions?.contents?.find(
    (permission: any) => permission["edit-contents"] === "1"
  );
  const deleteContents = permissionState?.permissions?.contents?.find(
    (permission: any) => permission["delete-contents"] === "1"
  );

  useEffect(() => {
    if (lessonId) {
      dispatch(getLessonDetails(lessonId))
        .unwrap()
        .then((result: any) => {
          setRows(
            result?.contents?.map((item: any) => {
              const contentRowActions = [
                editContents && {
                  name: <p className="cursor-pointer">{t("edit")}</p>,
                  action: () => {
                    navigate(
                      `/subjects/Edit-content/${param.id}/${item.id}`
                    );
                  },
                },
                deleteContents && {
                  name: (
                    <p className="text-red cursor-pointer">
                      {t("delete")}
                    </p>
                  ),
                  action: () => {
                    setItemToDelete(item);
                    setDeleteType("content");
                    handleOpen("deleteContentModal");
                  },
                },
              ].filter(Boolean);
              return {
                ...item,
                status: editContents ? (
                  <SwitchBox
                    value={item.status === "1" ? true : false}
                    onChange={async () => {
                      await dispatch(viewContent(item.id))
                        .unwrap()
                        .then((result: any) => {
                          dispatch(
                            editContentInLesson({
                              data: {
                                ...result.data,
                                ...item,
                                status: item.status === "0" ? "1" : "0",
                              },
                              id: item.id,
                            })
                          ).unwrap();
                        });
                    }}
                  />
                ) : null,
                action: contentRowActions.length > 0 ? (
                  <ActionDropdown actions={contentRowActions} />
                ) : null,
              };
            })
          );
        });
    }
  }, [lessonId, updateContent, editContents, deleteContents]);

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
                {t("units")}{" "}
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

            {!subjectUnitState?.units?.length ? (
              <div className="flex flex-col gap-4 items-center justify-center w-full pb-20">
                <Placeholder name={t("units")} text={t("startCourseText")} />
              </div>
            ) : (
              subjectUnitState?.units?.map((item: any) => {
                return (
                  <div
                    onClick={() => {
                      // setSelectedUnit(item?.id);
                      dispatch(lessonToUnitList(item?.id))
                        .unwrap()
                        .then((result: any) => {
                          setLessonData(result);
                        });
                      setRows([]);
                      setLessonId("");
                    }}
                    className={`flex cursor-pointer flex-row items-center gap-3 hover:bg-lightGreen border-l-4 hover:border-green p-6 ${
                      item?.id === lessonData?.unit?.[0]?.id
                        ? "bg-lightGreen border-green"
                        : "border-white"
                    }`}
                  >
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/menu.png")}
                      alt="drag and drop icon"
                    />
                    <p>{item?.name}</p>
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
            {lessonData?.unit?.length && (
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
                    {lessonData?.unit?.[0]?.name_en}
                    <span className="bg-lightGreen text-xs text-green py-2 px-5 mx-2">
                      {lessonData?.unit?.[0]?.type}
                    </span>
                    {lessonData?.unit?.[0]?.for_teacher === "1" && (
                      <span className="bg-lightGray text-xs text-gray py-2 px-5 mx-2">
                        {t("forTeacher")}
                      </span>
                    )}
                  </Typography>

                  <ActionDropdown
                    color={"#c1c1c1"}
                    actions={[
                      editUnits && {
                        name: t("editUnitName"),
                        action: () => {
                          setAction("edit");
                          handleOpen("unitModal");
                        },
                      },
                      editUnits && {
                        name: t("changePrivacy"),
                        action: () => {
                          handleOpen("contentStatusModal");
                        },
                      },
                      deleteUnits && {
                        name: <p className="text-red">{t("deleteUnit")}</p>,
                        action: () => {
                          setItemToDelete(lessonData?.unit?.[0]);
                          setDeleteType("unit");
                          handleOpen("deleteUnitModal");
                        },
                      },
                    ].filter(Boolean)}
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
                    Lessons{" "}
                  </Typography>

                  {addLessons && (
                    <Button
                      onClick={() => {
                        setAction("add");
                        handleOpen("lessonModal");
                      }}
                      icon={AddCircleOutlineRoundedIcon}
                      label="Add Lesson"
                      type="bordered"
                      className="w-30 m-3"
                    />
                  )}
                </Box>
              </>
            )}
            {!lessonData?.lessons ? (
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
                  {lessonData?.lessons?.map((item: any) => {
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
                                editLessons && {
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
                                },
                                deleteLessons && {
                                  name: t("delete"),
                                  action: () => {
                                    setItemToDelete(item);
                                    setDeleteType("lesson");
                                    handleOpen("deleteLessonModal");
                                  },
                                },
                              ].filter(Boolean)}
                            />
                          </div>
                          <div className="lesson-card__icon rounded-md w-12 h-12 flex justify-center items-center">
                            <img
                              className="w-6 h-6"
                              src={require("../../assets/bookmark.png")}
                              alt="bookmark"
                            />
                          </div>
                          <p className="font-semibold">{item?.name}</p>
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
                        {rows.length} files
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexDirection: "row",
                        }}
                      >
                        {rows.length ? (
                          <Button
                            onClick={() => {
                              window.open(
                                `/subjects/scorm/${param.id}/${rows[0].id}`,
                                "_blank"
                              );
                            }}
                            label="View content"
                          />
                        ) : null}
                        {(addContents || editContents) && (
                          <Button
                            onClick={() => {
                              handleOpen("contentModal");
                            }}
                            icon={AddCircleOutlineRoundedIcon}
                            label="Add content"
                            type="bordered"
                          />
                        )}
                      </Box>
                    </Box>
                    <DataTable data={rows} columns={columns} />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      <AddContentModal
        open={open.contentModal}
        onClose={() => handleClose("contentModal")}
        lessonId={lessonId}
      />
      <DisplayContent
        open={open.displayModal}
        onClose={() => handleClose("displayModal")}
        content={rows}
      />

      <ContentStatusModal
        open={open.contentStatusModal}
        onClose={() => handleClose("contentStatusModal")}
        unitID={lessonData?.unit?.[0]?.id}
        updateLessons={updateLessons}
        lessonData={lessonData}
      />

      <AddUnitModal
        open={open.unitModal}
        onClose={() => handleClose("unitModal")}
        editUnitState={{
          name_en: lessonData?.unit?.[0]?.name_en || "",
          name_ar: lessonData?.unit?.[0]?.name_ar || "",
          id: lessonData?.unit?.[0]?.id,
        }}
        action={action}
      />

      <AddLessonModal
        setAction={setAction}
        open={open.lessonModal}
        onClose={() => {
          setAction("add");
          handleClose("lessonModal");
        }}
        action={action}
        unitId={lessonData?.unit?.[0]?.id}
        editLessonState={selectedLesson}
        updateLessons={updateLessons}
      />

      <DeleteConfirmationModal
        open={open.deleteContentModal}
        onClose={() => {
          handleClose("deleteContentModal");
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await dispatch(deleteContent(itemToDelete?.id))
              .unwrap()
              .then(() => {
                setUpdateContent(!updateContent);
              });
          }
        }}
        item={"Content"}
      />
      <DeleteConfirmationModal
        open={open.deleteUnitModal}
        onClose={() => {
          handleClose("deleteUnitModal");
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await dispatch(deleteUnit(itemToDelete?.id))
              .unwrap()
              .then((result: any) => {
                setLessonData({});
                dispatch(
                  getUnitsformSubject({
                    data: { paginate: 10 },
                    id: param.id,
                  })
                ).then((result: any) => {
                  if (result?.payload?.units?.length) {
                    setSelectedUnit(result?.payload?.units[0]?.id);
                  } else {
                    setSelectedUnit("");
                  }
                });
              })
              .catch((error: any) => {
                console.log(error);
              });
          }
        }}
        item={"Unit"}
      />
      <DeleteConfirmationModal
        open={open.deleteLessonModal}
        onClose={() => {
          handleClose("deleteLessonModal");
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await dispatch(deleteLesson(itemToDelete?.id));
            updateLessons(lessonData?.unit?.[0]?.id);
          }
        }}
        item={"Lesson"}
      />
    </>
  );
};

export default Units;
