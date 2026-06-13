import { Box, Divider, Grid, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import DataTable from "../../components/shared/DataTable";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../../components/shared/SwitchBox";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  getGradeList,
  setGradeStatus,
} from "../../redux/reducers/gradeReducer";
import AssignClassModal from "../../components/modals/AssignClassModal";
import { getEmployeeGrades } from "../../redux/reducers/employeeReducer";
import { getClassList } from "@/redux/reducers/classesReducer";


const Grade = ({ employeeId, schoolId }: any) => {
  const columns = [
    {
      name: "Grade Name",
      selector: (row: any) => row.name,
      width: "40%",
    },
    {
      name: "No. of classes",
      selector: (row: any) => classesState?.classes?.length,
      width: "40%",
    },
  
    {
      name: "Status",
      selector: (row: any) => row.status,
      width: "7%",
      center: true,
    },
    {
      name: "Action",
      selector: (row: any) => row.action,
      width: "7%",
      center: true,
    },
  ];
  
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gradeState = useSelector((state: RootState) => state.grade);
  const param = useParams();
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<any>([]);
  const [grades, setGrades] = useState<any>([]);

  // ------------- functions ---------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    navigate(`/school/grade/${row.id}`);
  };

  
  // ------------- side effects ---------------
  const classesState = useSelector(
    (state: RootState) => state?.common?.classList
  );
  // console.log(classesState?.classes?.length);
  
  useEffect(() => {
    dispatch(getClassList({ teacher_id: employeeId }));
  }, [rows]);
  useEffect(() => {
    dispatch(
      getEmployeeGrades({ id: employeeId, data: { school_id: schoolId } })
    )
      .unwrap()
      .then((result: any) => {
        const tableData = result?.grades?.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            students: item.num_students,
            status: (
              <SwitchBox
                value={item.status === "1" ? true : false}
                onChange={() => {
                  dispatch(setGradeStatus(item.id));
                }}
              />
            ),
            action: <PendingOutlinedIcon sx={{ color: "#1EBBA3" }} />,
          };
        });
        setRows({
          grades: tableData,
        });
      })
  }, [open]);


  // console.log("rows",rows); 
  // console.log(employeeId); 
  
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
              <Button
                onClick={() => {
                  handleOpen();
                }}
                label="Add Grade & classes"
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
            data={rows.grades}
            columns={columns}
            handleRowClick={handleRowClick}
          />
          <Pagination
            from={0}
            to={rows?.grades?.length}
            lastPage={1}
            currentPage={1}
            total={rows?.grades?.length}
            perPage={20}
          />
        </Box>
      </Box>
      <AssignClassModal
        employeeId={employeeId}
        open={open}
        onClose={handleClose}
        classes={classes}
        setClasses={setClasses}
        grades={grades}
        setGrades={setGrades}
        schoolId={schoolId}
      />
    </>
  );
};

export default Grade;
