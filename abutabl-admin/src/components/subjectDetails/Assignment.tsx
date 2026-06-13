import { Box, Grid, Divider, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import DataTable from "../shared/DataTable";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectBox from "../shared/SelectBox";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../shared/SwitchBox";
import ActionDropdown from "../shared/ActionDropdown";

const columns = [
  {
    name: "Assignments name",
    selector: (row: any) => row.name,
    width: "26%",
  },
  {
    name: "Creation date",
    selector: (row: any) => row.creat,
    width: "15%",
  },
  {
    name: "Due date",
    selector: (row: any) => row.due,

    width: "15%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
    width: "15%",
  },
  {
    name: "Marked",
    selector: (row: any) => row.mark,
    width: "15%",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    width: "10%",
  },
];
const data = [
  {
    id: 1,
    name: "Assignment name here",
    creat: "17 april 2023",
    due: "20 april 2025",
    status: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "greenDark",
          bgcolor: "softGreen",
        }}
      >
        Delivered
      </Typography>
    ),
    mark: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "yellowDark",
          bgcolor: "lightYellow",
        }}
      >
        Need action
      </Typography>
    ),
    action: <ActionDropdown id={1} actions={[]} />,
  },
  {
    id: 2,
    name: "Assignment name here",
    creat: "17 april 2023",
    due: "20 april 2025",
    status: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "purble",
          bgcolor: "lightPurble",
        }}
      >
        Late
      </Typography>
    ),
    mark: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "blue",
          bgcolor: "lightBlue",
        }}
      >
        Marked
      </Typography>
    ),
    action: <ActionDropdown id={1} actions={[]} />,
  },
  {
    id: 3,
    name: "Assignment name here",
    creat: "17 april 2023",
    due: "20 april 2025",

    status: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "Red",
          bgcolor: "LightRed",
        }}
      >
        Passed
      </Typography>
    ),
    mark: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "blue",
          bgcolor: "lightBlue",
        }}
      >
        Marked
      </Typography>
    ),
    action: <ActionDropdown id={1} actions={[]} />,
  },
  {
    id: 4,
    name: "Assignment name here",
    creat: "17 april 2023",
    due: "20 april 2025",

    status: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "Red",
          bgcolor: "LightRed",
        }}
      >
        Passed
      </Typography>
    ),
    mark: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "blue",
          bgcolor: "lightBlue",
        }}
      >
        Marked
      </Typography>
    ),
    action: <ActionDropdown id={1} actions={[]} />,
  },
  {
    id: 5,
    name: "Assignment name here",
    creat: "17 april 2023",
    due: "20 april 2025",

    status: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "Red",
          bgcolor: "LightRed",
        }}
      >
        Passed
      </Typography>
    ),
    mark: (
      <Typography
        sx={{
          p: 1,
          px: 2,
          borderRedius: "5px",
          color: "blue",
          bgcolor: "lightBlue",
        }}
      >
        Marked
      </Typography>
    ),
    action: <ActionDropdown id={1} actions={[]} />,
  },
];

const Assignment = () => {
  const [isFiltered, setIsFiltered] = useState(false);

  return (
    <Box>
      <Box
        sx={{
          m: 3,
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
                <label className="text-sm font-semibold mb-1">Quiz name</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="quizName"
                  name="quizName"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Status</label>
                <SelectBox
                  values={[
                    {
                      label: "Available",
                      value: "1",
                    },
                    {
                      label: "Drafted",
                      value: "2",
                    },
                    {
                      label: "Due",
                      value: "3",
                    },
                  ]}
                  onChange={() => {}}
                  id="status_id"
                  name="status_id"
                  value={{
                    label: "Available",
                    value: "1",
                  }}
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

export default Assignment;
