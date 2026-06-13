import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useRef, useState } from "react";
import Button from "../shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import SubPageNav from "../subjects/SubPageNav";
import QuestionBank from "./QuestionBank";
import Upload from "./Upload";
import Instruction from "./Instruction";
const AddAssignment = () => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [tap, setTap] = useState<string>("Question Bank");

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
      <Box
        sx={{
          m: 3,
          boxShadow: "unset",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          bgcolor: "#fff",
        }}
      >
        <SubPageNav
          allTaps={["Question Bank", "Upload SCORM", "Instruction"]}
          tap={tap}
          setTap={setTap}
        />
        {tap === "Question Bank" && <QuestionBank />}
        {tap === "Upload SCORM" && <Upload />}
        {tap === "Instruction" && <Instruction formik={formik} />}
      </Box>
    </>
  );
};

export default AddAssignment;
