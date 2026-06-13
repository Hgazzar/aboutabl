import { Box, Divider, Typography } from "@mui/material";
import React, { useState } from "react";
import Button from "../../components/shared/Button";
import SubPageNav from "../../components/subjects/SubPageNav";
import EmployeeList from "../../components/editSchool/EmployeeList";
import GradeList from "../../components/editSchool/GradeList";
import SubjectList from "../../components/editSchool/SubjectList";
import OverviewList from "../../components/editSchool/OverviewList";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import {
  addSchool,
  nextStep,
  prevStep,
  resetSteps,
  setSchoolID,
} from "../../redux/reducers/schoolReducer";
import { useNavigate } from "react-router-dom";
import Steps from "../../components/shared/Steps";
import StudentList from "../../components/editSchool/StudentList";
import { RootState } from "../../redux/store";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

type Props = {};

const STEPS = [
  "Overview",
  "Grades & Classes",
  "Subjects",
  "School Employees",
  "Students",
];

const AddSchool = (props: Props) => {
  // ----------- hooks ------------
  const tap = useSelector((state: RootState) => state?.school?.stepTaps);
  const formik: any = useFormik({
    initialValues: {
      logo: "",
      name_en: "",
      name_ar: "",
      status: 1,
      govern_id: "",
      city_id: "",
      address_en: "",
      address_ar: "",
      contanct_number: "",
      email: "",
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const schoolID = useSelector((state: RootState) => state?.school?.schoolID);
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
            <Typography
              sx={{
                fontSize: "14px",
                color: "green",
                display: "flex",
                flexDirection: "row",
              }}
            >
              {" "}
              {/* <img
                src={require("../../assets/Ticketing/vuesax/linear/greenbook.png")}
                alt="arrow"
                className=" mr-2 h-5 w-4"
              /> */}
              ٍSchool <ArrowForwardIosIcon sx={{ fontSize: "medium" }} />
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "gray",
                }}
              >
                {" "}
                Add school
              </Typography>
            </Typography>
          </Box>{" "}
          School Details
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            {tap === 0 && (
              <Button
                onClick={() => {
                  navigate("/school/profile");
                }}
                type="bordered"
                label="Cancel"
                className="w-30 m-3"
              />
            )}
            {tap > 0 && (
              <Button
                onClick={() => {
                  dispatch(prevStep());
                }}
                type="bordered"
                label="Back"
                className="w-30 m-3"
              />
            )}
            <Button
              onClick={async () => {
                try {
                  if (tap === 0) {
                    await dispatch(
                      addSchool({
                        ...formik.values,
                        status: formik.values.status === true ? 1 : 0,
                      })
                    )
                      .unwrap()
                      .then((result: any) => {
                        dispatch(setSchoolID(result?.School?.id));
                      })
                      .then(() => {
                        dispatch(nextStep());
                      })
                      .catch((err: any) => {
                        throw new Error(err);
                      });
                  } else if (tap === STEPS.length - 1) {
                    dispatch(resetSteps());
                    navigate("/school/profile");
                  } else {
                    dispatch(nextStep());
                  }
                } catch (error: any) {
                  console.log(error);
                }
              }}
              label={tap < STEPS.length - 1 ? "Save and continue" : "Submit"}
              className="w-30 m-3"
            />
          </Box>
        </Box>
      </Box>
      <Steps steps={STEPS} stepNumber={tap} />
      {tap === 0 && <OverviewList formik={formik} />}
      {tap === 1 && <GradeList schoolID={schoolID} />}
      {tap === 2 && <SubjectList schoolID={schoolID} />}
      {tap === 3 && <EmployeeList schoolID={schoolID} />}
      {tap === 4 && <StudentList schoolID={schoolID} />}
    </>
  );
};

export default AddSchool;
