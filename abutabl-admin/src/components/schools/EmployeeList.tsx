import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import SwitchBox from "../../components/shared/SwitchBox";
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteEmployee,
  getEmployeeList,
  setEmployeeStatus,
  setIsTeacher,
  exportEmployeeList,
  uploadEmployees,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "../../redux/store";
import { buildTemplateUrl } from "../../utils/fetchMethods";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import AddEmployeeToSchoolModal from "../modals/AddEmployeeToSchoolModal";
import { useFormik } from "formik";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import { dateFormat } from "@/utils/functions";
import DatePicker from "../shared/MuiDatePicker";
import { getRoleList } from "@/redux/reducers/roleReducer";
import InfoCard from "../shared/InfoCard";
import Cookies from "js-cookie";

const Employee = () => {
  const permissionState = useSelector((state: RootState) => state.permissions);
  const teacherState = permissionState?.permissions?.teachers;
  const viewteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["view-teachers"] === "1"
  );
  const addteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["add-teachers"] === "1"
  );
  const activationteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["activation-teachers"] === "1"
  );
  const deleteteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["delete-teachers"] === "1"
  );
  const editteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["edit-teachers"] === "1"
  );
  const exportteachers = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["export-teachers"] === "1"
  );

  const currentUserId = useSelector((state: RootState) => state.login?.user?.id);
  const currentUserIdFromCookie = Cookies.get("abotable_id");
  const currentUserIdResolved = currentUserId ?? currentUserIdFromCookie;

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
    activationteachers
      ? {
          name: "Status",
          selector: (row: any) => row.status,
        }
      : "",
    editteachers || deleteteachers
      ? {
          name: "Action",
          selector: (row: any) => row.action,
        }
      : "",
  ];
  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const employeeState = useSelector((state: RootState) => state.employee);
  const param = useParams();
  const [open, setOpen] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const formik: any = useFormik({
    initialValues: {
      search: "",
      role_id: "",
      status: "1",
      email: "",
      phone: "",
      joiningDate: dateFormat(new Date()),
    },
    onSubmit: async (values) => {},
  });
  // ------------- functions ---------------
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleRowClick = (row: any) => {
    viewteachers && navigate(`/user/employee/view/${row.id}`);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getEmployeeList({ paginate: 10, school_id: param?.id }));
    dispatch(getRoleList()).then((res: any) => {
      setRolesList(res?.payload?.roles ?? []);
    });
  }, [param?.id]);

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
          status: activationteachers ? (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setEmployeeStatus(item.id));
              }}
            />
          ) : (
            ""
          ),
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                editteachers && String(item.id) !== String(currentUserIdResolved)
                  ? {
                      name: "Edit",
                      action: () => {
                        dispatch(setIsTeacher(true));
                        navigate(`/user/employee/edit/${item.id}`);
                      },
                    }
                  : null,
                deleteteachers
                  ? {
                      name: "Delete",
                      action: () => {
                        setEmployeeToDelete(item);
                        setDeleteModalOpen(true);
                      },
                    }
                  : null,
              ].filter(Boolean)}
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
        <Grid sx={{ my: 2 }} container gap={2}>
          <InfoCard title="No. of Employees" value={rows?.users_count} />
          <InfoCard title="Active Employees" value={rows?.users_active} />
          <InfoCard title="Inactive Employees" value={rows?.users_inactive} />
          <InfoCard title="New Employees" value={rows?.users_new} />
        </Grid>
        <Box
          sx={{
            my: 2,
            mr: 2,
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
            <div></div>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isFiltered && (
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
              )}
              {addteachers && (
                <Button
                  onClick={() => {
                    navigate(`/school/add-employee/${param?.id}`);
                  }}
                  label="Add Employee"
                  className="w-30 m-3"
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
                </>
              )}
              {!isUploading && (
                <input
                  style={{ display: "none" }}
                  ref={fileInput}
                  type="file"
                  id="file-upload-employees"
                  name="file"
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event: any) => {
                    const fileList = event.target.files;
                    if (!fileList) return;
                    setFile(fileList[0]);
                  }}
                />
              )}

              <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => {
                  setIsFiltered(!isFiltered);
                  dispatch(
                    getEmployeeList({ paginate: 10, school_id: param?.id })
                  );
                }}
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
                    Employee name
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="search"
                    onChange={formik.handleChange}
                    value={formik.values.search}
                    name="search"
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
                    value={formik.values.phone}
                    onChange={formik.handleChange}
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
                    value={formik.values.email}
                    onChange={formik.handleChange}
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
                    values={rolesList?.map((item: any) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                    onChange={formik.handleChange}
                    id="role_id"
                    name="role_id"
                    value={formik.values.role_id}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Joining date
                  </label>
                  <DatePicker id="joiningDate" formik={formik} />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Status</label>
                  <SelectBox
                    values={[
                      {
                        label: "Active",
                        value: "1",
                      },
                      {
                        label: "Inactive",
                        value: "2",
                      },
                    ]}
                    onChange={formik.handleChange}
                    id="role_id"
                    name="role_id"
                    value={formik.values.status}
                  />
                </div>
              </Grid>
              <Button
                className="w-40 m-5"
                label="Filter"
                onClick={() => {
                  dispatch(
                    getEmployeeList({
                      paginate: 10,
                      school_id: param?.id,
                      ...formik.values,
                    })
                  );
                }}
              />
            </Grid>
          )}
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
      <AddEmployeeToSchoolModal open={open} onClose={handleClose} />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={async () => {
          if (employeeToDelete) {
            await dispatch(deleteEmployee(employeeToDelete.id));
            await dispatch(
              getEmployeeList({
                paginate: 10,
                school_id: param?.id,
              })
            );
          }
        }}
        item="Employee"
      />
    </>
  );
};

export default Employee;
