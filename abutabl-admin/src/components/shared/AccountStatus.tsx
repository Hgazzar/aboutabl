import { Box, Typography, Divider } from "@mui/material";
import React from "react";
import SwitchBox from "./SwitchBox";

const AccountStatus = ({
  formik,
  onChange,
  value,
  label = "Account status",
}: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        {label}
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Active
        </Typography>{" "}
        <SwitchBox
          id={"status"}
          value={value}
          onChange={onChange}
          formik={formik}
        />
      </Box>
    </Box>
  );
};

export default AccountStatus;
