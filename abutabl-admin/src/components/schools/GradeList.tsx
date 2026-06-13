import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import DataTable from "../../components/shared/DataTable";
import InfoCard from "../../components/shared/InfoCard";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../../components/shared/SwitchBox";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteGrade,
  getGradeList,
  setGradeStatus,
} from "../../redux/reducers/gradeReducer";
import ActionDropdown from "../shared/ActionDropdown";
import AssignModal from "../modals/AssignModal";
import SelectBox from "../shared/SelectBox";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";



const Grade = () => {

  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsGrades = permissionState?.permissions?.grades;

  const editGrades = permissionsGrades?.find((permission:any) => permission['edit-grades'] === "1")
  const deleteGrades = permissionsGrades?.find((permission:any) => permission['delete-grades'] === "1")
  const addGrades = permissionsGrades?.find((permission: any) => permission["add-grades"] === "1")
  const viewGrades = permissionsGrades?.find((permission: any) => permission["view-grades"] === "1")
  const activationGrades = permissionsGrades?.find((permission: any) => permission["activation-grades"] === "1")

  const columns = [
    {
      name: "Grade Name",
      selector: (row: any) => row.name,
      width: "80%",
    },
    activationGrades?
    {
      name: "Status",
      selector: (row: any) => row.status,
      width: "7%",
      center: true,
    }
    :
    ''
    ,
    (editGrades || deleteGrades) ?
    {
      name: "Action",
      selector: (row: any) => row.action,
      width: "7%",
      center: true,
    } 
    : ''
    ,
  ];
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gradeState = useSelector((state: RootState) => state.grade);
  const param = useParams();
  const [open, setOpen] = useState<boolean>(false);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<any>(null);
  const [filter, setFilter] = useState<any>({
    search: "",
    filter_status: "",
  });
  const [currentPage, setCurrentPage] = useState(0);

  // ------------- functions ---------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    viewGrades &&
    navigate(`/school/grade/${row.id}`);
  };

  const handleChangePage = async (page: number) => {
    await dispatch(getGradeList({ paginate: 10, page, school_id: param?.id }));
    setCurrentPage(page);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getGradeList({ paginate: 10, school_id: param?.id }));
  }, [param?.id]);

  useEffect(() => {
    const tableData = gradeState?.gradeList?.grades?.data?.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        classes: item.num_classes,
        students: item.num_students,
        status: (
          <SwitchBox
            value={item.status === "1" ? true : false}
            onChange={() => {
              dispatch(setGradeStatus(item.id));
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
                  navigate(`/school/edit/${item.id}`);
                },
              },
              {
                name: "Assign",
                action: () => {
                  setGradeId(item.id);
                  handleOpen();
                },
              },
              {
                name: "Delete",
                action: () => {
                  setGradeToDelete(item);
                  setDeleteModalOpen(true);
                },
              },
            ]}
          />
        ),
      };
    });

    setRows({
      ...gradeState?.gradeList,
      grades: tableData,
    });
  }, [gradeState?.gradeList]);

  return (
    <>
      <Box>
        <Grid sx={{ my: 2 }} container gap={2}>
          <InfoCard title="No. of Grades" value={rows?.total_grades} />
          <InfoCard title="Active Grades" value={rows?.total_grades_active} />
          <InfoCard
            title="In-active Grades"
            value={rows?.total_grades_inactive}
          />
          <InfoCard title="New Grades" value={rows?.total_new_grades} />
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
              {
                addGrades &&
                <Button
                  onClick={() => {
                    navigate(`/school/add-grade/${param?.id}`);
                  }}
                  label="Add Grade & classes"
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
                    getGradeList({ paginate: 10, school_id: param?.id })
                  );
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
              sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
            >
              <Grid item xs={12} sm={4}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Grade name
                  </label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="gradeName"
                    name="gradeName"
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
                      getGradeList({
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
            data={rows.grades}
            columns={columns}
            handleRowClick={handleRowClick}
          />
          <Pagination
            from={gradeState?.gradeList?.grades?.from}
            to={gradeState?.gradeList?.grades?.to}
            lastPage={gradeState?.gradeList?.grades?.last_page}
            currentPage={gradeState?.gradeList?.grades?.current_page}
            total={gradeState?.gradeList?.grades?.total}
            perPage={gradeState?.gradeList?.grades?.per_page}
            handleChangePage={handleChangePage}
          />
        </Box>
      </Box>
      <AssignModal
        open={open}
        onClose={handleClose}
        id={ [gradeId] }
        // id={{ grade_id: gradeId }}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGradeToDelete(null);
        }}
        onConfirm={async () => {
          if (gradeToDelete) {
            await dispatch(deleteGrade(gradeToDelete.id));
            await dispatch(
              getGradeList({
                paginate: 10,
                school_id: param?.id,
                page: currentPage,
              })
            );
            setDeleteModalOpen(false);
            setGradeToDelete(null);
          }
        }}
        item="Grade"
      />
    </>
  );
};

export default Grade;
