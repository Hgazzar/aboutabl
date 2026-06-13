import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
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
import Steps from "../../components/shared/Steps";
import SettingsAssignment from "../addAssignment/SettingsAssignment";
import AddAssignment from "../addAssignment/AddAssignment";
import ReviewComplete from "../addAssignment/ReviewComplete";

const STEPS = ["Settings", "Assignments", "Review & Complete"];

const CreateAssignment = () => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [tap, setTap] = useState<any>(0);
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
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              p: 1,
              mr: 1,
            }}
          >
            <img
              src={require("../../assets/Ticketing/vuesax/linear/bookicon.png")}
              alt="book"
              className="text-Orange mr-2 h-4 w-4"
            />
            <Typography
              sx={{
                fontSize: "14px",
                color: "green",
                display: "flex",
                flexDirection: "row",
              }}
            >
              {" "}
              Course Management{" "}
              <img
                src={require("../../assets/Ticketing/vuesax/linear/arrow-right.png")}
                alt="arrow"
                className="text-Orange ml-2 h-5 w-4"
              />
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "gray",
                }}
              >
                {" "}
                Subjects name
              </Typography>
            </Typography>
          </Box>{" "}
          Create Assignment
        </Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Typography
            component={"p"}
            sx={{
              color: "#1EBBA3",
              fontWeight: "400",
              mx: 4,
              cursor: "pointer",
            }}
          >
            Cancel
          </Typography>{" "}
          <Button label="Save as draft" type="bordered" className="w-30 m-3" />
          <Button
            onClick={async () => {
              setTap((prev: any) => {
                return prev + 1;
              });
            }}
            label={tap < STEPS.length ? "Next" : "Save & Continue"}
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <Steps steps={STEPS} stepNumber={tap} />
      {tap === 0 && <SettingsAssignment />}
      {tap === 1 && <AddAssignment />}
      {tap === 2 && <ReviewComplete />}
    </>
  );
};

export default CreateAssignment;
