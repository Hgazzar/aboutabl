import { Box, Typography, Divider } from "@mui/material";
import React from "react";
import SwitchBox from "./SwitchBox";

const SubjectLang = ({ formik, onChange, value }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 2 }}
      >
        Subject language
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
          ar
        </Typography>{" "}
        <SwitchBox
          id={"lang"}
          formik={formik}
          value={value}
          onChange={onChange}
        />
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          en
        </Typography>{" "}
      </Box>
    </Box>
  );
};

export default SubjectLang;
