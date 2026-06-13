import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import InfoCard from "../../components/shared/InfoCard";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import SwitchBox from "../../components/shared/SwitchBox";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { buildTemplateUrl } from "../../utils/fetchMethods";
import {
  deleteEmployee,
  exportEmployeeList,
  getEmployeeList,
  setEmployeeStatus,
  uploadEmployees,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import AddEmployeeToSchoolModal from "../modals/AddEmployeeToSchoolModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const columns = [
  {
    name: "Employee Name",
    selector: (row: any) => row.name,
  },
  {
    name: "Phone",
    selector: (row: any) => row.phone,
  },
  {
    name: "Email",
    selector: (row: any) => row.email,
  },
  {
    name: "Role",
    selector: (row: any) => row.role,
  },
  {
    name: "Joining date",
    selector: (row: any) => row.joiningDate,
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
  },
];

const Employee = ({ schoolID }: any) => {
  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const permissionState = useSelector((state: RootState) => state.permissions);
  const addteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["add-teachers"] === "1"
  );
  const exportteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["export-teachers"] === "1"
  );
  const employeeState = useSelector((state: RootState) => state.employee);
  const param = useParams();
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  // ------------- functions ---------------
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleRowClick = (row: any) => {
    navigate(`/user/employee/view/${row.id}`);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getEmployeeList({ paginate: 10, school_id: schoolID }));
  }, [schoolID]);

  useEffect(() => {
    const tableData = employeeState?.employeeList?.users?.data.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          phone: item.phone,
          email: item.email,
          role: item.role_name,
          joiningDate: item.joining_date,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setEmployeeStatus(item.id));
              }}
            />
          ),
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                {
                  name: "Edit",
                  action: () => {
                    navigate(`/user/employee/edit/${item.id}`);
                  },
                },
                {
                  name: "Delete",
                  action: () => {
                    setEmployeeToDelete(item);
                    setDeleteModalOpen(true);
                  },
                },
              ]}
            />
          ),
        };
      }
    );

    setRows({
      ...employeeState.employeeList,
      users: tableData,
    });
  }, [employeeState.employeeList]);

  const downloadBlankFile = async () => {
    window.open(
      buildTemplateUrl(process.env.REACT_APP_BASE_URL, "/Employees Template.xlsx"),
      "_blank"
    );
  };

  const ExportEmployeeExcel = () => {
    dispatch(exportEmployeeList({ school_id: param.id }))
      .unwrap()
      .then((res: any) => {
        window.open(res.path, "_blank");
        // console.log(res);
      });
  };

  const [file, setFile] = useState<any>(null);
  const fileInput: any = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsUploading(true);
      if (file) {
        await dispatch(uploadEmployees({ school_id: param.id, file }));
        await dispatch(getEmployeeList({ paginate: 10, school_id: param.id }));
      }
      setFile(null);
      setIsUploading(false);
    })();
  }, [file]);

  return (
    <>
      <Box>
        <Box
          sx={{
            mx: 2,
            mb: 2,
            mt: 2,
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
            <Typography variant="h6">School Employees</Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* {isFiltered && (
                <Typography
                  component={"p"}
                  sx={{
                    color: "#1EBBA3",
                    fontWeight: "400",
                    mx: 4,
                    cursor: "pointer",
                  }}
                >
                  Clear filters
                </Typography>
              )} */}
              {/* <Button
                label="Upload CSV file"
                type="bordered"
                icon={NoteAddIcon}
                className="w-30 m-3"
              /> */}
              {addteachers && (
                <Button
                  onClick={() => {
                    navigate(`/school/add-employee/${schoolID}`);
                  }}
                  label="Add Employee"
                  className="w-30 m-3"
                  type="bordered"
                />
              )}
              {exportteachers && (
                <Button
                  label="Export"
                  type="bordered"
                  className="w-30 m-3"
                  onClick={ExportEmployeeExcel}
                />
              )}
              {addteachers && (
                <>
                  <Button
                    label="Download blank excel"
                    type="bordered"
                    className="w-30 m-3"
                    onClick={downloadBlankFile}
                  />
                  <Button
                    onClick={() => {
                      fileInput?.current?.click();
                    }}
                    label="Upload Employees"
                    type="bordered"
                    className="w-30 m-3"
                  />
                  {!isUploading && (
                    <input
                      style={{ display: "none" }}
                      ref={fileInput}
                      type="file"
                      id="file-upload-employees-edit"
                      name="file"
                      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(event: any) => {
                        const fileList = event.target.files;
                        if (!fileList) return;
                        setFile(fileList[0]);
                      }}
                    />
                  )}
                </>
              )}

              {/* <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => setIsFiltered(!isFiltered)}
                className="w-30 m-3"
              /> */}
            </Box>
          </Box>
          <Divider />

          {/* amira ask to make filter commented  */}

          {/* {isFiltered && (
            <Grid
              container
              columnGap={5}
              sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
            >
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Employee name
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="employeeName"
                    name="employeeName"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Phone</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="phone"
                    name="phone"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Email</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="email"
                    name="email"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Role</label>
                  <SelectBox
                    values={[
                      {
                        label: "Example 1",
                        value: "1",
                      },
                      {
                        label: "Example 2",
                        value: "2",
                      },
                    ]}
                    onChange={() => {}}
                    id="role_id"
                    name="role_id"
                    value={""}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Joining date
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="joiningDate"
                    name="joiningDate"
                    placeholder="Select date"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Status</label>
                  <SelectBox
                    values={[
                      {
                        label: "Example 1",
                        value: "1",
                      },
                      {
                        label: "Example 2",
                        value: "2",
                      },
                    ]}
                    onChange={() => {}}
                    id="role_id"
                    name="role_id"
                    value={""}
                  />
                </div>
              </Grid>
            </Grid>
          )} */}
          <DataTable
            handleRowClick={handleRowClick}
            data={rows.users}
            columns={columns}
          />
          <Pagination
            from={employeeState?.employeeList?.users?.from}
            to={employeeState?.employeeList?.users?.to}
            lastPage={employeeState?.employeeList?.users?.last_page}
            currentPage={employeeState?.employeeList?.users?.current_page}
            total={employeeState?.employeeList?.users?.total}
            perPage={employeeState?.employeeList?.users?.per_page}
          />
        </Box>
      </Box>
      <AddEmployeeToSchoolModal
        open={open}
        onClose={handleClose}
        schoolID={schoolID}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={async () => {
          if (employeeToDelete) {
            await dispatch(deleteEmployee(employeeToDelete.id));
            await dispatch(getEmployeeList({ paginate: 10, school_id: schoolID }));
          }
        }}
        item="Employee"
      />
    </>
  );
};

export default Employee;
