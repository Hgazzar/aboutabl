import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

const StudentInfo = ({ formik, values, onChange }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Student information
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          px: 3,
          pt: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Full name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name"
              onChange={onChange}
              value={values.name}
              name="name"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>

          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Date of birth</label>

            <CustomedDatePicker formik={formik} id="birthday" name="birthday" />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Full name [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_ar"
              onChange={onChange}
              value={values.name_ar}
              name="name_ar"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Gender</label>

            <SelectBox
              values={[
                {
                  label: "Male",
                  value: "male",
                },
                {
                  label: "Female",
                  value: "female",
                },
              ]}
              onChange={onChange}
              id="gender"
              name="gender"
              value={values.gender}
            />
          </div>
        </Box>
      </Box>
      <Box sx={{ width: "100%", px: 3, pb: 3 }}>
        <div className="flex flex-col gap-0">
          <label className="text-sm font-semibold mb-1">Email </label>
          <TextField
            margin="normal"
            fullWidth
            size="small"
            id="email"
            onChange={onChange}
            value={values.email}
            name="email"
            placeholder="example@email.com"
            sx={{ margin: "auto", padding: 0 }}
          />
        </div>
      </Box>
      <Box sx={{ width: "100%", px: 3, pb: 3 }}>
        <div className="flex flex-col gap-0 mb-6">
          <label className="text-sm font-semibold mb-1">Address details </label>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="address"
            onChange={onChange}
            value={values.address}
            name="address"
            placeholder="cairo , egypt"
            sx={{ margin: "auto", padding: 0 }}
          />
        </div>
      </Box>
    </Box>
  );
};

export default StudentInfo;
