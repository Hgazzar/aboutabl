import { Box, Divider, Typography } from "@mui/material";
import React, { useState } from "react";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import DataTable from "../shared/DataTable";
import AddedQuestion from "./AddedQuestion";
const columns = [
  {
    name: "File name",
    selector: (row: any) => row.name,
    width: "85%",
  },
  {
    name: "Creation date",
    selector: (row: any) => row.creat,
  },
];
const data = [
  {
    id: 1,
    name: "Question name here",
    creat: "17 april 2023",
  },
  {
    id: 2,
    name: "Question name here",
    creat: "17 april 2023",
  },
  {
    id: 3,
    name: "Question name here",
    creat: "17 april 2023",
  },
];

const QuestionBank = () => {
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
        <Typography
          component={"p"}
          sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
        >
          Question bank
        </Typography>
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
        </Box>
        <Divider />
        <Box>
          <DataTable data={data} columns={columns} />
          <Pagination />
        </Box>
      </Box>
      <AddedQuestion />
    </Box>
  );
};

export default QuestionBank;
