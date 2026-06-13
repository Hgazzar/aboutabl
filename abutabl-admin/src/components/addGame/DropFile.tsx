import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const DropFile = ({ formik, values, onChange }: InfoProps) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Worksheet thumbanail
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box>
          <div className="lesson-card border p-20 px-24 rounded-lg  border-lightGray cursor-pointer hover:border-green hover:bg-lightGreen flex flex-col items-start gap-1">
            <div className="lesson-card__icon rounded-md w-12 h-12 flex justify-center items-center ml-14">
              <img
                className="w-10 h-10 "
                src={require("../../assets/Ticketing/vuesax/linear/upload.png")}
                alt="bookmark"
              />
            </div>
            <p className="font-semibold pt-2">Drag & Drop file here</p>
            <p className="text-gray text-xs pt-2">
              or click to browse (4mb max)
            </p>
          </div>
          <p className="text-gray text-xs">
            Upload your course image here. it must meet our course image quality
            standard to be accepted. important guidelines 750x422 pixels: .jpg
            .jpeg .gif or .png no text on the image{" "}
          </p>
        </Box>
      </Box>
    </Box>
  );
};

export default DropFile;
