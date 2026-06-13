import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DataTable from "../../components/shared/DataTable";
import SwitchBox from "../../components/shared/SwitchBox";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteClass,
  getClassList,
  getSingleClassList,
} from "../../redux/reducers/classesReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { exportStudentList } from "@/redux/reducers/studentReducer";

const columns = [
  {
    name: "Student Name",
    selector: (row: any) => row.name,

    width: "40%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,

    width: "7%",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,

    width: "7%",
  },
];

const SingleClasses = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const permissionState = useSelector((state: RootState) => state.permissions);
  const addstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["add-students"] === "1"
  );
  const exportstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["export-students"] === "1"
  );
  const deleteclasses = permissionState?.permissions?.classes?.find(
    (permission: any) => permission["delete-classes"] === "1"
  );
  const classesState = useSelector((state: RootState) => state.classes);
  const param = useParams();
  const navigate = useNavigate();
  // ------------- functions ---------------

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getSingleClassList({ paginate: 10, id: param.id }));
  }, []);

  useEffect(() => {
    const tableData = classesState?.singleClassList?.students?.data?.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
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
                deleteclasses
                  ? {
                      name: "Delete",
                      action: async () => {
                        await dispatch(deleteClass(item.id));
                        await dispatch(
                          getClassList({ paginate: 10, id: param.id })
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
      ...classesState?.singleClassList,
      students: tableData,
    });
  }, [classesState?.singleClassList]);

  const importStudent = () => {
    dispatch(exportStudentList({ class_id: param.id }))
      .unwrap()
      .then((res: any) => {
        window.open(res.path, "_blank");
        // console.log(res);
      });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">{rows?.class}</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {addstudents && (
            <Button
              onClick={() => navigate(`/school/add-student/${param.id}`)}
              label="Add Student"
              className="w-30 m-3"
            />
          )}
        </Box>
      </Box>
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
          <Searchbar />
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {" "}
            {exportstudents && (
              <Button
                label="Export"
                type="bordered"
                className="w-30 m-3"
                onClick={importStudent}
              />
            )}
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
        <DataTable data={rows.students} columns={columns} />
        <Pagination
          from={classesState?.singleClassList?.students?.from}
          to={classesState?.singleClassList?.students?.to}
          lastPage={classesState?.singleClassList?.students?.last_page}
          currentPage={classesState?.singleClassList?.students?.current_page}
          total={classesState?.singleClassList?.students?.total}
          perPage={classesState?.singleClassList?.students?.per_page}
        />
      </Box>
    </Box>
  );
};

export default SingleClasses;
