import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";
import PasswordInput from "../shared/PasswordInput";

type InfoProps = {
  values: any;
  onChange: any;
};

const CredentialisInfo = ({ values, onChange }: InfoProps) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Credentials
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
              Username <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="username"
              onChange={onChange}
              value={values.username}
              name="username"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Password <span className="text-red">*</span>
            </label>
            <PasswordInput onChange={onChange} value={values.password} />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default CredentialisInfo;
