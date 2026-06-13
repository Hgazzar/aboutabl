import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

const BasicView = ({ data }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Basic info
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
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              First name
            </label>
            <p className="text-dark font-semibold mt-1">{data?.name}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Email
            </label>
            <p className="text-dark font-semibold mt-1">{data?.email}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Date of birth
            </label>
            <p className="text-dark font-semibold mt-1">{data?.birthday}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Experience
            </label>
            <p className="text-dark font-semibold mt-1">
              {data?.specialization_en}
            </p>
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Phone
            </label>
            <p className="text-dark font-semibold mt-1">{data?.phone}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Gender
            </label>
            <p className="text-dark font-semibold mt-1">{data?.gender}</p>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicView;
