import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import ActionDropdown from "../shared/ActionDropdown";
import { notify } from "@/utils/notify";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  addClasses: any;
  setAddClasses: any;
  handleDeleteClass?: any;
  handleEditClass?: any;
  editingClass?: any;
  setEditingClass?: any;
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

const AddClassToGradeModal = ({
  addClasses,
  setAddClasses,
  open,
  onClose,
  handleDeleteClass,
  handleEditClass,
  editingClass,
  setEditingClass
}: ModalProps) => {
  // ----------- hooks ------------
  const [newClass, setNewClass] = useState<any>({
    id: "",
    class_name: "",
    class_numStudent: null,
    class_status: true,
  });

  // ------------ side effects -------------
  useEffect(() => {
    if (editingClass) {
      setNewClass(editingClass);
    } else {
      setNewClass({
        id: "",
        class_name: "",
        class_numStudent: null,
        class_status: true,
      });
    }
  }, [editingClass,addClasses]);

  // console.log(editingClass); 
   

  const handleSave = () => {
    if (newClass.class_name?.length < 1) {
      notify("Class name must be at least 1 character", "error");
      return;
    }

    if (addClasses?.some((classItem: any) => classItem.class_name === newClass.class_name && classItem.id !== newClass.id)) {
      notify("Class name already taken", "error");
      return;
    }

    if (editingClass) {
      setAddClasses((prev: any) => {
        return prev.map((item: any) =>
          item.id === newClass.id ? newClass : item
        );
      });
    } else {
      const randomID = Math.round(Math.random() * 10000000);
      const newClassWithId = {
        ...newClass,
        class_numStudent: newClass.class_numStudent ?? 0,
        id: randomID,
        action: (
          <ActionDropdown
            actions={[
              {
                name: "Delete",
                action: () => handleDeleteClass?.(randomID),
              },
              {
                name: "Edit",
                action: () => handleEditClass?.(randomID),
              },
            ]}
          />
        ),
      };

      setAddClasses((prev: any) => {
        return [...prev, newClassWithId];
      });
    }

    setNewClass({
      id: "",
      class_name: "",
      class_numStudent: null,
      class_status: true,
    });
    setEditingClass?.(null);
    onClose();
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
            {editingClass ? "Edit Class" : "Add New Class"}
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
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
                id="class_name"
                name="class_name"
                value={newClass.class_name}
                onChange={(e: any) => {
                  setNewClass((prev: any) => {
                    return {
                      ...prev,
                      class_name: e.target.value,
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
                id="class_numStudent"
                name="class_numStudent"
                value={newClass.class_numStudent}
                onChange={(e: any) => {
                  setNewClass((prev: any) => {
                    return {
                      ...prev,
                      class_numStudent: e.target.value,
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
              label="Discard"
            />
            <Button
             onClick={handleSave}
             className="w-24"
             label="Save"
              // onClick={() =>
                //  {
                // if (newClass.class_name?.length < 3) {
                //   notify("Class name must be at least 3 characters", "error");
                //   return;
                // }
                // if (addClasses?.some((classItem:any) => classItem.class_name === newClass.class_name)) {
                //   notify("Class name already taken", "error");
                //   return;
                // }

              //   const randomID = Math.round(Math.random() * 10000000);
              //   const classes = {
              //     ...newClass,
              // class_numStudent: newClass.class_numStudent ?? 0,
              //     id: randomID,
              //     action: (
              //       <ActionDropdown
              //         actions={[
              //           {
              //             name: "Delete",
              //             action: () => handleDeleteClass(randomID),
              //           },
              //           {
              //             name: "Edit",
              //             action: () => handleEditClass(randomID),
              //           },
              //         ]}
              //       />
              //     ),
              //   };

              //   setAddClasses((prev: any) => {
              //     return [...prev, classes];
              //   });
              //   setNewClass({
              //     id: "",
              //     class_name: "",
              //     class_numStudent: null,
              //     class_status: true,
              //   });
              //   onClose();
              // }}
              // className="w-24"
              // label="Save"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddClassToGradeModal;
