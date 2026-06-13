import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import TextEditor from "../shared/TextEditor";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const Score = ({ formik, values, onChange }: InfoProps) => {
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
        Score
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
            <label className="text-sm font-semibold mb-1">Score method</label>

            <SelectBox
              values={[
                {
                  label: "Points 5",
                  value: "Points 5",
                },
                {
                  label: "Points 2",
                  value: "Points 2",
                },
              ]}
              onChange={onChange}
              id="points"
              name="points"
              value={values.gender}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Score to pass <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="worksheet_ar"
              onChange={onChange}
              value={values.worksheet_ar}
              name="worksheet_ar"
              placeholder="ex (Subtraction exersice)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          px: 3,
        }}
      >
        <div className="flex flex-col gap-0 mb-4 w-full ">
          <label className="text-sm font-semibold mb-1">Attempts allowed</label>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="attempts_id"
            onChange={onChange}
            value={values.worksheet_ar}
            name="attempts_id"
            placeholder="1"
            sx={{ margin: 0, padding: 0 }}
          />
        </div>
      </Box>
    </Box>
  );
};

export default Score;
