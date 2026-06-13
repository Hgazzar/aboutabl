import { Box, Divider, Grid, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Searchbar from "../shared/Searchbar";
import Button from "../shared/Button";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import AssignModal from "../modals/AssignModal";
import { getTodosList } from "@/redux/reducers/commonReducer";
import { useParams } from "react-router-dom";
import ActionDropdown from "../shared/ActionDropdown";
import { deleteAssigning } from "@/redux/reducers/schoolReducer";
import { getStudentDetails } from "@/redux/reducers/studentReducer";

const formatDueDateCell = (val: string | null | undefined) => {
  if (val == null || val === "") return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const columns = [
  {
    name: "Teacher Name",
    selector: (row: any) =>
      row?.teacher?.name || row?.teacher?.name_ar || "—",
  },
  {
    name: "Subject",
    selector: (row: any) => row?.subject?.name,
  },
  {
    name: "To do",
    selector: (row: any) => row.assigned_name,
  },
  {
    name: "Assigned on",
    selector: (row: any) => row.created_at,
  },
  {
    name: "Due date",
    selector: (row: any) => formatDueDateCell(row.due_date),
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
  },
];

const ToDos = () => {
  const [rows, setRows] = useState<any>([]);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const param = useParams();
  const schoolId = useSelector(
    (state: RootState) => state?.student?.studentDetails?.school_id
  );
  const todosList = useSelector(
    (state: RootState) => state?.common?.todosList?.todoList?.data
  );
  const todosListTest = useSelector(
    (state: RootState) => state?.common?.todosList
  );

  // console.log(todosListTest);

  //   ------------ function -------------
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  //   ------------ side effect -------------
  const studentState = useSelector((state: RootState) => state.student);
      useEffect(() => {
      dispatch(getStudentDetails(param.id));
    }, []);

    
   // ------------- side effects ---------------

  useEffect(() => {
    dispatch(getTodosList(param.id));
  }, []);

  useEffect(() => {
    setRows(
      todosList?.map((item: any) => {
        return {
          ...item,
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                {
                  name: "Delete",
                  action: async () => {
                    await dispatch(deleteAssigning(item.id));
                    await dispatch(getTodosList(param.id));
                  },
                },
              ]}
            />
          ),
        };
      })
    );
  }, [todosList]);

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
      <AssignModal open={open} onClose={handleClose} schoolId={schoolId} student={studentState}/>
    </>
  );
};

export default ToDos;
