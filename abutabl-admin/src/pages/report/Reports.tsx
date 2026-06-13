import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import SwitchBox from "../../components/shared/SwitchBox";
import CloseIcon from "@mui/icons-material/Close";
import SelectBox from "../../components/shared/SelectBox";
import PendingIcon from "@mui/icons-material/Pending";
import ActionDropdown from "../../components/shared/ActionDropdown";

const columns = [
  {
    name: "Student Name",
    selector: (row: any) => row.name,
    width: "20%",
  },
  {
    name: "Grade",
    selector: (row: any) => row.grade,
    width: "20%",
  },
  {
    name: "Class",
    selector: (row: any) => row.class,
    width: "20%",
  },
  {
    name: "School",
    selector: (row: any) => row.school,
    width: "20%",
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
const data = [
  {
    id: 1,
    name: "ahmed mealy ",
    grade: "KG2",
    class: "Class name ",
    school: "school name here ",
    status: <SwitchBox />,
    action: (
      <ActionDropdown
        actions={[
          {
            name: "Edit",
          },
          {
            name: "Delete",
          },
        ]}
      />
    ),
  },
  {
    id: 2,
    name: "ahmed mealy ",
    grade: "KG2",
    class: "Class name ",
    school: "school name here ",
    status: <SwitchBox />,
    action: (
      <ActionDropdown
        actions={[
          {
            name: "Edit",
          },
          {
            name: "Delete",
          },
        ]}
      />
    ),
  },
  {
    id: 3,
    name: "ahmed mealy ",
    grade: "KG2",
    class: "Class name ",
    school: "school name here ",
    status: <SwitchBox />,
    action: (
      <ActionDropdown
        actions={[
          {
            name: "Edit",
          },
          {
            name: "Delete",
          },
        ]}
      />
    ),
  },
];
const Reports = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});

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
        <Typography variant="h5">Reports name 1</Typography>{" "}
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
            {isFiltered && (
              <Typography
                component={"p"}
                sx={{
                  color: "#1EBBA3",
                  fontWeight: "400",
                  mx: 4,
                  cursor: "pointer",
                }}
              >
                Clear filters
              </Typography>
            )}
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
            columnGap={1}
            sx={{ bgcolor: "#F7F9FA", justifyContent: "space-between", p: 3 }}
          >
            <Grid item xs={12} sm={3.6}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Report name
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="questionName"
                  name="questionName"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.6}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Report name
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="questionType"
                  name="questionType"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.6}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Report </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="creatAt"
                  name="creatAt"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
          </Grid>
        )}
        <DataTable data={data} columns={columns} />
        <Pagination />
      </Box>
    </Box>
  );
};

export default Reports;
