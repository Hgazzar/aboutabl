import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import ActionDropdown from "../shared/ActionDropdown";
import SwitchBox from "../shared/SwitchBox";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getRoleList } from "../../redux/reducers/roleReducer";
import { selectBoxOptions } from "../../utils/functions";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { canOnlyAddTeachers, getTeacherRoleId } from "../../utils/permissionHelpers";

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
  width: 500,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const AddEmployeeToSchool = ({ open, onClose, schoolID }: ModalProps) => {
  // ----------- hooks ------------
  const [role, setRole] = useState<any>(null);
  const dispatch = useDispatch();
  const commonState = useSelector((state: RootState) => state?.common);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const roleListFromRoles = useSelector((state: RootState) => state.roles?.roleList);
  const roleList = commonState?.roleList ?? roleListFromRoles;
  const hideRoleDdl = canOnlyAddTeachers(permissionState);
  const teacherRoleId = getTeacherRoleId(roleList);
  const navigate = useNavigate();
  const param = useParams();

  // ------------ side effects -------------

  useEffect(() => {
    dispatch(getRoleList());
  }, []);

  const handleSave = () => {
    const roleIdToPass = hideRoleDdl ? teacherRoleId : role;
    const state = { role_id: roleIdToPass };
    onClose();
    navigate(
      `/school/add-employee/${param?.id ? param?.id : schoolID}`,
      { state }
    );
  };

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
              Add Employee
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          {!hideRoleDdl && (
            <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
              <div className="flex flex-col gap-0 my-4 w-full">
                <label className="text-sm font-semibold mb-1">
                  Role <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.roleList?.roles?.length > 0
                      ? selectBoxOptions(commonState?.roleList?.roles, "name")
                      : []
                  }
                  id="role_id"
                  name="role_id"
                  value={role}
                  onChange={(e: any) => {
                    setRole(e.target.value);
                  }}
                />
              </div>
            </Box>
          )}
          {hideRoleDdl && (
            <Box sx={{ my: 2 }}>
              <Typography component="p" sx={{ fontSize: "14px", color: "text.secondary" }}>
                Role: Teacher
              </Typography>
            </Box>
          )}

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
              onClick={handleSave}
              className="w-24"
              label="Save"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddEmployeeToSchool;
