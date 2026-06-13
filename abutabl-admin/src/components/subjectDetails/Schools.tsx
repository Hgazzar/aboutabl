import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAssignSchool,
  getSchoolList,
} from "../../redux/reducers/schoolReducer";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import ImportCSVModal from "../../components/modals/ImportCSVModal";
import { useParams } from "react-router-dom";
import AssignSchoolToSubjectModal from "../modals/AssignSchoolToSubjectModal";
import { useTranslation } from "react-i18next";


const SchoolList = () => {
  const { t } = useTranslation();
  const columns = [
    {
      name: "Name",
      selector: (row: any) => row.name,
    },
    {
      name: t("email"),
      selector: (row: any) => row.email,
    },
    {
      name: t("contact_number"),
      selector: (row: any) => row.contactNumber,
    },
    {
      name: t("address"),
      selector: (row: any) => row.address,
    },
    {
      name: t("government"),
      selector: (row: any) => row.government,
    },
    {
      name: t("city"),
      selector: (row: any) => row.city,
    },
    {
      name: t("status"),
      selector: (row: any) => row.status,
    },
    {
      name: t("action"),
      selector: (row: any) => row.action,
    },
  ];

  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["view-schools"] === "1"
  );
  const addschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["add-schools"] === "1"
  );
  const exportschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["export-schools"] === "1"
  );
  const deleteschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["delete-schools"] === "1"
  );
  const editschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["edit-schools"] === "1"
  );

  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const schoolState = useSelector((state: RootState) => state.school);
  const loginUser = useSelector((state: RootState) => state.login.user);
  const [open, setOpen] = React.useState(false);
  const param = useParams();
  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    viewschools && navigate(`/school/profile/${row.id}`);
  };

  const handleChangePage = (page: number) => {
    dispatch(getSchoolList({ paginate: 10, page, subject_id: param.id }));
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSchoolList({ paginate: 10, page: 1, subject_id: param.id }));
  }, []);

  useEffect(() => {
    const raw = schoolState?.schoolList?.schools?.data ?? [];
    const scoped =
      loginUser?.type !== "admin" && loginUser?.school_id
        ? raw.filter(
            (item: any) => String(item.id) === String(loginUser.school_id)
          )
        : raw;

    const tableData = scoped.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          contactNumber: item.contanct_number,
          email: item.email,
          status: (
            <div
              className={`${
                item.status == 1
                  ? "bg-lightGreen text-xs text-green py-2 px-3 mx-2"
                  : "bg-lightRed text-xs text-red py-2 px-3 mx-2"
              }`}
            >
              {item.status == 1 ? t("active") : t("inactive")}
            </div>
          ),
          government: item.govern,
          city: item.city,
          address: item.address,
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                editschools
                  ? {
                      name: t("edit"),
                      action: () => {
                        navigate(`/school/profile/edit/${item.id}`);
                      },
                    }
                  : "",
                deleteschools
                  ? {
                      name: t("delete"),
                      action: async () => {
                        await dispatch(
                          deleteAssignSchool({
                            subject_id: param.id,
                            school_id: item.id,
                          })
                        );
                        await dispatch(
                          getSchoolList({ paginate: 10, subject_id: param.id })
                        );
                      },
                    }
                  : "",
              ]}
            />
          ),
        };
      }
    );
    setRows({
      ...schoolState.schoolList,
      schools: tableData,
    });
  }, [schoolState.schoolList]);
  const [filter, setFilter] = useState({
    search: "",
  });
  return (
    <>
      <Box>
        <Box
          sx={{
            mr: 2,
            my: 2,
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
                    await dispatch(
                      getSchoolList({
                        paginate: 10,
                        page: 1,
                        subject_id: param.id,
                        search: "",
                      })
                    );
                  }}
                >
                  {t("clear_filters")}
                </Typography>
              )}
              {addschools && (
                <Button
                  onClick={handleOpen}
                  label={t("assign_school")}
                  className="w-30 m-3"
                />
              )}
              {/* {
                exportschools &&
              <Button label="Export" type="bordered" className="w-30 m-3" />
              }  */}
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
                    {t("school_name")}
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="schoolName"
                    name="schoolName"
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
                  label={t("filter")}
                  className="w-40 mt-6"
                  onClick={() => {
                    dispatch(
                      getSchoolList({
                        paginate: 10,
                        page: 1,
                        subject_id: param.id,
                        search: filter.search,
                      })
                    );
                  }}
                />
              </Grid>
              {/* <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Username</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="userName"
                    name="userName"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Address</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="address"
                    name="address"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Government
                  </label>
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
                    id="government_id"
                    name="government_id"
                    value={{
                      label: "Example 2",
                      value: "2",
                    }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">City</label>
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
                    id="city_id"
                    name="city_id"
                    value={{
                      label: "Example 2",
                      value: "2",
                    }}
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
                    value={{
                      label: "Example 2",
                      value: "2",
                    }}
                  />
                </div>
              </Grid> */}
            </Grid>
          )}
          <DataTable
            handleRowClick={handleRowClick}
            data={rows?.schools}
            columns={columns}
          />
          <Pagination
            from={schoolState?.schoolList?.schools?.from}
            to={schoolState?.schoolList?.schools?.to}
            lastPage={schoolState?.schoolList?.schools?.last_page}
            currentPage={schoolState?.schoolList?.schools?.current_page}
            total={schoolState?.schoolList?.schools?.total}
            perPage={schoolState?.schoolList?.schools?.per_page}
            handleChangePage={handleChangePage}
          />
        </Box>
      </Box>
      {/* <ImportCSVModal
        open={open}
        onClose={handleClose}
        setFile={setFile}
        fileName={"Schools"}
        file={file}
      /> */}
      <AssignSchoolToSubjectModal open={open} onClose={handleClose} />
    </>
  );
};

export default SchoolList;
