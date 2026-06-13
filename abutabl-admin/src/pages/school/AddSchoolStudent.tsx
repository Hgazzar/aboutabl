import { Box, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import ProfilePictureCard from "../../components/shared/ProfilePictureCard";
import AccountStatus from "../../components/shared/AccountStatus";
import { useFormik } from "formik";
import * as Yup from "yup";
import StudentInfo from "../../components/addStudent/StudentInfo";
import LevelInfo from "../../components/schools/LevelInfo";
import FatherInfo from "../../components/addStudent/FatherInfo";
import MotherInfo from "../../components/addStudent/MotherInfo";
import CredentialisInfo from "../../components/addStudent/CredentialsInfo";
import {
  addStudent,
  getStudentList,
} from "../../redux/reducers/studentReducer";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getJobList } from "../../redux/reducers/commonReducer";

const AddStudent = () => {
  // ----------- hooks ------------
  const param = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formik = useFormik({
    initialValues: {
      photo: "",
      name: "",
      email: "",
      name_ar: "",
      birthday: new Date(),
      gender: "",
      address: "",
      school_id: "",
      grade_id: "",
      class_id: "",
      f_name: "",
      f_name_ar: "",
      f_NID: "",
      f_email: "",
      f_phone: "",
      f_job_id: "",
      m_name: "",
      m_name_ar: "",
      m_NID: "",
      m_email: "",
      m_phone: "",
      m_job_id: "",
      username: "",
      password: "",
      status: true,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });

  //   ----------- side effects ------------
  useEffect(() => {
    dispatch(getJobList());
    formik.setValues({
      ...formik.values,
      school_id: `${param.id}`,
    });
  }, []);

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
        <Typography variant="h5">Add New Student</Typography>{" "}
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
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </Typography>{" "}
          <Button
            onClick={async () => {
              try {
                await dispatch(
                  addStudent({
                    ...formik.values,
                    status: formik.values.status === true ? 1 : 0,
                  })
                ).unwrap();
                await dispatch(getStudentList({ paginate: 10 }));
                navigate(-1);
              } catch (error) {
                console.log(error);
              }
            }}
            label="Submit"
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <form>
        <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
          <Grid
            item
            xs={12}
            md={3.5}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <ProfilePictureCard formik={formik} id={"photo"} />
            <AccountStatus formik={formik} value={formik.values.status} />
          </Grid>
          <Grid
            item
            xs={12}
            md={7.5}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <StudentInfo
              formik={formik}
              values={formik.values}
              onChange={formik.handleChange}
            />
            <LevelInfo values={formik.values} onChange={formik.handleChange} />
            <FatherInfo values={formik.values} onChange={formik.handleChange} />
            <MotherInfo values={formik.values} onChange={formik.handleChange} />
            {/* <CredentialisInfo
              values={formik.values}
              onChange={formik.handleChange}
            /> */}
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default AddStudent;
