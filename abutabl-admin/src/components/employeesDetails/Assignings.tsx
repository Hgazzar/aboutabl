import { Box, Divider, Grid, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Searchbar from "../shared/Searchbar";
import Button from "../shared/Button";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import { RootState } from "../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import AssignModal from "../modals/AssignModal";
import { useParams } from "react-router-dom";
import { getAssigningList } from "@/redux/reducers/commonReducer";
import ActionDropdown from "../shared/ActionDropdown";
import { deleteAssigning } from "@/redux/reducers/schoolReducer";
import SwitchBox from "../shared/SwitchBox";
import { setClassStatus } from "@/redux/reducers/classesReducer";

const columns = [
  {
    name: "No of students",
    selector: (row: any) => row.students_count,
  },
  {
    name: "Date",
    selector: (row: any) => row.created_at,
  },
  {
    name: "Subject",
    selector: (row: any) => row?.subject?.name,
  },
  {
    name: "Assign",
    selector: (row: any) => row.type,
  },
];

const Assignings = () => {
  const [rows, setRows] = useState<any>([]);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const param = useParams();
  const schoolId = useSelector(
    (state: RootState) => state?.employee?.employeeDetails?.school_id
  );
  const assignList = useSelector(
    (state: RootState) => state?.common?.assigningList?.assigning?.data
  );

  //   ------------ function -------------
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  //   ------------ side effect -------------
  useEffect(() => {
    dispatch(getAssigningList(param.id));
  }, []);

  useEffect(() => {
    setRows(
      assignList?.map((item: any) => {
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
  }, [assignList]);

  return (
    <>
      <Box
        sx={{
          mr: 2,
          my: 2,
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
            {/* <Button label="Export" type="bordered" className="w-30 m-3" /> */}
            <Button
              label="Assign"
              onClick={() => {
                handleOpen();
              }}
              className="w-30 m-3"
            />
          </Box>
        </Box>
        <Divider />

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
      <AssignModal
        open={open}
        onClose={handleClose}
        schoolId={schoolId}
        isTeacher={true}
      />
    </>
  );
};

export default Assignings;
