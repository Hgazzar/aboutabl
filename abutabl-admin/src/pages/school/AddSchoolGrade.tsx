import { Box, Divider, TextField, Typography, fabClasses } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SwitchBox from "../../components/shared/SwitchBox";
import Placeholder from "../../components/shared/Placeholder";
import AddClassModal from "../../components/modals/AddClassToGradeModal";
import { addGrade } from "../../redux/reducers/gradeReducer";
import { useDispatch } from "react-redux";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useNavigate, useParams } from "react-router-dom";

const columns = [
  {
    name: "Class Name",
    selector: (row: any) => row.class_name,

    width: "40%",
  },
  {
    name: "Total No. of student",
    selector: (row: any) => row.class_numStudent,

    width: "40%",
  },
  {
    name: "Status",
    selector: (row: any) => row.class_status,

    width: "7%",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,

    width: "7%",
  },
];

const AddGrade = () => {
  // ------------ hooks --------------
  const [open, setOpen] = React.useState(false);
  const [addClasses, setAddClasses] = useState<any>([]);
  const navigate = useNavigate();
  const param = useParams();
  const [rows, setRows] = useState<any>([]);
  const formik = useFormik({
    initialValues: {
      name: "",
      status: true,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const dispatch = useDispatch();

  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleDeleteClass = (id: number) => {
    setAddClasses((prev: any) => {
      return prev.filter((item: any) => item.id !== id);
    });
  };
  
  const [idToEdit,setIdToEdit] = useState(null);

  const [openEdit,setOpenEdit] = useState(false)
  const [editingClass, setEditingClass] = useState(null);
  useEffect(()=>{    
    if(addClasses && addClasses.length > 0 && openEdit && idToEdit){
      const findClass = addClasses?.find((item: any) => item.id === idToEdit)
      setEditingClass(findClass)
    }
  },[openEdit,idToEdit,addClasses])

  const handleEditClass = (id: any) => {
    setIdToEdit(id)
    setOpenEdit(true)
    handleOpen();
  };

  // ------------ useEffect --------------

  useEffect(() => {
    setRows(
      addClasses?.map((item: any) => {
        return {
          ...item,
          class_status: (
            <SwitchBox
              value={item.class_status}
              onChange={async () => {
                setAddClasses((prev: any) => {
                  return prev.map((x: any) => {
                    if (x.id === item.id) {
                      return {
                        ...item,
                        class_status: !x.class_status,
                      };
                    }
                    return item;
                  });
                });
              }}
            />
          ),
        };
      })
    );
  }, [open,addClasses]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">Add Grade</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button type="bordered" label="Cancel" onClick={() => navigate(-1)} />
          <Button
            onClick={async () => {
              try {
                await dispatch(
                  addGrade({
                    ...formik.values,
                    status: formik.values.status ? 1 : 0,
                    class_name: addClasses.map((item: any) => item.class_name),
                    class_numStudent: addClasses.map(
                      (item: any) => item.class_numStudent
                    ),
                    class_status: addClasses.map((item: any) =>
                      item.class_status === true ? 1 : 0
                    ),
                    school_id: param.id,
                  })
                ).unwrap();
                formik.resetForm();
                setAddClasses([]);
                navigate(-1);
              } catch (error) {
                console.log(error);
              }
            }}
            label="Submit"
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <Box
        sx={{
          m: 4,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            component={"p"}
            sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
          >
            Basic information
          </Typography>
          <SwitchBox id={"status"} formik={formik} />
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            p: 3,
            gap: 3,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <div className="flex flex-col gap-0 mb-4">
              <label className="text-sm font-semibold mb-1">
                Grade name <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="name"
                onChange={formik.handleChange}
                value={formik.values.name}
                name="name"
                placeholder="ex [KG1]"
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          m: 4,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            component={"p"}
            sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
          >
            Classes
          </Typography>
          <Button
            type="bordered"
            label="Add new class"
            className="m-4 mr-6"
            onClick={handleOpen}
            icon={AddCircleOutlineIcon}
          />
        </Box>
        <Divider />
        {rows?.length ? (
          <>
            <DataTable data={rows} columns={columns} />
            <Pagination
              from={1}
              to={rows.length}
              lastPage={Math.ceil(rows.length / 10)}
              currentPage={1}
              total={rows.length}
              perPage={10}
            />
          </>
        ) : (
          <Placeholder name="Classes" />
        )}
      </Box>
      <AddClassModal
        addClasses={addClasses}
        setAddClasses={setAddClasses}
        open={open}
        onClose={handleClose}
        handleDeleteClass={handleDeleteClass}
        handleEditClass={handleEditClass}
        editingClass={editingClass}
        setEditingClass={setEditingClass}
      />
    </>
  );
};

export default AddGrade;
