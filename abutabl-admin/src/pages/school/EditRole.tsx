import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Pagination from "../../components/shared/Pagination";
import DataTable from "../../components/shared/DataTable";
import { useNavigate } from "react-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import AccountStatus from "../../components/shared/AccountStatus";
import {
  addRole,
  editRole,
  getEditPermissionList,
  getPermissionList,
} from "../../redux/reducers/roleReducer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useParams } from "react-router-dom";
// import { items } from "../../layout/DashboardList";

import DashboardList from "../../layout/DashboardList";

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

const SchoolList = () => {
  // ------------------------------------------------------
  // const handleRowSelect = (rowIndex: number, isSelected: boolean) => {
  //   setRows((prevRows: any) => {
  //     return prevRows.map((row: any, index: number) => {
  //       if (index === rowIndex) {
  //         return {
  //           ...row,
  //           view: isSelected,
  //           add: isSelected,
  //           edit: isSelected,
  //           activation: isSelected,
  //           export: isSelected,
  //           delete: isSelected,
  //         };
  //       }
  //       return row;
  //     });
  //   });

  //   setPermission((prev: any) => {
  //     const data = [...prev];
  //     const rowItems =
  //       roleState.permissions[Object.keys(roleState.permissions)[rowIndex]];
  //     rowItems.forEach((item: any) => {
  //       const perm = data.find((i: any) => i.name === item.name);
  //       if (perm) {
  //         perm.selected = isSelected;
  //       }
  //     });
  //     return data;
  //   });
  // };

  // const columns = [
  //   {
  //     name: "selectAll",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={
  //           row.view &&
  //           row.add &&
  //           row.edit &&
  //           row.activation &&
  //           row.export &&
  //           row.delete
  //         }
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "Privileges",
  //     selector: (row: any, index: number) => row.privilege,
  //   },
  //   {
  //     name: "view",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.view}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "add",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.add}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "Edit",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.edit}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "Activation",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.activation}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "Export",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.export}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  //   {
  //     name: "Delete",
  //     selector: (row: any, index: number) => (
  //       <input
  //         type="checkbox"
  //         checked={row.delete}
  //         onChange={(e) => handleRowSelect(index, e.target.checked)}
  //       />
  //     ),
  //   },
  // ];
  // ------------------------------------------------------

  const { items, settingItems } = DashboardList();

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
  const param = useParams();
  const [permission, setPermission] = useState<any>([]);
  const navigate = useNavigate();
  
  // Get all permission names from all rows
  const getAllPermissionNames = () => {
    if (!roleState?.permissions) return [];
    const allNames: any[] = [];
    for (const item in roleState?.permissions) {
      const permissionGroup = roleState?.permissions[item];
      if (permissionGroup && Array.isArray(permissionGroup)) {
        permissionGroup.forEach((perm: any) => {
          if (perm?.name) {
            allNames.push(perm.name);
          }
        });
      }
    }
    return allNames;
  };

  // Check if all permissions are checked
  const areAllPermissionsChecked = () => {
    const allNames = getAllPermissionNames();
    if (allNames.length === 0 || permission.length === 0) return false;
    return allNames.every((name) => {
      const perm = permission.find((p: any) => p.name === name);
      return perm?.selected === true;
    });
  };

  // Handler for "Check All" checkbox
  const handleCheckAll = () => {
    const allNames = getAllPermissionNames();
    
    setPermission((prev: any) => {
      // Check if all permissions are currently checked using prev state
      const allChecked = allNames.length > 0 && allNames.every((name) => {
        const perm = prev.find((p: any) => p.name === name);
        return perm?.selected === true;
      });
      
      const data = [...prev];
      allNames.forEach((name) => {
        const permIndex = data.findIndex((p: any) => p.name === name);
        if (permIndex !== -1) {
          data[permIndex] = {
            ...data[permIndex],
            selected: !allChecked,
          };
        }
      });
      return data;
    });
  };
  
  // ------------- functions --------------

  // ----------- side effects ------------
  useEffect(() => {
    (async () => {
      await dispatch(getEditPermissionList(param.id))
        .unwrap()
        .then((result: any) => {
          let permits: any = [];
          for (const item in result?.permissions) {
            permits = [...permits, ...result?.permissions[item]];
          }
          setPermission(
            permits?.map((item: any) => {
              return {
                id: item?.id,
                selected: item?.selected === "1" ? true : false,
                name: item.name,
              };
            })
          );
          // console.log(permission);

          formik.setValues({
            ...formik.values,
            name: result?.role?.[0]?.name,
            status: result?.role?.[0]?.status === "1" ? true : false,
          });
        });
    })();
  }, []);

  useEffect(() => {
    const tableArray = [];
    for (const item in roleState?.permissions) {
      tableArray?.push({ data: roleState?.permissions[item] });
    }
    setRows(
      tableArray?.map((item: any, index: number) => {
        // Get all permission names for this row
        const permissionNames = [
          item?.data[0]?.name, // view
          item?.data[1]?.name, // add
          item?.data[2]?.name, // edit
          item?.data[3]?.name, // activation
          item?.data[4]?.name, // export
          item?.data[5]?.name, // delete
        ].filter(Boolean); // Remove undefined values

        // Check if all permissions in this row are checked
        const allChecked = permissionNames.length > 0 && permissionNames.every((name) => {
          const perm = permission.find((p: any) => p.name === name);
          return perm?.selected === true;
        });

        // Handler for "All" checkbox in this row
        const handleAllChange = () => {
          setPermission((prev: any) => {
            const data = [...prev];
            permissionNames.forEach((name) => {
              const permIndex = data.findIndex((p: any) => p.name === name);
              if (permIndex !== -1) {
                data[permIndex] = {
                  ...data[permIndex],
                  selected: !allChecked,
                };
              }
            });
            return data;
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
          view: item?.data[0] && (
            <input
              type="checkbox"
              name="view"
              onChange={(e: any) => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[0]?.name
                  ).selected = !data.find((i) => i.name === item?.data[0]?.name)
                    .selected;
                  // data[item?.data[0]?.id - 1].selected =
                  //   !data[item?.data[0]?.id - 1]?.selected;
                  return data;
                });
              }}
              // checked={permission[item?.data[0]?.id - 1]?.selected}
              checked={
                permission.find((i: any) => i.name === item?.data[0]?.name)
                  ?.selected
              }
            />
          ),
          add: item?.data[1] && (
            <input
              type="checkbox"
              name="add"
              onChange={() => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[1]?.name
                  ).selected = !data.find((i) => i.name === item?.data[1]?.name)
                    .selected;
                  // data[item?.data[1]?.id - 1].selected =
                  //   !data[item?.data[1]?.id - 1]?.selected;
                  return data;
                });
              }}
              checked={
                permission.find((i: any) => i.name === item?.data[1]?.name)
                  ?.selected
              }
              // checked={permission[item?.data[1]?.id - 1]?.selected}
            />
          ),
          edit: item?.data[2] && (
            <input
              type="checkbox"
              name="edit"
              onChange={() => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[2]?.name
                  ).selected = !data.find((i) => i.name === item?.data[2]?.name)
                    .selected;
                  // data[item?.data[2]?.id - 1].selected =
                  //   !data[item?.data[2]?.id - 1]?.selected;
                  return data;
                });
              }}
              checked={
                permission.find((i: any) => i.name === item?.data[2]?.name)
                  ?.selected
              }
              // checked={permission[item?.data[2]?.id - 1]?.selected}
            />
          ),
          activation: item?.data[3] && (
            <input
              type="checkbox"
              name="activation"
              onChange={() => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[3]?.name
                  ).selected = !data.find((i) => i.name === item?.data[3]?.name)
                    .selected;

                  // data[item?.data[3]?.id - 1].selected =
                  //   !data[item?.data[3]?.id - 1]?.selected;
                  return data;
                });
              }}
              checked={
                permission.find((i: any) => i.name === item?.data[3]?.name)
                  ?.selected
              }
              // checked={permission[item?.data[3]?.id - 1]?.selected}
            />
          ),
          export: item?.data[4] && (
            <input
              type="checkbox"
              name="export"
              onChange={() => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[4]?.name
                  ).selected = !data.find((i) => i.name === item?.data[4]?.name)
                    .selected;
                  // data[item?.data[4]?.id - 1].selected =
                  //   !data[item?.data[4]?.id - 1]?.selected;
                  return data;
                });
              }}
              checked={
                permission.find((i: any) => i.name === item?.data[4]?.name)
                  ?.selected
              }
              // checked={permission[item?.data[4]?.id - 1]?.selected}
            />
          ),
          delete: item?.data[5] && (
            <input
              type="checkbox"
              name="delete"
              onChange={() => {
                setPermission((prev: any) => {
                  const data = [...prev];
                  data.find(
                    (i: any) => i.name === item?.data[5]?.name
                  ).selected = !data.find((i) => i.name === item?.data[5]?.name)
                    .selected;
                  // data[item?.data[5]?.id - 1].selected =
                  //   !data[item?.data[5]?.id - 1]?.selected;
                  return data;
                });
              }}
              checked={
                permission.find((i: any) => i.name === item?.data[5]?.name)
                  ?.selected
              }
              // checked={permission[item?.data[5]?.id - 1]?.selected}
            />
          ),
        };
      })
    );
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
        <Typography variant="h5">Edit Role</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            onClick={async () => {
              const permission_id = permission
                ?.filter((item: any) => {
                  return item?.selected === true;
                })
                ?.map((item: any) => {
                  return item?.id;
                });

              await dispatch(
                editRole({
                  data: {
                    permission_id,
                    name: formik.values.name,
                    status: formik.values.status === true ? 1 : 0,
                  },
                  id: param.id,
                })
              )
                .unwrap()
                .then(() => {
                  navigate(-1);
                });
            }}
            label="Save"
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
