import { Box, Grid, Typography } from "@mui/material";
import React, { useEffect } from "react";
import Button from "../../components/shared/Button";
import ProfilePictureCard from "../../components/shared/ProfilePictureCard";
import AccountStatus from "../../components/shared/AccountStatus";
import { useFormik } from "formik";
import * as Yup from "yup";
import StudentInfo from "../../components/editStudent/StudentInfo";
import LevelInfo from "../../components/editStudent/LevelInfo";
import FatherInfo from "../../components/editStudent/FatherInfo";
import MotherInfo from "../../components/editStudent/MotherInfo";
import CredentialisInfo from "../../components/editStudent/CredntialsInfo";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import {
  editStudent,
  getStudentDetails,
  getStudentList,
} from "../../redux/reducers/studentReducer";
import { getJobList } from "../../redux/reducers/commonReducer";

const EditStudent = () => {
  const formik = useFormik({
    initialValues: {
      photo: "",
      name: "",
      email: "",
      name_ar: "",
      birthday: "",
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
  const dispatch = useDispatch();
  const param = useParams();
  const editedStudentState = useSelector((state: RootState) => state.student);
  const navigate = useNavigate();

  // ------------ side effects ------------
  useEffect(() => {
    dispatch(getJobList());
    dispatch(getStudentDetails(param.id));
  }, []);

  useEffect(() => {
    formik?.setValues({
      ...editedStudentState?.studentDetails,
    });
  }, [editedStudentState?.studentDetails]);

  // console.log(formik.values.school_id); 
  
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
        <Typography variant="h5">Edit Student</Typography>{" "}
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
            onClick={() => navigate(-1)}
          >
            Cancel
          </Typography>{" "}
          <Button
            onClick={async () => {
              try {
                await dispatch(
                  editStudent({
                    data: {
                      ...formik.values,
                      photo:
                        typeof formik.values.photo === "string"
                          ? null
                          : formik.values.photo,
                    },
                    id: param.id,
                  })
                ).unwrap();
                await dispatch(getStudentList({ paginate: 10 }));
                navigate(-1);
              } catch (error: any) {
                console.log(error);
              }
            }}
            label="Save change"
            className="w-30 m-3"
          />
        </Box>
      </Box>

      <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <ProfilePictureCard id={"photo"} formik={formik} />
          <AccountStatus formik={formik} />
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
    </>
  );
};

export default EditStudent;
