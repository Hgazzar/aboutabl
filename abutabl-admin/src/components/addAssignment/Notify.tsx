import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import TextEditor from "../shared/TextEditor";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";
import SwitchBox from "../shared/SwitchBox";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const Notify = ({ formik, values, onChange }: InfoProps) => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    let display = URL.createObjectURL(fileList[0]);
    setdisplayImages(display);
    formik.setValues({
      ...formik.values,
      photo: fileList[0],
    });
  };

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Notification
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify Students
        </Typography>{" "}
        <SwitchBox id={"status"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify about submission
        </Typography>{" "}
        <SwitchBox id={"status"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify about late submission
        </Typography>{" "}
        <SwitchBox id={"status"} formik={formik} />
      </Box>
    </Box>
  );
};

export default Notify;
