import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
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
import { buildTemplateUrl } from "../../utils/fetchMethods";
import {
  deleteStudent,
  getStudentList,
  exportStudentList,
  setStudentStatus,
  uploadStudents,
} from "../../redux/reducers/studentReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";

const columns = [
  {
    name: "Student Name",
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
    name: "School",
    selector: (row: any) => row.school,
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

const Students = ({ schoolID }: any) => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const permissionState = useSelector((state: RootState) => state.permissions);
  const addstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["add-students"] === "1"
  );
  const editstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["edit-students"] === "1"
  );
  const deletestudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["delete-students"] === "1"
  );
  const activationstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["activation-students"] === "1"
  );
  const exportstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["export-students"] === "1"
  );
  const studentState = useSelector((state: RootState) => state.student);

  const param = useParams();
  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    navigate(`/user/student/view/${row.id}`);
  };
  const handleChangePage = (page: number) => {
    dispatch(getStudentList({ paginate: 10, page, school_id: schoolID }));
  };

  const importStudent = () => {
    dispatch(exportStudentList({ school_id: schoolID }))
      .unwrap()
      .then((res: any) => {
        window.open(res.path, "_blank");
      });
  };

  const downloadBlankFile = async () => {
    window.open(
      buildTemplateUrl(process.env.REACT_APP_BASE_URL, "/Students Template.xlsx"),
      "_blank"
    );
  };

  const [file, setFile] = useState<any>(null);
  const fileInput: any = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsUploading(true);
      if (file) {
        await dispatch(uploadStudents({ school_id: schoolID, file }));
        await dispatch(getStudentList({ paginate: 10, school_id: schoolID }));
      }
      setFile(null);
      setIsUploading(false);
    })();
  }, [file]);

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getStudentList({ paginate: 10, page: 1, school_id: schoolID }));
  }, [schoolID]);

  useEffect(() => {
    const tableData = studentState?.studentList?.students?.data?.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          grade: item.grade,
          class: item.class,
          school: item.school,
          joiningDate: item.joining_date,
          status: activationstudents ? (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setStudentStatus(item.id));
              }}
            />
          ) : (
            ""
          ),
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                editstudents
                  ? {
                      name: "Edit",
                      action: () => {
                        navigate(`/user/student/edit/${item.id}`);
                      },
                    }
                  : "",
                deletestudents
                  ? {
                      name: "Delete",
                      action: async () => {
                        await dispatch(deleteStudent(item.id));
                        await dispatch(
                          getStudentList({ paginate: 10, school_id: schoolID })
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
          <Typography variant="h6">School Students</Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {/* {isFiltered && (
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
            )} */}
            {addstudents && (
              <Button
                onClick={() => {
                  navigate(`/school/add-student/${schoolID}`);
                }}
                label="Add Student"
                className="w-30 m-3"
                type="bordered"
              />
            )}
            {exportstudents && (
              <Button
                label="Export"
                type="bordered"
                className="w-30 m-3"
                onClick={importStudent}
              />
            )}
            {addstudents && (
              <>
                <Button
                  label="Download blank excel Template"
                  type="bordered"
                  className="w-30 m-3"
                  onClick={downloadBlankFile}
                />
                <Button
                  onClick={() => {
                    fileInput?.current?.click();
                  }}
                  label="Upload Students"
                  type="bordered"
                  className="w-30 m-3"
                />
                {!isUploading && (
                  <input
                    style={{ display: "none" }}
                    ref={fileInput}
                    type="file"
                    id="file-upload-students"
                    name="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event: any) => {
                      const fileList = event.target.files;
                      if (!fileList) return;
                      setFile(fileList[0]);
                    }}
                  />
                )}
              </>
            )}
            {/* <Button
              label=""
              type="bordered"
              icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
              onClick={() => setIsFiltered(!isFiltered)}
              className="w-30 m-3"
            /> */}
          </Box>
        </Box>
        <Divider />
        {/* {isFiltered && (
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
        )} */}
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

export default Students;
