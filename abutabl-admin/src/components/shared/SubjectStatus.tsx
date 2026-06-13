import { Box, Typography, Divider } from "@mui/material";
import React from "react";
import SwitchBox from "./SwitchBox";
import { useTranslation } from "react-i18next";

const SubjectStatus = ({ formik, onChange, value }: any) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 2 }}
      >
        {t("subjectstatus")}
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
          {t("active")}
        </Typography>
        <SwitchBox
          id={"status"}
          formik={formik}
          value={value}
          onChange={onChange}
        />
      </Box>
    </Box>
  );
};

export default SubjectStatus;
