import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import SwitchBox from "../../components/shared/SwitchBox";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteStudent,
  getStudentList,
  setStudentStatus,
} from "../../redux/reducers/studentReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";

const columns = [
  {
    name: "Student Name",
    selector: (row: any) => row.name,
  },
  {
    name: "Class",
    selector: (row: any) => row.class,
  },
];

const StudentAssignment = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const studentState = useSelector((state: RootState) => state.student);
  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    navigate(`/user/student/view/${row.id}`);
  };

  // ------------- functions ---------------
  const handleChangePage = (page: number) => {
    dispatch(getStudentList({ paginate: 10, page }));
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getStudentList({ paginate: 10, page: 1 }));
  }, []);

  useEffect(() => {
    const tableData = studentState?.studentList?.students?.data.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          grade: item.grade,
          class: item.class,
          school: item.school,
          joiningDate: item.joining_date,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setStudentStatus(item.id));
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
                    navigate(`/user/student/edit/${item.id}`);
                  },
                },
                {
                  name: "Delete",
                  action: async () => {
                    await dispatch(deleteStudent(item.id));
                    await dispatch(getStudentList({ paginate: 10 }));
                  },
                },
              ]}
            />
          ),
        };
      }
    );

    setRows({
      ...studentState.studentList,
      students: tableData,
    });
  }, [studentState.studentList]);

  return (
    <Box>
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
          <Box>
            <Typography
              component={"p"}
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Assigned Students
            </Typography>{" "}
          </Box>
          <Button label="Assign" className="w-30 m-3" />
        </Box>
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
            <Button label="Add" className="w-30 m-3" />
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
            columnGap={1}
            sx={{ bgcolor: "#F7F9FA", justifyContent: "center", p: 3 }}
          >
            <Grid item xs={12} sm={2.3}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Student name
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="studentName"
                  name="studentName"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={2.3}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Grade</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="grade"
                  name="grade"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={2.3}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Class</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="class"
                  name="class"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={2.3}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">School</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="school"
                  name="school"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={2.3}>
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
        )}
        <DataTable
          handleRowClick={handleRowClick}
          data={rows.students}
          columns={columns}
        />
        <Pagination
          from={studentState?.studentList?.students?.from}
          to={studentState?.studentList?.students?.to}
          lastPage={studentState?.studentList?.students?.last_page}
          currentPage={studentState?.studentList?.students?.current_page}
          total={studentState?.studentList?.students?.total}
          perPage={studentState?.studentList?.students?.per_page}
          handleChangePage={handleChangePage}
        />
      </Box>
    </Box>
  );
};

export default StudentAssignment;
