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
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteSchool,
  getSchoolList,
  setSchoolStatus,
} from "../../redux/reducers/schoolReducer";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import AssignSchoolToEmployeeModal from "../modals/AssignSchoolToEmployeeModal";

const columns = [
  {
    name: "School Name",
    selector: (row: any) => row.name,
    width: "20%",
  },
  {
    name: "Address",
    selector: (row: any) => row.address,
    width: "20%",
  },
  {
    name: "Government",
    selector: (row: any) => row.government,
    width: "20%",
  },
  {
    name: "City",
    selector: (row: any) => row.city,
    width: "20%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
    width: "7.5%",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    width: "7.5",
  },
];

const SchoolList = ({ userId }: any) => {
  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const schoolState = useSelector((state: RootState) => state.school);
  const [open, setOpen] = useState(false);

  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    navigate(`/school/profile/${row.id}`);
  };

  const handleChangePage = (page: number, e: any) => {
    dispatch(getSchoolList({ paginate: 10, page, user_id: userId }));
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSchoolList({ paginate: 10, page: 1, user_id: userId }));
  }, [userId]);

  useEffect(() => {
    const tableData = schoolState?.schoolList?.schools?.data?.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          contactNumber: item.contanct_number,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setSchoolStatus(item.id));
              }}
            />
          ),
          government: item.govern,
          city: item.city,
          address: item.address,
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                {
                  name: "Edit",
                  action: () => {
                    navigate(`/school/profile/edit/${item.id}`);
                  },
                },
                {
                  name: "Delete",
                  action: async () => {
                    await dispatch(deleteSchool(item?.id));
                    await dispatch(getSchoolList({ paginate: 10 }));
                  },
                },
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

  return (
    <>
      <Box
        sx={{
          p: 2,
          m: 2,
        }}
      >
        <Box
          sx={{
            mx: 2,
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
            <Searchbar />
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
              <Button
                label="Assign school"
                type="bordered"
                className="w-30 m-3"
                onClick={handleOpen}
              />
              {/* <Button label="Export" type="bordered" className="w-30 m-3" /> */}
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
                    School name
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="schoolName"
                    name="schoolName"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
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
              </Grid>
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
      <AssignSchoolToEmployeeModal
        open={open}
        onClose={handleClose}
        userId={userId}
      />
    </>
  );
};

export default SchoolList;
