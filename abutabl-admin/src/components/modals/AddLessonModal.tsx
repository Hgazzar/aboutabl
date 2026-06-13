import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  addLessonToActivity,
  addLessonToUnit,
  editLessonInActivity,
  editLessonToUnit,
  getActivityLessons,
  getUnitsformSubject,
} from "../../redux/reducers/subjectsReducer";
import { t } from "i18next";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  editLessonState?: any;
  action: "add" | "edit";
  unitId?: string | number;
  updateLessons: (data: any) => any;
}

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

const AddLessonModal = ({
  open,
  onClose,
  editLessonState,
  action,
  unitId,
  updateLessons,
  type,
  setLessonData,
}: any) => {
  // ----------- hooks ------------
  const [newLesson, setNewLesson] = useState<any>({
    name_en: "",
    name_ar: "",
    status: 1,
  });
  const dispatch = useDispatch();
  const param = useParams();

  // ------------ side effects -------------
  useEffect(() => {
    if (action === "edit") {
      setNewLesson(editLessonState);
    } else {
      setNewLesson({
        name_en: "",
        name_ar: "",
        status: 1,
      });
    }
  }, [action]);

  const [disable, setDisable] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
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
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              {action === "add" ? t("lessonsAdd.AddNew") : t("lessonsAdd.Edit")}
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                {t("lessonsAdd.LessonNameEn")}{" "}
                <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name_en"
                name="name_en"
                value={newLesson?.name_en}
                onChange={(e: any) => {
                  setNewLesson((prev: any) => {
                    return {
                      ...prev,
                      name_en: e.target.value,
                    };
                  });
                }}
                placeholder="ex (1/1)"
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                {t("lessonsAdd.LessonNameAr")}{" "}
                <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name_ar"
                name="name_ar"
                value={newLesson?.name_ar}
                onChange={(e: any) => {
                  setNewLesson((prev: any) => {
                    return {
                      ...prev,
                      name_ar: e.target.value,
                    };
                  });
                }}
                placeholder="ex (10)"
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
          </Box>

          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              color: "#1F1E1E",
              gap: 3,
              mb: 2,
              mt: 4,
            }}
          >
            <Button
              onClick={() => {
                onClose();
              }}
              className="w-24"
              type="bordered"
              label={t("activity.discard")}
            />
            <Button
              onClick={async () => {
                try {
                  setDisable(true);
                  if (action === "add") {
                    if (type === "activity") {
                      await dispatch(
                        addLessonToActivity({
                          ...newLesson,
                          subject_activity_id: unitId,
                        })
                      ).unwrap();
                    } else {
                      await dispatch(
                        addLessonToUnit({
                          ...newLesson,
                          subject_id: param?.id,
                          unit_id: unitId,
                        })
                      ).unwrap();
                      updateLessons(unitId);
                    }
                    setNewLesson({
                      name_en: "",
                      name_ar: "",
                      status: 1,
                    });
                    setDisable(false);
                  } else {
                    setDisable(true);
                    const data = { ...newLesson };
                    // delete data?.id;
                    if (type === "activity") {
                      await dispatch(
                        editLessonInActivity({
                          ...data,
                          subject_activity_id: unitId,
                          id: data?.id,
                        })
                      );
                    } else {
                      await dispatch(
                        editLessonToUnit({
                          data,
                          id: newLesson?.id,
                        })
                      ).unwrap();
                      updateLessons(unitId);
                    }
                    setNewLesson({
                      name_en: "",
                      name_ar: "",
                      status: 1,
                    });
                    setDisable(false);
                  }
                  if (type === "activity") {
                    dispatch(getActivityLessons({ id: unitId }))
                      .unwrap()
                      .then((result: any) => {
                        setLessonData(result);
                      });
                  } else {
                    await dispatch(
                      getUnitsformSubject({
                        data: { paginate: 10 },
                        id: param.id,
                      })
                    );
                  }
                  setDisable(false);
                  onClose();
                } catch (error) {
                  setDisable(false);
                  console.log(error);
                }
              }}
              className="w-24"
              label={t("activity.save")}
              disabled={disable}
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddLessonModal;
