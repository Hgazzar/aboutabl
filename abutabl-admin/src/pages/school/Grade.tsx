import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import InfoCard from "../../components/shared/InfoCard";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../../components/shared/SwitchBox";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteGrade,
  getGradeList,
  setGradeStatus,
} from "../../redux/reducers/gradeReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";

const columns = [
  {
    name: "Grade Name",
    selector: (row: any) => row.name,
    width: "80%",
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

const Grade = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gradeState = useSelector((state: RootState) => state.grade);
  const [isLoading, setIsLoading] = useState(true);

  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    navigate(`/school/grade/${row.id}`);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    (async () => {
      await dispatch(getGradeList({ paginate: 10 }));
      setIsLoading(false);
    })();
  }, []);

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
                  navigate(`/school/grade/edit/${item.id}`);
                },
              },
              {
                name: "Delete",
                action: async () => {
                  await dispatch(deleteGrade(item.id));
                  await dispatch(getGradeList({ paginate: 10 }));
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
        <Typography variant="h5">Grade</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => navigate("add-grade")}
            label="Add grade"
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <Box>
        <Grid container gap={1} sx={{ py: 4, justifyContent: "center" }}>
          <InfoCard title={"No. of grade"} value={rows.total_grades} />
          <InfoCard title={"No. of classes"} value={rows.total_classes} />
          <InfoCard title={"No. of students"} value={rows.total_student} />
          <InfoCard title={"New Grades"} value={rows.total_new_grades} />
        </Grid>
      </Box>
      <Box
        sx={{
          mx: 2,
          mb: 2,
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
            <Grid item xs={12} sm={5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Grade name</label>
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
            <Grid item xs={12} sm={5}>
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
          data={rows?.grades}
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
        />
      </Box>
    </Box>
  );
};

export default Grade;
