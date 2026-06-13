import { Box, Grid, Divider, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import DataTable from "../shared/DataTable";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../shared/SwitchBox";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getStudentsformSubject } from "../../redux/reducers/subjectsReducer";
import { RootState } from "../../redux/store";
import { exportStudentList } from "@/redux/reducers/studentReducer";

const columns = [
  {
    name: "Student name",
    selector: (row: any) => row.name,
  },
  {
    name: "Grade",
    selector: (row: any) => row.grade,
  },
  {
    name: "Class",
    selector: (row: any) => row.class,
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

const Students = () => {
  // -------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const param = useParams();
  const dispatch = useDispatch();
  const subjectStudentState = useSelector(
    (state: RootState) => state.subjects.students
  );

  const permissionState = useSelector((state: RootState) => state.permissions);
  const exportstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["export-students"] === "1"
  );

  const schoolID = useSelector((state: RootState) => state?.school?.schoolID);

  // ------------ side effects -------------
  useEffect(() => {
    dispatch(
      getStudentsformSubject({
        data: { paginate: 10, school_id: schoolID },
        id: param.id,
      })
    );
  }, []);

  const [filter, setFilter] = useState({
    search: "",
  });

  const importStudent = () => {
    dispatch(exportStudentList({ subject_id: param.id }))
      .unwrap()
      .then((res: any) => {
        window.open(res.path, "_blank");
        // console.log(res);
      });
  };
  return (
    <Box>
      <Box
        sx={{
          m: 3,
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
                  await setFilter({
                    search: "",
                  });
                  await dispatch(
                    getStudentsformSubject({
                      data: { paginate: 10, school_id: schoolID, search: "" },
                      id: param.id,
                    })
                  );
                }}
              >
                Clear filters
              </Typography>
            )}
            {exportstudents && (
              <Button
                label="Export"
                type="bordered"
                className="w-30 m-3"
                onClick={importStudent}
              />
            )}
            <Button
              label=""
              type="bordered"
              icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
              onClick={() => {
                setIsFiltered(!isFiltered);
              }}
              className="w-30 m-3"
            />
            {/* setFilter({search:''}) */}
          </Box>
        </Box>
        <Divider />
        {isFiltered && (
          <Grid
            container
            columnGap={2}
            sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
          >
            <Grid item xs={12} sm={2.5}>
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
            {/* <Grid item xs={12} sm={2.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Class</label>
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
            <Grid item xs={12} sm={2.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">School</label>
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
            </Grid> */}
            <Grid item xs={12} sm={3}>
              <Button
                label="Filter"
                className="w-40 mt-6"
                onClick={() => {
                  dispatch(
                    getStudentsformSubject({
                      data: {
                        paginate: 10,
                        school_id: schoolID,
                        search: filter.search,
                      },
                      id: param.id,
                    })
                  );
                }}
              />
            </Grid>
          </Grid>
        )}
        <DataTable data={subjectStudentState?.data} columns={columns} />
        <Pagination
          from={subjectStudentState?.from}
          to={subjectStudentState?.to}
          lastPage={subjectStudentState?.last_page}
          currentPage={subjectStudentState?.current_page}
          total={subjectStudentState?.total}
          perPage={subjectStudentState?.per_page}
        />
      </Box>
    </Box>
  );
};

export default Students;
