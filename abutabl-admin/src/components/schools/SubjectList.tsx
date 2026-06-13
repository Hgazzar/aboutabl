import { Box, Grid, Typography, Divider, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import Pagination from "../../components/shared/Pagination";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteSubject,
  getSubjectsList,
  lessonToUnitList,
  setSubjectStatus,
} from "../../redux/reducers/subjectsReducer";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import DataTable from "../shared/DataTable";
import SwitchBox from "../shared/SwitchBox";
import AddSubjectToSchool from "../modals/AddSubjectToSchoolModal";
import { setSchoolID } from "../../redux/reducers/schoolReducer";
import SelectBox from "../shared/SelectBox";
import InfoCard from "../shared/InfoCard";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";



const Subjects = () => {


  const permissionState = useSelector((state: RootState) => state.permissions) 
  const viewsubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["view-subjects"] === "1")
  const addsubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["add-subjects"] === "1")
  const activationsubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["activation-subjects"] === "1")
  const deletesubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["delete-subjects"] === "1")
  const editsubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["edit-subjects"] === "1")

  const columns = [
    {
      name: "Subject Name",
      selector: (row: any) => row.name,
    },
    {
      name: "Units",
      selector: (row: any) => row.unit,
    },
    {
      name: "Lessons",
      selector: (row: any) => row.lesson,
    },
    {
      name: "Grades",
      selector: (row: any) => row.grade,
    },
    {
      name: "Teachers",
      selector: (row: any) => row.teacher,
    },
    activationsubjects ?
    {
      name: "Status",
      selector: (row: any) => row.status,
    }
    : '',
    {
      name: "Action",
      selector: (row: any) => row.action,
    },
  ];

  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const param = useParams();
  const subjectState = useSelector((state: RootState) => state.subjects);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<any>({
    search: "",
    unit_id: "",
    grade_id: "",
    lesson_id: "",
    filter_status: "",
  });

  const [lessonList, setLessonList] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  // ----------- hooks ------------

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChangePage = (page: number) => {
    dispatch(getSubjectsList({ paginate: 10, page }));
  };

  const handleRowClick = (row: any) => {
    viewsubjects &&
    dispatch(setSchoolID(param.id));
    navigate(`/school/subject/${row.id}`);
  };

  useEffect(() => {
    if (filter.unit_id.toString().length) {
      dispatch(lessonToUnitList(filter.unit_id)).then((res: any) => {
        setLessonList(
          res.payload.lessons.map((item: any) => {
            return {
              label: item.name,
              value: item.id,
            };
          })
        );
      });
    }
  }, [filter.unit_id]);

  useEffect(() => {
    dispatch(getSubjectsList({ paginate: 10, school_id: param?.id }));
  }, [param?.id]);

  useEffect(() => {
    const tableData = subjectState?.subjectsList?.subjects?.data.map(
      (item: any) => {
        const rowActions = [
          editsubjects && {
            name: "Edit",
            action: () => navigate(`/subjects/edit/${item?.id}`),
          },
          deletesubjects && {
            name: "Delete",
            action: () => {
              setSubjectToDelete({
                id: item?.id,
                school_id: param?.id,
              });
              setDeleteModalOpen(true);
            },
          },
        ].filter(Boolean);
        return {
          id: item.id,
          name: item.name,
          grade: item.grades,
          teacher: item.teachers,
          lesson: item.lessons_count,
          unit: item.units_count,
          status: (
            activationsubjects ?
            <SwitchBox
              value={item?.subjectschool?.status == "1" ? true : false}
              onChange={() => {
                dispatch(
                  setSubjectStatus({
                    data: {
                      school_id: param.id,
                    },
                    id: item?.id,
                  })
                );
              }}
            />
            : ''
          ),
          action: rowActions.length > 0 ? (
            <ActionDropdown
              id={item?.id}
              actions={rowActions}
            />
          ) : null,
        };
      }
    );

    setRows({
      ...subjectState?.subjectsList?.subjects,
      subjects: tableData,
    });
  }, [subjectState?.subjectsList, editsubjects, deletesubjects, activationsubjects]);

  return (
    <>
      <Box>
        <Grid sx={{ my: 2 }} container gap={2}>
          <InfoCard
            title="No. of Subjects"
            value={subjectState?.subjectsList?.subjects_count}
          />
          <InfoCard
            title="Active Subjects"
            value={subjectState?.subjectsList?.subjects_active}
          />
          <InfoCard
            title="In-active Subjects"
            value={subjectState?.subjectsList?.subjects_inactive}
          />
          <InfoCard
            title="New Subjects"
            value={subjectState?.subjectsList?.subjects_new}
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
              justifyContent: "space-between",
              alignItems: "center",
              p: 3,
            }}
          >
            <div></div>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {" "}
              {
                addsubjects &&
                <Button
                  onClick={() => {
                    handleOpen();
                  }}
                  label="Assign subject"
                  className="w-30 m-3"
                />
              }
              <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => {

                  setIsFiltered(!isFiltered);
                  dispatch(
                    getSubjectsList({ paginate: 10, school_id: param?.id })
                  );
                  setFilter({
                    search: "",
                    unit_id: "",
                    grade_id: "",
                    lesson_id: "",
                    filter_status: "",
                  })
                }}
                className="w-30 m-3"
              />
            </Box>
          </Box>
          <Divider />
          {isFiltered && (
            <Grid
              container
              columnGap={5}
              sx={{ bgcolor: "#F7F9FA", p: 1, justifyContent: "center" }}
            >
              <Grid item xs={12} sm={4}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Subject name
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="search"
                    name="search"
                    onChange={(e: any) => {
                      setFilter({
                        ...filter,
                        search: e.target.value,
                      });
                    }}
                    value={filter.search}
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={4}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Status</label>
                  <SelectBox
                    values={[
                      { label: "Active", value: "1" },
                      { label: "Inactive", value: "0" },
                    ]}
                    value={filter.filter_status}
                    onChange={(e: any) => {
                      setFilter({
                        ...filter,
                        filter_status: e.target.value,
                      });
                    }}
                  />
                </div>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button
                  className="w-40 m-5"
                  label="Filter"
                  onClick={() => {
                    dispatch(
                      getSubjectsList({
                        paginate: 10,
                        school_id: param?.id,
                        ...filter,
                      })
                    );
                  }}
                />
              </Grid>
            </Grid>
          )}
          <DataTable
            handleRowClick={handleRowClick}
            data={rows.subjects}
            columns={columns}
          />
          <Pagination
            from={rows?.from}
            to={rows?.to}
            lastPage={rows?.last_page}
            currentPage={rows?.current_page}
            total={rows?.total}
            perPage={rows?.per_page}
            handleChangePage={handleChangePage}
          />
        </Box>
      </Box>
      <AddSubjectToSchool
        open={open}
        onClose={handleClose}
        schoolID={param?.id}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubjectToDelete(null);
        }}
        item="subject"
        onConfirm={async () => {
          if (subjectToDelete) {
            await dispatch(
              deleteSubject({
                id: subjectToDelete.id,
                data: { school_id: subjectToDelete.school_id },
              })
            );
            await dispatch(
              getSubjectsList({ paginate: 10, school_id: subjectToDelete.school_id })
            );
          }
        }}
      />
    </>
  );
};

export default Subjects;
