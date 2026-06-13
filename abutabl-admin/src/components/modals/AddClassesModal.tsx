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
import { useDispatch } from "react-redux";
import {
  addClass,
  editClass,
  getClassList,
} from "../../redux/reducers/classesReducer";
import { useParams } from "react-router-dom";
import { notify } from "../../utils/notify";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  editClassState: any;
  action: "add" | "edit";
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

const AddClassModal = ({
  open,
  onClose,
  editClassState,
  action,
}: ModalProps) => {
  // ----------- hooks ------------
  const [newClass, setNewClass] = useState<any>({
    id : '',
    name: "",
    num_students: null,
    status: 1,
  });
  const dispatch = useDispatch();
  const param = useParams();

  // ------------ side effects -------------
  useEffect(() => {
    if (action === "edit") {
      setNewClass(editClassState);
    }
  }, [action,editClassState]);

  // console.log(editClassState);
  

  
  
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
              {action === "add" ? "Add New" : "Edit"} class
            </Typography>

            <span className="cursor-pointer" onClick={()=>{
                    onClose();
                    // if(action === "add"){
                    // }
                      setNewClass({
                          name: "",
                          num_students: null,
                          status: 1,
                        });
                      }}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                Class name <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name"
                name="name"
                value={newClass.name}
                onChange={(e: any) => {
                  setNewClass((prev: any) => {
                    return {
                      ...prev,
                      name: e.target.value,
                    };
                  });
                }}
                placeholder="ex (1/1)"
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                No of students
              </label>
              <TextField
                margin="normal"
                fullWidth
                size="small"
                id="num_students"
                name="num_students"
                value={newClass.num_students}
                onChange={(e: any) => {
                  setNewClass((prev: any) => {
                    return {
                      ...prev,
                      num_students: e.target.value,
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
                // if(action === "add"){
                // }
                  setNewClass({
                      name: "",
                      num_students: null,
                      status: 1,
                    });
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                try {
                  if (newClass.name) {
                    if (action === "add") {
                      await dispatch(
                        addClass({ ...newClass, grade_id: param.id })
                      ).unwrap();
                      setNewClass({
                        name: "",
                        num_students: null,
                        status: 1,
                      });
                    } else {
                      await dispatch(
                        editClass({
                          data: { ...newClass, grade_id: param.id },
                          id: newClass.id,
                          // id: param.id,
                        })
                      ).unwrap();
                    }
                    await dispatch(
                      getClassList({ paginate: 10, id: param.id })
                    );
                    onClose();
                  } else {
                    notify("Please fill required fields", "error");
                  }
                } catch (error) {
                  console.log(error);
                }
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

export default AddClassModal;
