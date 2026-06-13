import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "../shared/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  getCommonGradeList,
  getCommonSubjectsList,
} from "../../redux/reducers/commonReducer";
import { assignSubjectToSchool } from "../../redux/reducers/schoolReducer";
import { getSubjectsList } from "../../redux/reducers/subjectsReducer";
import { notify } from "@/utils/notify";
import SelectBox from "../shared/SelectBox";
import { selectBoxOptions } from "../../utils/functions";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  schoolID?: any;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 500,
  width: "min(100%, 500px)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const listShellSx = {
  border: "1px solid #091E4224",
  borderRadius: 1,
  maxHeight: 220,
  overflow: "auto",
  p: 0.5,
  bgcolor: "#FAFBFC",
};

const AddSubjectToSchoolModal = ({ open, onClose, schoolID }: ModalProps) => {
  const [newSubject, setNewSubject] = useState({
    subject_id: [] as number[],
    grade_id: [] as number[],
  });
  const dispatch = useDispatch();
  const commonState = useSelector((state: RootState) => state?.common);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewgrades = permissionState?.permissions?.grades?.find(
    (permission: any) => permission["view-grades"] === "1"
  );
  const viewsubjects = permissionState?.permissions?.subjects?.find(
    (permission: any) => permission["view-subjects"] === "1"
  );

  const gradeRows = useMemo(() => {
    const data = commonState?.gradeList?.data;
    if (!Array.isArray(data)) return [];
    return data.filter((item: any) => item?.id);
  }, [commonState?.gradeList?.data]);

  useEffect(() => {
    if (!open) return;
    setNewSubject({
      subject_id: [],
      grade_id: [],
    });
    if (viewsubjects) {
      dispatch(getCommonSubjectsList());
    }
    if (viewgrades && schoolID) {
      dispatch(getCommonGradeList({ paginate: 500, school_id: schoolID }));
    }
  }, [open, schoolID, viewsubjects, viewgrades, dispatch]);

  const toggleGradeId = (rawId: string | number) => {
    const id = Number(rawId);
    setNewSubject((prev) => {
      const cur = prev.grade_id;
      const has = cur.some((x) => Number(x) === id);
      const next = has ? cur.filter((x) => Number(x) !== id) : [...cur, id];
      return { ...prev, grade_id: next };
    });
  };

  const resetAndClose = () => {
    setNewSubject({
      subject_id: [],
      grade_id: [],
    });
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={resetAndClose}
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
              Add Subject
            </Typography>

            <span className="cursor-pointer" onClick={resetAndClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                Subject name <span className="text-red">*</span>
              </label>
              <SelectBox
                values={
                  commonState?.subjectList?.length > 0
                    ? selectBoxOptions(commonState?.subjectList, "name")
                    : []
                }
                id="subject_id"
                name="subject_id"
                value={newSubject.subject_id[0] ?? ""}
                onChange={(e: any) => {
                  setNewSubject((prev: any) => ({
                    ...prev,
                    subject_id: e.target.value ? [e.target.value] : [],
                  }));
                }}
              />
            </div>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                Assign to grade
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                Optional — select grades to link with the chosen subject
              </Typography>
              <Box sx={listShellSx}>
                {gradeRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                    No grades available
                  </Typography>
                ) : (
                  gradeRows.map((item: any) => {
                    const checked = newSubject.grade_id.some(
                      (x) => Number(x) === Number(item.id)
                    );
                    return (
                      <FormControlLabel
                        key={item.id}
                        sx={{
                          display: "flex",
                          ml: 0,
                          mr: 0,
                          py: 0.25,
                          px: 0.5,
                          borderRadius: 0.5,
                          "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                        }}
                        control={
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => toggleGradeId(item.id)}
                            color="primary"
                          />
                        }
                        label={item.name}
                      />
                    );
                  })
                )}
              </Box>
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
              mt: 2,
            }}
          >
            <Button
              onClick={resetAndClose}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                if (!newSubject.subject_id.length) {
                  notify("Please select at least one subject", "error");
                  return;
                }
                const data: {
                  subject_id: number[];
                  status: number[];
                  grade_id?: number[];
                } = {
                  subject_id: newSubject.subject_id,
                  status: newSubject.subject_id.map(() => 1),
                };
                if (newSubject.grade_id.length > 0) {
                  data.grade_id = newSubject.grade_id;
                }

                await dispatch(
                  assignSubjectToSchool({ id: schoolID, data })
                )
                  .unwrap()
                  .then(() => {
                    setNewSubject({
                      subject_id: [],
                      grade_id: [],
                    });
                    dispatch(
                      getSubjectsList({ paginate: 10, school_id: schoolID })
                    );
                  })
                  .then(() => {
                    onClose();
                  })
                  .catch(() => {});
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

export default AddSubjectToSchoolModal;
