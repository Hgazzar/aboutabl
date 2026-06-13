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
  getCommonClassList,
  getCommonGradeList,
} from "../../redux/reducers/commonReducer";
import { useParams } from "react-router-dom";
import { assignGradeToEmployee } from "../../redux/reducers/employeeReducer";

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

const AssignClassModal = ({
  open,
  onClose,
  employeeId,
  schoolId,
  setClasses,
  grades,
  setGrades,
}: any) => {
  // ----------- hooks ------------
  const dispatch = useDispatch();
  const commonState = useSelector((state: RootState) => state?.common);
  const [newGrade, setNewGrade] = useState<any>(null);
  const [newClass, setNewClass] = useState<any>(null);
  const param = useParams();
  const [classesList, setClassesList] = useState<any>([]);

  // ------------ side effects -------------

  useEffect(() => {
    dispatch(getCommonGradeList({ school_id: schoolId }));
  }, []);

  useEffect(() => {
    dispatch(getCommonClassList({ grade_id: newGrade })).then((res: any) => {
      setClassesList(res?.payload?.classes);
    });
  }, [newGrade]);  

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
              Assign class
            </Typography>

            <span className="cursor-pointer" onClick={()=>{
              setNewClass(null);
              setNewGrade(null);
              onClose()
            }}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                Grade <span className="text-red">*</span>
              </label>
              <SelectBox
                values={
                  commonState?.gradeList?.length > 0
                    ? selectBoxOptions(commonState?.gradeList, "name")
                    : []
                }
                id="grade_id"
                name="grade_id"
                value={newGrade}
                onChange={(e: any) => {
                  setNewGrade([e.target.value]);
                }}
              />
            </div>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">class</label>
              <SelectBox
                values={
                  classesList?.length > 0
                    ? selectBoxOptions(classesList, "name")
                    : []
                }
                id="class_id"
                name="class_id"
                value={newClass}
                onChange={(e: any) => {
                  setNewClass([e.target.value]);
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
                setNewClass(null);
                setNewGrade(null);
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                setClasses((prev: any) => {
                  return [...prev, newClass];
                });
                setGrades((prev: any) => {
                  return [...prev, newGrade];
                });
               await dispatch(
                  assignGradeToEmployee({
                    id: employeeId,
                    data: {
                      school_id: schoolId,
                      grade_id: newGrade,
                      class_id: newClass,
                    },
                  })
                );
                await dispatch(getClassList({ teacher_id: employeeId }));
                setNewClass(null);
                setNewGrade(null);
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

export default AssignClassModal;
