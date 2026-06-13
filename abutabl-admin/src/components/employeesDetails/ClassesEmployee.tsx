import { Box, Divider, Grid, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Searchbar from "../shared/Searchbar";
import Button from "../shared/Button";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import AssignClassModal from "../modals/AssignClassModal";
import { useParams } from "react-router-dom";
import { getClassList } from "@/redux/reducers/commonReducer";
import ActionDropdown from "../shared/ActionDropdown";
import SwitchBox from "../shared/SwitchBox";
import { setClassStatus } from "@/redux/reducers/classesReducer";

const columns = [
  {
    name: "Class Name",
    selector: (row: any) => row.name,

    width: "80%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
  },
];

const ClassesEmployee = ({ schoolId = "" }: any) => {
  // ---------- hooks ------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>([]);
  const classesState = useSelector(
    (state: RootState) => state?.common?.classList
  );
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<any>([]);
  const [grades, setGrades] = useState<any>([]);
  const param = useParams();
  const dispatch = useDispatch();
  
  // ------------- functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // ------------ side effects ------------
  useEffect(() => {
    dispatch(getClassList({ teacher_id: param.id }));
  }, []);

  useEffect(() => {
    classesState &&
    setRows(
      classesState?.map((item: any) => {
        return {
          ...item,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={() => {
                dispatch(setClassStatus(item.id));
              }}
            />
          ),
        };
      })
    );
  }, [classesState]);

  return (
    <>
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
              label="Add classes"
              className="w-30 m-3"
              onClick={handleOpen}
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
            <Grid item xs={12} sm={3.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Class name</label>
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
            <Grid item xs={12} sm={3.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Total No. of student
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="total"
                  name="total"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.5}>
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
        <DataTable data={rows} columns={columns} />
        {/* <Pagination
          from={classesState?.classList?.classes?.from}
          to={classesState?.classList?.classes?.to}
          lastPage={classesState?.classList?.classes?.last_page}
          currentPage={classesState?.classList?.classes?.current_page}
          total={classesState?.classList?.classes?.total}
          perPage={classesState?.classList?.classes?.per_page}
        /> */}
      </Box>
      <AssignClassModal
        employeeId={param.id}
        open={open}
        onClose={handleClose}
        classes={classes}
        setClasses={setClasses}
        grades={grades}
        schoolId={schoolId}
        setGrades={setGrades}
      />
    </>
  );
};

export default ClassesEmployee;
