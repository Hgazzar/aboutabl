import { Box, Typography, Divider, TextField, Checkbox } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Button from "../shared/Button";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import Searchbar from "../shared/Searchbar";
import DataTable from "../shared/DataTable";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};
const columns = [
  {
    name: "File name",
    selector: (row: any) => row.name,
    width: "75%",
  },
  {
    name: "Created at",
    selector: (row: any) => row.createdAt,
  },
];
const data = [
  {
    id: 1,
    name: "Unit 1 -introduction to mathematics",
    creat: "17 april 2023",
  },
  {
    id: 2,
    name: "Unit 1 -introduction to mathematics",
    creat: "17 april 2023",
  },
  {
    id: 3,
    name: "Unit 1 -introduction to mathematics",
    creat: "17 april 2023",
  },
];

const Library = ({ formik, values, onChange }: InfoProps) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Searchbar />
        <DataTable data={data} columns={columns} />
      </Box>
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "right",
        }}
      >
        <Button label="Discard" type="bordered" className="w-30 m-3" />
        <Button label="Submit" className="w-30 m-3" />
      </Box>
    </Box>
  );
};

export default Library;
