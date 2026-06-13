import { Box, Grid, Divider, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import DataTable from "../shared/DataTable";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectBox from "../shared/SelectBox";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../shared/SwitchBox";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getTeachersformSubject } from "../../redux/reducers/subjectsReducer";
import { selectBoxOptions } from "../../utils/functions";
import { getCommonClassList } from "../../redux/reducers/commonReducer";
import { assignTeacherToClass } from "../../redux/reducers/schoolReducer";
import { getEmployeeList } from "../../redux/reducers/employeeReducer";

const columns = [
  {
    name: "Employee name",
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

const Teachers = () => {
  // -------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const dispatch = useDispatch();
  const subjectTeacherState = useSelector(
    (state: RootState) => state.subjects.teachers
  );
  const param = useParams();
  const classState = useSelector(
    (state: RootState) => state?.classes?.classList?.classes
  );
  const [assignTeacher, setAssignTeacher] = useState<any>({
    teacher_id: "",
    class_id: "",
  });

  const schoolID = useSelector((state: RootState) => state?.school?.schoolID);

  // ------------ side effects -------------
  const employeeState = useSelector((state: RootState) => state?.employee?.employeeList?.users);
  useEffect(() => {
    dispatch(getEmployeeList({ school_id: schoolID }));
  }, []);


  const [classesList, setClassesList] = useState<any>([]);  

  useEffect(() => {
    dispatch(
      getTeachersformSubject({ id: param?.id, data: { school_id: schoolID } })
    );
    dispatch(getCommonClassList({ school_id: schoolID })).then((res: any) => {
      setClassesList(res?.payload?.classes);
    });
  }, []);

  return (
    <Box>
      <Box>
        <Grid item xs={12} sm={3.5}>
          <Box
            sx={{
              m: 3,
              bgcolor: "#fff",
              border: "1px solid #091E4224",
            }}
          >
            <Box>
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
                  Assign Employee
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
                      Employee <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        employeeState?.length > 0
                          ? selectBoxOptions(employeeState, "name")
                          : []
                      }
                      onChange={(e: any) => {
                        setAssignTeacher((prev: any) => {
                          return {
                            ...prev,
                            teacher_id: e.target.value,
                          };
                        });
                      }}
                      id="teacher_id"
                      name="teacher_id"
                      value={assignTeacher?.teacher_id}
                    />
                  </div>
                </Box>
                <Box sx={{ width: "100%" }}>
                  <div className="flex flex-col gap-0 mb-4">
                    <label className="text-sm font-semibold mb-1">
                      Class <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        classesList?.length > 0
                          ? selectBoxOptions(classesList, "name")
                          : []
                      }
                      onChange={(e: any) => {
                        setAssignTeacher((prev: any) => {
                          return {
                            ...prev,
                            class_id: e.target.value,
                          };
                        });
                      }}
                      id="class_id"
                      name="Class_id"
                      value={assignTeacher?.class_id}
                    />
                  </div>
                </Box>
                <Button
                  onClick={async () => {
                    await dispatch(
                      assignTeacherToClass({
                        ...assignTeacher,
                        subject_id: param.id,
                        school_id: schoolID,
                      })
                    );
                    setAssignTeacher({
                      teacher_id: "",
                      class_id: "",
                    });
                    dispatch(
                      getTeachersformSubject({ id: param?.id, data: { school_id: schoolID } })
                    );
                  }
                }
                  label="Assign"
                  className="w-40 my-10 mt-6"
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      </Box>
      <Box
        sx={{
          m: 3,
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
            sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "space-evenly" }}
          >
            <Grid item xs={12} sm={5.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Teacher name
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="teacherName"
                  name="teacherName"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={5.5}>
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
          </Grid>
        )}
        <DataTable data={subjectTeacherState?.data} columns={columns} />
        <Pagination
          from={subjectTeacherState?.from}
          to={subjectTeacherState?.to}
          lastPage={subjectTeacherState?.last_page}
          currentPage={subjectTeacherState?.current_page}
          total={subjectTeacherState?.total}
          perPage={subjectTeacherState?.per_page}
        />
      </Box>
    </Box>
  );
};

export default Teachers;
