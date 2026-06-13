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
// import { useParams } from "react-router-dom";
import { getCommonSchoolList } from "../../redux/reducers/commonReducer";
import { assignSchoolToEmployee } from "../../redux/reducers/employeeReducer";
import { getSchoolList } from "../../redux/reducers/schoolReducer";

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

const AssignSchoolToEmployeeModal = ({ open, onClose, userId }: any) => {
  // ----------- hooks ------------
  const dispatch = useDispatch();
  const schoolList = useSelector(
    (state: RootState) => state?.common?.schoolList?.schools
  );
  // const param = useParams();
  const [newSchool, setNewSchool] = useState<any>([]);

  // ------------ side effects -------------

  useEffect(() => {
    dispatch(getCommonSchoolList());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
// console.log(newSchool);  

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
              Assign School
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="flex flex-col gap-0 w-full">
              <label className="text-sm font-semibold mb-1">
                School name <span className="text-red">*</span>
              </label>
              <SelectBox
                multiple={true}
                values={
                  schoolList?.length > 0
                    ? selectBoxOptions(schoolList, "name")
                    : []
                }
                id="school_id"
                name="school_id"
                value={newSchool}
                onChange={(e: any) => {
                  setNewSchool(e.target.value);
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
                await dispatch(
                  assignSchoolToEmployee({
                    id: userId,
                    data: {
                      school_id: newSchool,
                      _method: "PUT",
                    },
                  })
                );
                await dispatch(
                  getSchoolList({ paginate: 10, page: 1, user_id: userId })
                );
                setNewSchool([]);
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

export default AssignSchoolToEmployeeModal;
