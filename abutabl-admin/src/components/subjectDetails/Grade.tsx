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
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  assignSubjectToGrade,
  getGradesformSubject,
} from "../../redux/reducers/subjectsReducer";
import { selectBoxOptions } from "../../utils/functions";
import {
  deleteGradeWithParams,
  getGradeList,
  setGradeStatus,
} from "../../redux/reducers/gradeReducer";
import ActionDropdown from "../shared/ActionDropdown";

const Grade = () => {
  const dispatch = useDispatch();
  const columns = [
    {
      name: "Grade name",
      selector: (row: any) => row.name,
    },
    {
      name: "No. of Classes",
      selector: (row: any) => row.class,
    },
    {
      name: " Total No. of Student",
      selector: (row: any) => row.student,
    },
    {
      name: "Status",
      selector: (row: any) => (
        <SwitchBox
          value={row.status === "1" ? true : false}
          onChange={() => {
            dispatch(setGradeStatus(row.id));
            // dispatch(setStudentStatus(item.id));
          }}
        />
      ),
    },
    {
      name: "Actions",
      selector: (row: any) => row.action,
    },
  ];

  // -------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [filter, setFilter] = useState<any>({
    search: "",
    filter_status: "",
  });
  const param = useParams();
  const subjectGradeState = useSelector(
    (state: RootState) => state.subjects.grades
  );
  const gradeState = useSelector(
    (state: RootState) => state.grade?.gradeList?.grades
  );
  const [assignedGrade, setAssignedGrade] = useState<any>(null);

  const schoolID = useSelector((state: RootState) => state?.school?.schoolID);
  // ------------ functions ------------
  const handleChange = (e: any) => {
    setAssignedGrade(e.target.value);
  };

  // ------------ side effects -------------
  useEffect(() => {
    dispatch(
      getGradesformSubject({
        data: { paginate: 10, school_id: schoolID },
        id: param.id,
      })
    );
    dispatch(getGradeList({ school_id: schoolID }));
  }, []);
  // console.log(gradeState)

  const [rows, setRows] = useState<any>([]);
  const navigate = useNavigate();
  useEffect(() => {
    setRows(
      subjectGradeState?.data?.map((item: any) => {
        return {
          ...item,
          action: (
            <ActionDropdown
              actions={[
                {
                  name: <p className="cursor-pointer">Edit</p>,
                  action: () => {
                    navigate(`/school/edit/${item?.id}`);
                  },
                },
                {
                  name: <p className="text-red cursor-pointer">Delete</p>,
                  action: async () => {
                    await dispatch(
                      // @ts-ignore
                      deleteGradeWithParams({
                        body: {
                          subject_id: item?.gradesubjectscholl?.subject_id,
                        },
                        params: item?.id,
                      })
                    )
                      .unwrap()
                      .then(() => {
                        dispatch(
                          getGradesformSubject({
                            data: { paginate: 10, school_id: schoolID },
                            id: param.id,
                          })
                        );
                      });
                  },
                },
              ]}
            />
          ),
        };
      })
    );
  }, [schoolID, param.id]);
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
                  Assign Grade
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
                      Grade <span className="text-red">*</span>
                    </label>
                    <SelectBox
                      values={
                        gradeState?.length > 0
                          ? selectBoxOptions(gradeState, "name")
                          : []
                      }
                      onChange={handleChange}
                      id="grade_id"
                      name="grade_id"
                      value={assignedGrade}
                    />
                  </div>
                </Box>
                <Button
                  onClick={async () => {
                    await dispatch(
                      assignSubjectToGrade({
                        id: param.id,
                        data: {
                          grade_id: [assignedGrade],
                          school_id: schoolID,
                        },
                      })
                    );
                    await dispatch(
                      getGradesformSubject({
                        data: { paginate: 10, school_id: schoolID },
                        id: param.id,
                      })
                    );
                    setAssignedGrade({});
                  }}
                  label="Assgin"
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
                onClick={() => {
                  dispatch(
                    getGradesformSubject({
                      data: {
                        paginate: 10,
                        school_id: schoolID,
                        search: "",
                        status: "",
                      },
                      id: param.id,
                    })
                  );
                  setFilter({ search: "", filter_status: "" });
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
              onClick={() => {
                setIsFiltered(!isFiltered);
              }}
              className="w-30 m-3"
            />
            {/* setFilter({search:'', filter_status:''}) */}
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
                <label className="text-sm font-semibold mb-1">Grade Name</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="studentName"
                  name="studentName"
                  value={filter.search}
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
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
                <label className="text-sm font-semibold mb-1">status</label>
                <SelectBox
                  values={[
                    {
                      label: "active",
                      value: "1",
                    },
                    {
                      label: "Inactive",
                      value: "0",
                    },
                  ]}
                  onChange={(e: any) => {
                    setFilter((prev: any) => {
                      return {
                        ...prev,
                        filter_status: e.target.value,
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
                    getGradesformSubject({
                      data: {
                        paginate: 10,
                        school_id: schoolID,
                        search: filter.search,
                        status: filter.filter_status,
                      },
                      id: param.id,
                    })
                  );
                }}
              />
            </Grid>
          </Grid>
        )}
        <DataTable data={rows} columns={columns} />
        <Pagination
          from={subjectGradeState?.from}
          to={subjectGradeState?.to}
          lastPage={subjectGradeState?.last_page}
          currentPage={subjectGradeState?.current_page}
          total={subjectGradeState?.total}
          perPage={subjectGradeState?.per_page}
        />
      </Box>
    </Box>
  );
};

export default Grade;
