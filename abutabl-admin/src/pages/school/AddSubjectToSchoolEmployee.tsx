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
} from "../../redux/reducers/subjectsReducer";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import DataTable from "../../components/shared/DataTable";
import SwitchBox from "../../components/shared/SwitchBox";
import AssignSubjectModal from "../../components/modals/AssignSubjectModal";

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

const Subjects = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const param = useParams();
  const subjectState = useSelector((state: RootState) => state.subjects);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<any>([]);
  // ------------- functions ---------------

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRowClick = (row: any) => {
    navigate(`/subjects/${row.id}`);
  };
  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSubjectsList({}));
  }, []);

  useEffect(() => {
    const tableData = subjectState?.subjectsList?.subjects
      ?.filter((item: any) => {
        return subject?.includes(item.id);
      })
      ?.map((item: any) => {
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
              onChange={() => {}}
            />
          ),
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                {
                  name: "Edit",
                  action: () => {
                    navigate(`subject/edit/${item.id}`);
                  },
                },
                {
                  name: "Delete",
                  action: async () => {},
                },
              ]}
            />
          ),
        };
      });

    setRows({
      subjects: tableData,
    });
  }, [subjectState?.subjectsList, subject]);

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
            <Searchbar />
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
                label="Assign subject"
                className="w-30 m-3"
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
          )}
          <DataTable
            handleRowClick={handleRowClick}
            data={rows.subjects}
            columns={columns}
          />
          <Pagination
            from={0}
            to={rows?.subjects?.length}
            lastPage={1}
            currentPage={1}
            total={rows?.subjects?.length}
            perPage={20}
          />
        </Box>
      </Box>
      <AssignSubjectModal
        open={open}
        onClose={handleClose}
        setSubject={setSubject}
        subject={subject}
      />
    </>
  );
};

export default Subjects;
