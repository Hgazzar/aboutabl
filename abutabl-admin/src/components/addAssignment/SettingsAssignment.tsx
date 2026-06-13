import {
  Box,
  Grid,
  Typography,
  TextField,
  Divider,
  Checkbox,
} from "@mui/material";
import React, { useRef, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicInfo from "../../components/addAssignment/BasicInfo";
import Score from "../addAssignment/Score";
import SkillTags from "../addAssignment/SkillTags";
import StandardCode from "../addAssignment/StandardCode";
import Notify from "../addAssignment/Notify";
import SwitchBox from "../shared/SwitchBox";

const SettingsAssignment = () => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const formik: any = useFormik({
    initialValues: {
      photo: "",
      fname: "",
      lname: "",
      fname_ar: "",
      lname_ar: "",
      email: "",
      birthday: "",
      specialization: "",
      specializationAr: "",
      phone: "",
      gender: "",
      govern_id: "",
      city_id: "",
      address: "",
      addressAr: "",
      role_id: "",
      joining_date: "",
      username: "",
      password: "",
      status: false,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });

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
    <>
      <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
        <Grid
          item
          xs={12}
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <BasicInfo
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
          <SkillTags
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
          <StandardCode
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
            <Typography
              component={"p"}
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Assignment status
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
              <SwitchBox id={"status"} formik={formik} />
            </Box>
          </Box>
          <Score
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
          <Notify
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default SettingsAssignment;
