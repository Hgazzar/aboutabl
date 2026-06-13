import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

const FatherInfo = ({ data }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Father information
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Father Name
            </label>
            <p className="text-dark font-semibold mt-1">{data?.fatherNameEn}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Email
            </label>
            <p className="text-dark font-semibold mt-1">{data?.fatherEmail}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Job title
            </label>
            <p className="text-dark font-semibold mt-1">{data?.fatherJob}</p>
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">ID</label>
            <p className="text-dark font-semibold mt-1">{data?.fatherNID}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Phone
            </label>
            <p className="text-dark font-semibold mt-1">{data?.fatherPhone}</p>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default FatherInfo;
