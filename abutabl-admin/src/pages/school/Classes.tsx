import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DataTable from "../../components/shared/DataTable";
import SwitchBox from "../../components/shared/SwitchBox";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteClass,
  getClassList,
  setClassStatus,
} from "../../redux/reducers/classesReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import AddClassModal from "../../components/modals/AddClassesModal";
import { geGradeDetails } from "../../redux/reducers/gradeReducer";
import LoadingWrapper from "@/components/shared/LoadingWrapper";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";


const Classes = () => {

  const permissionState = useSelector((state: RootState) => state.permissions)
  const viewclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["view-classes"] === "1")
  const addclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["add-classes"] === "1")
  const exportclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["export-classes"] === "1")
  const deleteclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["delete-classes"] === "1")
  const editclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["edit-classes"] === "1")
  const activationclasses = permissionState?.permissions?.classes?.find((permission: any) => permission["activation-classes"] === "1")


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
    activationclasses ?
    {
      name: "Status",
      selector: (row: any) => row.status,
      width: "7%",
    } : '',
    {
      name: "Action",
      selector: (row: any) => row.action,
  
      width: "7%",
    },
  ];
  

  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any>(null);
  const [editClassState, setEditClassState] = useState<any>({
    id: '',
    name: "",
    num_students: "",
    status: true,
  });
  // console.log(editClassState);
  
  const dispatch = useDispatch();
  const classesState = useSelector((state: RootState) => state.classes);
  const gradeState = useSelector( 
    (state: RootState) => state.grade.gradeDetails
  );
  const param = useParams();
  const navigate = useNavigate();
  const [action, setAction] = useState<"add" | "edit">("add");
  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    viewclasses &&
    navigate(`/school/grade/classes/${row.id}`);
  };
  // ------------- side effects ---------------
  useEffect(() => {
    (async () => {
      await dispatch(geGradeDetails({ id: param.id }));
      await dispatch(getClassList({ paginate: 10, id: param.id }));
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const tableData = classesState?.classList?.classes?.map((item: any) => {      
      return {
        id: item.id,
        name: item.name,
        students: item?.students?.length,
        status: (
          activationclasses ?
          <SwitchBox
            value={item.status === "1" ? true : false}
            onChange={() => {
              dispatch(setClassStatus(item.id));
            }}
          />
          : ''
        ), 
        action: (
          <ActionDropdown
            id={item.id}
            actions={[
              editclasses ?
              {
                name: "Edit",
                action: async () => {
                  setEditClassState({
                    id: item.id,
                    name: item.name,
                    num_students: item?.num_students,
                    status: item.status,
                  });
                  setAction("edit");
                  handleOpen();
                },
              } : '',
              deleteclasses ?
              {
                name: "Delete",
                action: () => {
                  setClassToDelete(item);
                  setDeleteModalOpen(true);
                },
              } : '',
            ]}
          />
        ),
      };
    });

    setRows({
      ...classesState?.classList,
      classes: tableData,
    });
  }, [classesState?.classList]);

  return (
    <>
      <Box>
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
          <Typography variant="h5">{gradeState?.grade}</Typography>{" "}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {
              addclasses &&
              <Button
                onClick={() => {
                  setAction("add");
                  handleOpen();
                }}
                label="Add new classes"
                className="w-30 m-3"
              />
            }
          </Box>
        </Box>

        <LoadingWrapper isLoading={isLoading}>
          <Box
            sx={{
              mx: 2,
              mb: 2,
              mt: 5,
              boxShadow: "unset",
              border: "1px solid #091E4224",
              borderRadius: "5px",
              bgcolor: "#fff",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
              }}
            >
              <Searchbar />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {" "}
                {/* {
                  exportclasses &&
                <Button label="Export" type="bordered" className="w-30 m-3" />
                } */}
                <Button
                  label=""
                  type="bordered"
                  icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                  onClick={() => setIsFiltered(!isFiltered)}
                  className="w-30 m-3"
                />
              </Box>
            </Box>
            <Divider />
            {isFiltered && (
              <Grid
                container
                columnGap={5}
                sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
              >
                <Grid item xs={12} sm={3.5}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">
                      Class name
                    </label>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      size="small"
                      id="className"
                      name="className"
                      sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={3.5}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">
                      Total No. of student
                    </label>
                    <TextField
                      margin="normal"
                      fullWidth
                      size="small"
                      id="total"
                      name="total"
                      sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={3.5}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">Status</label>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      size="small"
                      id="status"
                      placeholder="Active"
                      name="status"
                      sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                    />
                  </div>
                </Grid>
              </Grid>
            )}
            <DataTable
              handleRowClick={handleRowClick}
              data={rows.classes}
              columns={columns}
            />
            <Pagination
              from={classesState?.classList?.classes?.from}
              to={classesState?.classList?.classes?.to}
              lastPage={classesState?.classList?.classes?.last_page}
              currentPage={classesState?.classList?.classes?.current_page}
              total={classesState?.classList?.classes?.total}
              perPage={classesState?.classList?.classes?.per_page}
            />
          </Box>
        </LoadingWrapper>
      </Box>
      <AddClassModal
        open={open}
        onClose={handleClose}
        editClassState={editClassState}
        action={action}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={async () => {
          if (classToDelete) {
            await dispatch(deleteClass(classToDelete.id));
            await dispatch(getClassList({ paginate: 10, id: param.id }));
          }
        }}
        item="Class"
      />
    </>
  );
};

export default Classes;
