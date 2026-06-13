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
  getSubjectDetails,
  getSubjectsList,
  setSubjectStatus,
} from "../../redux/reducers/subjectsReducer";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import DataTable from "../shared/DataTable";
import SwitchBox from "../shared/SwitchBox";
import AddSubjectToSchool from "../modals/AddSubjectToSchoolModal";

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
  {
    name: "Status",
    selector: (row: any) => row.status,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
  },
];

const Subjects = ({ schoolID }: any) => {
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const param = useParams();
  const subjectState = useSelector((state: RootState) => state.subjects);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const editsubjects = permissionState?.permissions?.subjects?.find(
    (p: any) => p["edit-subjects"] === "1"
  );
  const deletesubjects = permissionState?.permissions?.subjects?.find(
    (p: any) => p["delete-subjects"] === "1"
  );
  const [open, setOpen] = useState(false);
  // ------------- functions ---------------
  const handleChangePage = (page: number) => {
    dispatch(getSubjectsList({ paginate: 10, page }));
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRowClick = (row: any) => {
    navigate(`/subjects/${row.id}`);
  };
  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSubjectsList({ paginate: 10, school_id: schoolID }));
  }, [schoolID]);

  useEffect(() => {
    const tableData = subjectState?.subjectsList?.subjects?.data.map(
      (item: any) => {
        const rowActions = [
          editsubjects && {
            name: "Edit",
            action: () => navigate(`/subjects/edit/${item.id}`),
          },
          deletesubjects && {
            name: "Delete",
            action: async () => {},
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
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={async () => {
                await dispatch(setSubjectStatus({ id: item.id }));
              }}
            />
          ),
          action: rowActions.length > 0 ? (
            <ActionDropdown id={item.id} actions={rowActions} />
          ) : null,
        };
      }
    );

    setRows({
      ...subjectState?.subjectsList?.subjects,
      subjects: tableData,
    });
  }, [subjectState?.subjectsList, editsubjects, deletesubjects]);

  // console.log(subjectState?.subjectsList);
  // console.log(subjectState?.subjectsList);
  
  return (
    <>
      <Box>
        <Box
          sx={{
            mx: 2,
            m: 2,
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
            <Typography variant="h6"> Subjects </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {" "}
              <Button
                onClick={() => {
                  handleOpen();
                }}
                label="Add subject"
                className="w-30 m-3"
                type="bordered"
              />
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
              columnGap={5}
              sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
            >
              <Grid item xs={12} sm={5.5}>
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
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
              <Grid item xs={12} sm={5.5}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Status</label>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    size="small"
                    id="status"
                    placeholder="Active"
                    name="status"
                    sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  />
                </div>
              </Grid>
            </Grid>
          )} */}
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
        schoolID={schoolID}
      />
    </>
  );
};

export default Subjects;
