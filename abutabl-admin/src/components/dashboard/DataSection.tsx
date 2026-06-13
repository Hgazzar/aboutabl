import { Box, Divider, Typography } from "@mui/material";
import React from "react";
import Dropdown from "../shared/Dropdown";

const DataSection = ({ chart: Chart }: any) => {
  return (
    <>
      <Box
        sx={{
          boxShadow: "unset",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          bgcolor: "#fff",
          m: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <h4 className="font-semibold text-xl">Title</h4>
          <Dropdown
            actions={[
              { name: "Last year", onClick: () => {} },
              { name: "Next year", onClick: () => {} },
            ]}
          />
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            overflow: "auto",
          }}
        >
          <Chart />
        </Box>
      </Box>
    </>
  );
};

export default DataSection;
