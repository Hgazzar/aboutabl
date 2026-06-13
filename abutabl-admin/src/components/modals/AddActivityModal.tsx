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
  addActivityToSubject,
  editActivityToSubject,
  getActivities,
} from "../../redux/reducers/subjectsReducer";
import { useTranslation } from "react-i18next";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  editUnitState?: any;
  action: "add" | "edit";
  type: string;
  activityId: number | null;
  editActivityState?: any;
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

const AddActivityModal = ({
  open,
  onClose,
  editUnitState,
  action,
  type,
  activityId,
  editActivityState,
}: ModalProps) => {
  const { t } = useTranslation();

  // ----------- hooks ------------
  const [newUnit, setNewUnit] = useState<any>({
    name_en: "",
    name_ar: "",
    id: "",
    type: "",
  });
  const dispatch = useDispatch();
  const param = useParams();

  // ------------ side effects -------------
  useEffect(() => {
    if (action === "edit") {
      setNewUnit(editActivityState);
    } else {
      setNewUnit({
        name_en: "",
        name_ar: "",
        type: "",
      });
    }
  }, [action, editActivityState]);

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
              {action === "add"
                ? t("activity.addNewActivity")
                : t("activity.editActivity")}
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                {t("activity.activityNameEnglish")}{" "}
                <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name_en"
                name="name_en"
                value={newUnit?.name_en}
                onChange={(e: any) => {
                  setNewUnit((prev: any) => {
                    return {
                      ...prev,
                      name_en: e.target.value,
                    };
                  });
                }}
                placeholder={t("activity.englishPlaceholder")}
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                {t("activity.activityNameArabic")}{" "}
                <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name_ar"
                name="name_ar"
                value={newUnit?.name_ar}
                onChange={(e: any) => {
                  setNewUnit((prev: any) => {
                    return {
                      ...prev,
                      name_ar: e.target.value,
                    };
                  });
                }}
                placeholder={t("activity.arabicPlaceholder")}
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
                // setNewUnit({
                //   name_en: "",
                //   name_ar: "",
                // });
                onClose();
              }}
              className="w-24"
              type="bordered"
              label={t("modalUnit.discard")}
            />
            <Button
              onClick={async () => {
                try {
                  if (action === "add") {
                    await dispatch(
                      addActivityToSubject({
                        ...newUnit,
                        subject_id: param.id,
                        type,
                      })
                    ).unwrap();
                    setNewUnit({
                      name_en: "",
                      name_ar: "",
                      type: "",
                    });
                  } else {
                    await dispatch(
                      editActivityToSubject({
                        data: { ...newUnit, subject_id: param.id, type },
                        id: activityId,
                      })
                    ).unwrap();
                  }
                  await dispatch(getActivities({ type: type }));
                  onClose();
                } catch (error) {
                  console.log(error);
                }
              }}
              className="w-24"
              label={t("modalUnit.save")}
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddActivityModal;
