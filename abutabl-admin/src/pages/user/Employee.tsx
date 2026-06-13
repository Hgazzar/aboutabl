import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
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
import {
  deleteEmployee,
  deleteUser,
  getEmployeeList,
  getUserList,
  setEmployeeStatus,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import LoadingWrapper from "@/components/shared/LoadingWrapper";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { getSchoolList } from "../../redux/reducers/schoolReducer";
import { selectBoxOptions } from "../../utils/functions";



const Employee = () => {

  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsUsers = permissionState?.permissions?.users;

  const editUsers = permissionsUsers?.find((permission:any) => permission['edit-users'] === "1")
  const deleteUsers = permissionsUsers?.find((permission:any) => permission['delete-users'] === "1")
  const addUsers = permissionsUsers?.find((permission: any) => permission["add-users"] === "1")
  const viewUsers = permissionsUsers?.find((permission: any) => permission["view-users"] === "1")
  const activationUsers = permissionsUsers?.find((permission: any) => permission["activation-users"] === "1")
  const exportUsers = permissionsUsers?.find((permission: any) => permission["export-users"] === "1")


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
    activationUsers ?
    {
      name: "Status",
      selector: (row: any) => row.status,
    }
    :
    ''
    ,
    (editUsers || deleteUsers) ?
    {
      name: "Action",
      selector: (row: any) => row.action,
    }
    :
    ''
    ,
  ];
  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const employeeState = useSelector((state: RootState) => state.employee);
  const schoolState = useSelector((state: RootState) => state.school);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    viewUsers &&
    navigate(`/user/employee/view/${row.id}`);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length > 0) {
      const ids = selectedRows.map((row: any) => row.id);
      for (const id of ids) {
        await dispatch(deleteUser(id));
      }
      setSelectedRows([]);
      setBulkDeleteModalOpen(false);
      await dispatch(getUserList({ paginate: 10, search: filter.search, user_type: filter.user_type, school_id: filter.school_id || undefined }));
    }
  };

  const handleChangePage = async (page: number) => {
    // setIsLoading(true);
    await dispatch(getUserList({ paginate: 10, page, search: filter.search, user_type: filter.user_type, school_id: filter.school_id || undefined }));
    setCurrentPage(page);
    // setIsLoading(false);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSchoolList({ paginate: 1000 })); // Fetch schools with large pagination to get all
  }, []);

  useEffect(() => {
    (async () => {
      await dispatch(getUserList({ paginate: 10, user_type: filter.user_type, school_id: filter.school_id || undefined }));
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const tableData = employeeState?.employeeList?.users?.data?.map(
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
                editUsers ?
                {
                  name: "Edit",
                  action: () => {
                    navigate(`/user/employee/edit/${item.id}`);
                  },
                }
                :
                ''
                ,
                deleteUsers ?
                {
                  name: "Delete",
                  action: () => {
                    setEmployeeToDelete(item);
                    setDeleteModalOpen(true);
                  },
                }
                :
                ''
                ,
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
  const [filter, setFilter] = useState({
    search:"",
    user_type: "all",
    school_id: ""
  });
  return (
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
        <Typography variant="h5">Aboutabl users</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {
            addUsers &&
            <>
            {/* <Button
              label="Upload from CSV"
              type="bordered"
              icon={NoteAddIcon}
              className="w-30 m-3"
            /> */}
            <Button
              onClick={() => navigate("add-employee")}
              label="Add users"
              className="w-30 m-3"
            />
            </>
          }
        </Box>
      </Box>

      <LoadingWrapper isLoading={isLoading}>
        <>
          <Box>
            <Grid container gap={1} sx={{ py: 4 }}>
              <InfoCard title={"No of Employees"} value={rows.users_count} />
              <InfoCard title={"Active Employees"} value={rows.users_active} />
              <InfoCard
                title={"Inactive Employees"}
                value={rows.users_inactive}
              />
              <InfoCard title={"New Employees"} value={rows.users_new} />
            </Grid>
          </Box>
          <Box
            sx={{
              mx: 2,
              mb: 2,
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
                justifyContent: "flex-end",
                alignItems: "center",
                p: 3,
              }}
            >
              {/* <Searchbar /> */}
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
                    onClick={async () => {
                      await setFilter( {
                           search:"",
                           user_type: "all",
                           school_id: ""
                       });
                        await dispatch(getUserList({ paginate: 10, search: '', user_type: 'all', school_id: undefined }));

                     }}
                  >
                    Clear filters
                  </Typography>
                )}
                {/* {
                  exportUsers &&
                <Button label="Export" type="bordered" className="w-30 m-3" />
                } */}
                <Button
                  label=""
                  type="bordered"
                  icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                  className="w-30 m-3"
                  onClick={() => {setIsFiltered(!isFiltered); setFilter({search:'', user_type: 'all', school_id: ''})}}

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
                      id="employeeName"
                      name="employeeName"
                      sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                      value={filter.search}
                      onChange={(e: any) => {
                        setFilter((prev: any) => {
                          return {
                            ...prev,
                            search: e.target.value,
                          };
                        });
                      }}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={3.5}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">
                      User Type
                    </label>
                    <SelectBox
                      values={[
                        {
                          label: "Admin",
                          value: "admin",
                        },
                        {
                          label: "User",
                          value: "user",
                        },
                        {
                          label: "Teacher",
                          value: "teacher",
                        },
                        {
                          label: "Student",
                          value: "student",
                        },
                        {
                          label: "All",
                          value: "all",
                        },
                      ]}
                      onChange={(e: any) => {
                        setFilter((prev: any) => {
                          return {
                            ...prev,
                            user_type: e.target.value,
                          };
                        });
                      }}
                      id="user_type"
                      name="user_type"
                      value={filter.user_type}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={3.5}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">
                      School
                    </label>
                    <SelectBox
                      values={
                        (schoolState?.schoolList?.schools?.data?.length > 0 || 
                         (Array.isArray(schoolState?.schoolList?.schools) && schoolState?.schoolList?.schools?.length > 0))
                          ? selectBoxOptions(
                              schoolState.schoolList.schools.data || schoolState.schoolList.schools, 
                              "name"
                            )
                          : []
                      }
                      onChange={(e: any) => {
                        setFilter((prev: any) => {
                          return {
                            ...prev,
                            school_id: e.target.value,
                          };
                        });
                      }}
                      id="school_id"
                      name="school_id"
                      value={filter.school_id}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={3.5}>
              <Button
                label="Filter"
                className="w-40 mt-6"
                onClick={() => {
                  dispatch(getUserList({ paginate: 10, search: filter.search, user_type: filter.user_type, school_id: filter.school_id || undefined }));
                }}
              />
            </Grid>
                {/* <Grid item xs={12} sm={3.5}>
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
                </Grid> */}
              </Grid>
            )}
            {selectedRows.length > 0 && deleteUsers && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  bgcolor: "#F3FFFA",
                  borderBottom: "1px solid #091E4224",
                }}
              >
                <Typography variant="body1">
                  {selectedRows.length} user{selectedRows.length > 1 ? "s" : ""} selected
                </Typography>
                <Button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  label={`Delete ${selectedRows.length} user${selectedRows.length > 1 ? "s" : ""}`}
                  type="danger"
                  className="w-auto"
                />
              </Box>
            )}
            <DataTable
              handleRowClick={handleRowClick}
              data={rows.users}
              columns={columns}
              setSelectedRows={deleteUsers ? setSelectedRows : undefined}
              selectedRows={selectedRows}
            />
            <Pagination
              from={employeeState?.employeeList?.users?.from}
              to={employeeState?.employeeList?.users?.to}
              lastPage={employeeState?.employeeList?.users?.last_page}
              currentPage={employeeState?.employeeList?.users?.current_page}
              total={employeeState?.employeeList?.users?.total}
              perPage={employeeState?.employeeList?.users?.per_page}
              handleChangePage={handleChangePage}
            />
          </Box>
        </>
      </LoadingWrapper>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={async () => {
          if (employeeToDelete) {
            await dispatch(deleteUser(employeeToDelete.id));
            await dispatch(getUserList({ paginate: 10, search: filter.search, user_type: filter.user_type, school_id: filter.school_id || undefined }));
          }
        }}
        item="Employee"
      />
      <DeleteConfirmationModal
        open={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
        }}
        onConfirm={handleBulkDelete}
        item="user"
        count={selectedRows.length}
      />
    </Box>
  );
};

export default Employee;
