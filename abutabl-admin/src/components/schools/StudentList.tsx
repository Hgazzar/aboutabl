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
import AssignModal from "../modals/AssignModal";
import InfoCard from "../shared/InfoCard";
import axios from "axios";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const Students = () => {
  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionsstudents = permissionState?.permissions?.students;

  const editstudents = permissionsstudents?.find(
    (permission: any) => permission["edit-students"] === "1"
  );
  const deletestudents = permissionsstudents?.find(
    (permission: any) => permission["delete-students"] === "1"
  );
  const addstudents = permissionsstudents?.find(
    (permission: any) => permission["add-students"] === "1"
  );
  const viewstudents = permissionsstudents?.find(
    (permission: any) => permission["view-students"] === "1"
  );
  const activationstudents = permissionsstudents?.find(
    (permission: any) => permission["activation-students"] === "1"
  );
  const exportstudents = permissionsstudents?.find(
    (permission: any) => permission["export-students"] === "1"
  );

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
    activationstudents
      ? {
          name: "Status",
          selector: (row: any) => row.status,
        }
      : "",
    {
      name: "Action",
      selector: (row: any) => row.action,
    },
  ];

  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const studentState = useSelector((state: RootState) => state.student);
  const [studentId, setStudentId] = useState<number | null>(null);
  const param = useParams();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);

  // ------------- functions ---------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    viewstudents && navigate(`/user/student/view/${row.id}`);
  };
  const handleChangePage = (page: number) => {
    dispatch(getStudentList({ paginate: 10, page, school_id: param?.id }));
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getStudentList({ paginate: 10, page: 1, school_id: param?.id }));
  }, [param?.id]);

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
                editstudents
                  ? {
                      name: "Edit",
                      action: () => {
                        navigate(`/user/student/edit/${item.id}`);
                      },
                    }
                  : "",
                addstudents
                  ? {
                      name: "Assign",
                      action: () => {
                        setStudentId(item.id);
                        handleOpen();
                      },
                    }
                  : "",
                deletestudents
                  ? {
                      name: "Delete",
                      action: () => {
                        setStudentToDelete(item);
                        setDeleteModalOpen(true);
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
  const [filter, setFilter] = useState({
    search: "",
  });
  const importStudent = () => {
    dispatch(exportStudentList({ school_id: param.id }))
      .unwrap()
      .then((res: any) => {
        window.open(res.path, "_blank");
        // console.log(res);
      });
  };

  const headers = {
    apiSecret: `${process.env.REACT_APP_API_SECRET}`,
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
        await dispatch(uploadStudents({ school_id: param.id, file }));
        await dispatch(getStudentList({ paginate: 10, school_id: param.id }));
      }
      setFile(null);
      setIsUploading(false);
    })();
  }, [file]);

  return (
    <>
      <Box>
        <Grid sx={{ my: 2 }} container gap={2}>
          <InfoCard
            title="No. of Students"
            value={studentState?.studentList?.students_count}
          />
          <InfoCard
            title="Active Students"
            value={studentState?.studentList?.students_active}
          />
          <InfoCard
            title="In-active Students"
            value={studentState?.studentList?.students_inactive}
          />
          <InfoCard
            title="New Students"
            value={studentState?.studentList?.students_new}
          />
        </Grid>
        <Box
          sx={{
            my: 2,
            mr: 2,
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
                      getStudentList({
                        paginate: 10,
                        page: 1,
                        school_id: param?.id,
                        search: "",
                      })
                    );
                  }}
                >
                  Clear filters
                </Typography>
              )}
              {addstudents && (
                <Button
                  onClick={() => {
                    navigate(`/school/add-student/${param?.id}`);
                  }}
                  label="Add Student"
                  className="w-30 m-3"
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
                </>
              )}

              {!isUploading && addstudents && (
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

              <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => {
                  setIsFiltered(!isFiltered);
                  setFilter({ search: "" });
                }}
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
                    value={filter.search}
                    onChange={(e: any) => {
                      setFilter((prev: any) => {
                        return {
                          ...prev,
                          search: e.target.value,
                        };
                      });
                    }}
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={3.5}>
                <Button
                  label="Filter"
                  className="w-40 mt-6"
                  onClick={() => {
                    dispatch(
                      getStudentList({
                        paginate: 10,
                        page: 1,
                        school_id: param?.id,
                        search: filter.search,
                      })
                    );
                  }}
                />
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
      <AssignModal open={open} onClose={handleClose} id={[studentId]} />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={async () => {
          if (studentToDelete) {
            await dispatch(deleteStudent(studentToDelete.id));
            await dispatch(
              getStudentList({ paginate: 10, school_id: param?.id })
            );
          }
        }}
        item="Student"
      />
    </>
  );
};

export default Students;
