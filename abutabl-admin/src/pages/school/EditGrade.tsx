import { Box, Divider, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SwitchBox from "../../components/shared/SwitchBox";
import Placeholder from "../../components/shared/Placeholder";
import AddClassModal from "../../components/modals/AddClassToGradeModal";
import { editGrade, geGradeDetails } from "../../redux/reducers/gradeReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import { deleteClass } from "../../redux/reducers/classesReducer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ActionDropdown from "../../components/shared/ActionDropdown";

const columns = [
  {
    name: "Class Name",
    selector: (row: any) => row.name,

    width: "40%",
  },
  {
    name: "Total No. of student",
    selector: (row: any) => row.students,

    width: "40%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,

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
  const gradeDetailsState = useSelector((state: RootState) => state.grade);
  const param = useParams();
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: "",
      status: false,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const dispatch = useDispatch();

  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(geGradeDetails({ paginate: 10, id: param.id }));
  }, []);

  useEffect(() => {
    const tableData = gradeDetailsState?.gradeDetails?.classes?.data.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          students: item.num_students,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {}}
            />
          ),
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                {
                  name: "Delete",
                  action: async () => {
                    await dispatch(deleteClass(item.id));
                    await dispatch(
                      geGradeDetails({ paginate: 10, id: param.id })
                    );
                  },
                },
              ]}
            />
          ),
        };
      }
    );

    formik.setValues({
      ...formik.values,
      name: gradeDetailsState?.gradeDetails?.grade,
      status: gradeDetailsState?.gradeDetails?.status,
    });

    setRows({
      ...gradeDetailsState?.gradeDetails,
      classes: tableData,
    });
  }, [gradeDetailsState?.gradeDetails]);

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
        <Typography variant="h5">Edit Grade</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            type="bordered"
            label="Cancel"
            onClick={() => navigate(-1)}
          />
          <Button
            onClick={async () => {
              try {
                await dispatch(
                  editGrade({
                    data: {
                      ...formik.values,
                      status: formik.values.status ? 1 : 0,
                      class_name: addClasses.map(
                        (item: any) => item.class_name
                      ),
                      class_numStudent: addClasses.map(
                        (item: any) => item.class_numStudent
                      ),
                    },
                    id: param.id,
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
        {gradeDetailsState?.gradeDetails?.classes?.data?.length ? (
          <>
            <DataTable data={rows.classes} columns={columns} />
            <Pagination
              from={gradeDetailsState?.gradeDetails?.classes?.from}
              to={gradeDetailsState?.gradeDetails?.classes?.to}
              lastPage={gradeDetailsState?.gradeDetails?.classes?.last_page}
              currentPage={
                gradeDetailsState?.gradeDetails?.classes?.current_page
              }
              total={gradeDetailsState?.gradeDetails?.classes?.total}
              perPage={gradeDetailsState?.gradeDetails?.classes?.per_page}
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
      />
    </>
  );
};

export default AddGrade;
