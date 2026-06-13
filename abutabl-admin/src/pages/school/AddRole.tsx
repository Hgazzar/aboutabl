import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Pagination from "../../components/shared/Pagination";
import DataTable from "../../components/shared/DataTable";
import { useNavigate } from "react-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import AccountStatus from "../../components/shared/AccountStatus";
import { addRole, getPermissionList } from "../../redux/reducers/roleReducer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const SchoolList = () => {
  // ------------- hooks ---------------
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
  const roleState = useSelector(
    (state: RootState) => state?.roles?.permissionList
  );
  const [permission, setPermission] = useState<any>([]);
  const navigate = useNavigate();
  
  // Get all permission IDs from all rows
  const getAllPermissionIds = () => {
    if (!roleState?.permissions) return [];
    const allIds: any[] = [];
    for (const item in roleState?.permissions) {
      const permissionGroup = roleState?.permissions[item];
      if (permissionGroup && Array.isArray(permissionGroup)) {
        permissionGroup.forEach((perm: any) => {
          if (perm?.id) {
            allIds.push(perm.id);
          }
        });
      }
    }
    return allIds;
  };

  // Check if all permissions are checked
  const areAllPermissionsChecked = () => {
    const allIds = getAllPermissionIds();
    if (allIds.length === 0) return false;
    return allIds.every((id) => permission[id]);
  };

  // Handler for "Check All" checkbox
  const handleCheckAll = () => {
    const allIds = getAllPermissionIds();
    
    setPermission((prev: any) => {
      // Check if all permissions are currently checked using prev state
      const allChecked = allIds.length > 0 && allIds.every((id) => prev[id]);
      const newPermission = { ...prev };
      
      if (allChecked) {
        // Uncheck all
        allIds.forEach((id) => {
          newPermission[id] = false;
        });
      } else {
        // Check all
        allIds.forEach((id) => {
          newPermission[id] = true;
        });
      }
      return newPermission;
    });
  };

  // Define columns
  const columns = [
    {
      name: "Privileges",
      selector: (row: any) => (row.privilege === "quizes" ? "quizzes" : row.privilege),
    },
    {
      name: "All",
      selector: (row: any) => row.all,
    },
    {
      name: "view",
      selector: (row: any) => row.view,
    },
    {
      name: "add",
      selector: (row: any) => row.add,
    },
    {
      name: "Edit",
      selector: (row: any) => row.edit,
    },
    {
      name: "Activation",
      selector: (row: any) => row.activation,
    },
    {
      name: "Export",
      selector: (row: any) => row.export,
    },
    {
      name: "Delete",
      selector: (row: any) => row.delete,
    },
  ];
  
  // ------------- functions --------------

  // ----------- side effects ------------
  useEffect(() => {
    dispatch(getPermissionList());
  }, []);

  useEffect(() => {
    const tableArray = [];
    for (const item in roleState?.permissions) {
      tableArray.push({ data: roleState?.permissions[item] });
    }

    const tableData = tableArray?.map((item: any, index: number) => {
      // Get all permission IDs for this row
      const permissionIds = [
        item?.data[0]?.id, // view
        item?.data[1]?.id, // add
        item?.data[2]?.id, // edit
        item?.data[3]?.id, // activation
        item?.data[4]?.id, // export
        item?.data[5]?.id, // delete
      ];

      // Check if all permissions in this row are checked
      const allChecked = permissionIds.every((id) => permission[id]);

      // Handler for "All" checkbox
      const handleAllChange = () => {
        setPermission((prev: any) => {
          const newPermission = { ...prev };
          if (allChecked) {
            // Uncheck all
            permissionIds.forEach((id) => {
              newPermission[id] = false;
            });
          } else {
            // Check all
            permissionIds.forEach((id) => {
              newPermission[id] = true;
            });
          }
          return newPermission;
        });
      };

      return {
        id: index,
        privilege: item?.data[0]?.name?.split("-")[1],
        all: (
          <input
            type="checkbox"
            name="all"
            checked={allChecked}
            onChange={handleAllChange}
          />
        ),
        view: (
          <input
            type="checkbox"
            name="view"
            checked={permission[item?.data[0]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[0]?.id]: !prev[item?.data[0]?.id],
                };
              });
            }}
            value={item?.data[0]?.id}
          />
        ),
        add: (
          <input
            type="checkbox"
            name="add"
            checked={permission[item?.data[1]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[1]?.id]: !prev[item?.data[1]?.id],
                };
              });
            }}
            value={item?.data[1]?.id}
          />
        ),
        edit: (
          <input
            type="checkbox"
            name="edit"
            checked={permission[item?.data[2]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[2]?.id]: !prev[item?.data[2]?.id],
                };
              });
            }}
            value={item?.data[2]?.id}
          />
        ),
        activation: (
          <input
            type="checkbox"
            name="activation"
            checked={permission[item?.data[3]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[3]?.id]: !prev[item?.data[3]?.id],
                };
              });
            }}
            value={item?.data[3]?.id}
          />
        ),
        export: (
          <input
            type="checkbox"
            name="export"
            checked={permission[item?.data[4]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[4]?.id]: !prev[item?.data[4]?.id],
                };
              });
            }}
            value={item?.data[4]?.id}
          />
        ),
        delete: (
          <input
            type="checkbox"
            name="delete"
            checked={permission[item?.data[5]?.id] || false}
            onChange={() => {
              setPermission((prev: any) => {
                return {
                  ...prev,
                  [item?.data[5]?.id]: !prev[item?.data[5]?.id],
                };
              });
            }}
            value={item?.data[5]?.id}
          />
        ),
      };
    });

    setRows(tableData);
  }, [roleState, permission]);

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

          borderBottom: "2px solid #091E4224",
        }}
      >
        <Typography variant="h5">Add Role</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            onClick={async () => {
              const permission_id = [];
              for (const item in permission) {
                if (permission[item]) {
                  permission_id.push(item);
                }
              }
              await dispatch(
                addRole({
                  permission_id,
                  name: formik.values.name,
                  status: formik.values.status === true ? 1 : 0,
                })
              )
                .unwrap()
                .then(() => {
                  navigate(-1);
                });
            }}
            label="Add Role"
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <Grid container gap={1}>
        <Grid item xs={12} md={8}>
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
                    Role name <span className="text-red">*</span>
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
                    placeholder="ex [Admin]"
                    sx={{ margin: 0, padding: 0 }}
                  />
                </div>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={3.3} sx={{ m: 4 }}>
          <AccountStatus formik={formik} value={formik.values.status} />
        </Grid>
      </Grid>
      <Box
        sx={{
          mx: 4,
          mb: 2,
          boxShadow: "unset",
          border: "2px solid #091E4224",
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
          <Typography
            component={"p"}
            sx={{ fontSize: "18px", fontWeight: "600" }}
          >
            Role privileges
          </Typography>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            p: 2,
            px: 3,
            gap: 1,
            borderBottom: "1px solid #091E4224",
          }}
        >
          <input
            type="checkbox"
            name="checkAll"
            checked={areAllPermissionsChecked()}
            onChange={handleCheckAll}
            style={{ cursor: "pointer", width: "18px", height: "18px" }}
          />
          <Typography
            component={"span"}
            sx={{ fontSize: "14px", fontWeight: "500" }}
          >
            Check All
          </Typography>
        </Box>

        <DataTable data={rows} columns={columns} />
      </Box>
    </Box>
  );
};

export default SchoolList;
