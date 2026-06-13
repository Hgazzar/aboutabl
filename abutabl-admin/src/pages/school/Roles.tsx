import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../../components/shared/SwitchBox";
import {
  deleteRole,
  getRoleList,
  setRolesStatus,
} from "../../redux/reducers/roleReducer";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const Roles = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roleState = useSelector((state: RootState) => state.roles);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionsRole = permissionState?.permissions?.roles;
  const columns = [
    {
      name: "Role",
      selector: (row: any) => row.name,
      width: "80%",
    },
    permissionsRole?.find(
      (permission: any) => permission["activation-roles"] === "1"
    )
      ? {
          name: "Status",
          selector: (row: any) => row.status,
          width: "7%",
          center: true,
        }
      : "",
    permissionsRole?.find(
      (permission: any) => permission["edit-roles"] === "0"
    ) ||
    permissionsRole?.find(
      (permission: any) => permission["delete-roles"] === "0"
    )
      ? ""
      : {
          name: "Action",
          selector: (row: any) => row.action,
          width: "7%",
          center: true,
        },
  ];

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getRoleList({ paginate: 10 }));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const tableData = roleState?.roleList?.roles?.data?.map((item: any) => {
      return {
        id: item.id,
        name: item.name,

        status: permissionsRole?.find(
          (permission: any) => permission["activation-roles"] === "1"
        ) ? (
          <SwitchBox
            value={item.status === "1" ? true : false}
            onChange={() => {
              dispatch(setRolesStatus(item.id));
            }}
          />
        ) : null,
        action: (
          <ActionDropdown
            id={item.id}
            actions={
              permissionsRole?.find(
                (permission: any) => permission["edit-roles"] === "1"
              ) &&
              permissionsRole?.find(
                (permission: any) => permission["delete-roles"] === "1"
              )
                ? [
                    {
                      name: "Edit",
                      action: () => {
                        navigate(`/roles/edit/${item.id}`);
                      },
                    },
                    {
                      name: "Delete",
                      action: () => {
                        setRoleToDelete({ id: item.id, name: item.name });
                        setDeleteModalOpen(true);
                      },
                    },
                  ]
                : permissionsRole?.find(
                    (permission: any) => permission["edit-roles"] === "1"
                  ) &&
                  permissionsRole?.find(
                    (permission: any) => permission["delete-roles"] === "0"
                  )
                ? [
                    {
                      name: "Edit",
                      action: () => {
                        navigate(`/roles/edit/${item.id}`);
                      },
                    },
                  ]
                : permissionsRole?.find(
                    (permission: any) => permission["edit-roles"] === "0"
                  ) &&
                  permissionsRole?.find(
                    (permission: any) => permission["delete-roles"] === "1"
                  )
                ? [
                    {
                      name: "Delete",
                      action: () => {
                        setRoleToDelete({ id: item.id, name: item.name });
                        setDeleteModalOpen(true);
                      },
                    },
                  ]
                : [""]
            }
          />
        ),
      };
    });

    setRows({
      ...roleState?.roleList,
      roles: tableData,
    });
  }, [roleState?.roleList]);
  const [filter, setFilter] = useState({
    search: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const handleChangePage = async (page: number) => {
    setIsLoading(true);

    await dispatch(getRoleList({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };

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
        <Typography variant="h5">Role Management</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {permissionsRole?.find(
            (permission: any) => permission["add-roles"] === "1"
          ) && (
            <Button
              onClick={() => navigate("add-role")}
              label="Add Role"
              className="w-30 m-3"
            />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mx: 2,
          m: 4,
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
                  await setFilter({ search: "" });
                  await dispatch(getRoleList({ paginate: 10, search: "" }));
                }}
              >
                Clear filters
              </Typography>
            )}
            {/* {permissionsRole?.find(
              (permission: any) => permission["export-roles"] === "1"
            ) && <Button label="Export" type="bordered" className="w-30 m-3" />} */}
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
            <Grid item xs={12} sm={5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Role name</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="roleName"
                  name="roleName"
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
              <Button
                label="Filter"
                className="w-40 mt-6"
                onClick={() => {
                  dispatch(
                    getRoleList({ paginate: 10, search: filter.search })
                  );
                }}
              />
            </Grid>
            {/* <Grid item xs={12} sm={5}>
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
            </Grid> */}
          </Grid>
        )}
        <DataTable data={rows.roles} columns={columns} isLoading={isLoading} />
        <Pagination
          from={roleState?.roleList?.roles?.from}
          to={roleState?.roleList?.roles?.to}
          lastPage={roleState?.roleList?.roles?.last_page}
          currentPage={roleState?.roleList?.roles?.current_page}
          total={roleState?.roleList?.roles?.total}
          perPage={roleState?.roleList?.roles?.per_page}
          handleChangePage={handleChangePage}
        />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        item="Role"
        onConfirm={async () => {
          if (roleToDelete) {
            await dispatch(deleteRole(roleToDelete.id));
            await dispatch(
              getRoleList({ paginate: 10, page: currentPage })
            );
          }
        }}
      />
    </Box>
  );
};

export default Roles;
