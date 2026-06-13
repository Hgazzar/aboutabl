import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useState, useEffect } from "react";
import Button from "../../components/shared/Button";
import ProfilePictureCard from "../../components/shared/ProfilePictureCard";
import AccountStatus from "../../components/shared/AccountStatus";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicInfo from "../../components/addEmployee/BasicInfo";
import LocationInfo from "../../components/addEmployee/LocationInfo";
import JopInfo from "../../components/addEmployee/JopInfo";
import CredentialisInfo from "../../components/addEmployee/CredentialsInfo";
import {
  addEmployee,
  addUser,
  getEmployeeList,
} from "../../redux/reducers/employeeReducer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router";
import Steps from "../../components/shared/Steps";
import SchoolList from "../../components/addEmployee/SchoolList";
import { dateFormat } from "@/utils/functions";
import { canOnlyAddTeachers, getTeacherRoleId } from "../../utils/permissionHelpers";
import { getRoleList } from "../../redux/reducers/roleReducer";

const STEPS = ["Employee info", "Assign school"];
const AddEmployee = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tap, setTap] = useState<any>(0);
  const [userId, setUserId] = useState<any>(null);
  const [schoolId, setSchoolId] = useState<any>(null);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const commonState = useSelector((state: RootState) => state.common);
  const roleListFromRoles = useSelector((state: RootState) => state.roles?.roleList);
  const roleList = commonState?.roleList ?? roleListFromRoles;
  const onlyAddTeachers = canOnlyAddTeachers(permissionState);
  const teacherRoleId = getTeacherRoleId(roleList);

  const formik = useFormik({
    initialValues: {
      photo: "",
      full_name_ar: "",
      full_name_en: "",
      // fname: "",
      // lname: "",
      // fname_ar: "",
      // lname_ar: "",
      email: "",
      birthday: dateFormat(new Date(1995, 0, 1)),
      specialization: "",
      specializationAr: "",
      phone: "",
      gender: "",
      govern_id: "",
      city_id: "",
      address: "",
      addressAr: "",
      role_id: "",
      joining_date: dateFormat(new Date(2020, 0, 1)),
      username: "",
      password: "",
      status: true,
    },
    validationSchema: Yup.object({
      full_name_en: Yup.string().required("Name in English is required"),
      username: Yup.string().required("Username is required"),
      password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    }),
    onSubmit: async (values) => {},
  });

  useEffect(() => {
    dispatch(getRoleList());
  }, [dispatch]);

  useEffect(() => {
    if (onlyAddTeachers && teacherRoleId != null) {
      formik.setFieldValue("role_id", teacherRoleId);
    }
  }, [onlyAddTeachers, teacherRoleId]);

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
        <Typography variant="h5">Add New Aboutabl user</Typography>{" "}
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
          {tap === 0 && (
            <Button
              onClick={async () => {
                try {
                  // Name fallback: use Arabic as English and vice versa when one is missing
                  const full_name_en = (formik.values.full_name_en || formik.values.full_name_ar) ?? "";
                  const full_name_ar = (formik.values.full_name_ar || formik.values.full_name_en) ?? "";
                  await dispatch(
                    addEmployee({
                      ...formik.values,
                      full_name_en,
                      full_name_ar,
                      status: formik.values.status ? 1 : 0,
                    })
                  )
                    .unwrap()
                    .then((result: any) => {
                      setUserId(result.user.id);
                      setSchoolId(result.user.school_id);
                    });
                  setTap((prev: any) => {
                    return prev + 1;
                  });
                } catch (error) {
                  console.log(error);
                }
              }}
              label="Submit"
              className="w-30 m-3"
            />
          )}
          {tap === 1 && (
            <Button
              onClick={async () => {
                navigate(-1);
              }}
              label="Submit"
              className="w-30 m-3"
            />
          )}
        </Box>
      </Box>
      <Steps steps={STEPS} stepNumber={tap} />
      {tap === 1 && <SchoolList userId={userId} />}

      {tap === 0 && (
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
            <BasicInfo
              formik={formik}
              values={formik.values}
              onChange={formik.handleChange}
            />
            {/* <LocationInfo
              values={formik.values}
              onChange={formik.handleChange}
            /> */}
            <JopInfo
              formik={formik}
              values={formik.values}
              onChange={formik.handleChange}
            />
            <CredentialisInfo
              values={formik.values}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default AddEmployee;
