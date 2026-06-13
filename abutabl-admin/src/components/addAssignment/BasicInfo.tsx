import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import TextEditor from "../shared/TextEditor";
import CustomedDatePicker from "../shared/DatePicker";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const BasicInfo = ({ formik, values, onChange }: InfoProps) => {
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
        Basic information
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
            <label className="text-sm font-semibold mb-1">
              Assignment title [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="assignment_en"
              onChange={onChange}
              value={values.assignment_en}
              name="assignment_en"
              placeholder="ex (Subtraction exersice)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              {" "}
              Start date <span className="text-red">*</span>
            </label>

            <CustomedDatePicker formik={formik} id="birthday" name="birthday" />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Assignment title [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="assignment_ar"
              onChange={onChange}
              value={values.assignment_ar}
              name="assignment_ar"
              placeholder="ex (Subtraction exersice)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Date of birth</label>

            <CustomedDatePicker formik={formik} id="birthday" name="birthday" />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
