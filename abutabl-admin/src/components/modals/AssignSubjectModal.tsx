import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import Button from "../shared/Button";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectBoxOptions } from "../../utils/functions";
import {
  getClassList,
  getCommonGradeList,
  getCommonSubjectsList,
} from "../../redux/reducers/commonReducer";

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

const AssignSubjectModal = ({ open, onClose, subject, setSubject }: any) => {
  // ----------- hooks ------------
  const dispatch = useDispatch();
  const commonState = useSelector((state: RootState) => state?.common);
  const [newSubject, setNewSubject] = useState<any>(null);

  // ------------ side effects -------------

  useEffect(() => {
    dispatch(getCommonSubjectsList());
  }, []);

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
              width: 400,
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Assign Subject
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                Subject <span className="text-red">*</span>
              </label>
              <SelectBox
                values={
                  commonState?.subjectList?.length > 0
                    ? selectBoxOptions(commonState?.subjectList, "name")
                    : []
                }
                id="subject_id"
                name="subject_id"
                value={newSubject?.subject_id}
                onChange={(e: any) => {
                  setNewSubject(e.target.value);
                }}
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
              mt: 2,
            }}
          >
            <Button
              onClick={() => {
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                setSubject((prev: any) => {
                  return [...prev, newSubject];
                });
                setNewSubject(null);
                onClose();
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

export default AssignSubjectModal;
