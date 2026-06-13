import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router";
import Steps from "../../components/shared/Steps";
import SchoolList from "../../components/addEmployee/SchoolList";
import AddEmployeeOverview from "../../components/schools/AddEmployeeOverview";
import { useFormik } from "formik";
import { addEmployee } from "../../redux/reducers/employeeReducer";
import * as Yup from "yup";
import { useParams } from "react-router-dom";
import AddGradeToSchoolEmployee from "./AddGradeToSchoolEmployee";
import AddSubjectToSchoolEmployee from "./AddSubjectToSchoolEmployee";
import { canOnlyAddTeachers, getTeacherRoleId } from "../../utils/permissionHelpers";
import { getRoleList } from "../../redux/reducers/roleReducer";

const STEPS = ["Employee info", "Grades & classes"];
const AddEmployee = () => {
  // ------------ hooks -----------
  const [employeeId, setEmployeeId] = useState<number | string>("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [tap, setTap] = useState<any>(0);
  const param = useParams();
  const permissionState = useSelector((state: RootState) => state.permissions);
  const commonState = useSelector((state: RootState) => state.common);
  const roleListFromRoles = useSelector((state: RootState) => state.roles?.roleList);
  const roleList = commonState?.roleList ?? roleListFromRoles;
  const onlyAddTeachers = canOnlyAddTeachers(permissionState);
  const teacherRoleId = getTeacherRoleId(roleList);
  const initialRoleFromState = (location.state as any)?.role_id ?? "";

  const formik = useFormik({
    initialValues: {
      photo: "",
      full_name_en: "",
      // lname_en: "",
      full_name_ar: "",
      // lname_ar: "",
      email: "",
      birthday: "",
      specialization_en: "",
      specialization_ar: "",
      phone: "",
      gender: "",
      govern_id: "",
      city_id: "",
      address_en: "",
      address_ar: "",
      role_id: initialRoleFromState,
      joining_date: "",
      username: "",
      password: "",
      status: true,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });

  const [schoolId, setSchoolId] = useState<any>(null);

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
        <Typography variant="h5">Employee details</Typography>{" "}
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
                await dispatch(
                  addEmployee({
                    ...formik.values,
                    status: formik?.values?.status ? 1 : 0,
                    school_id: param?.id,
                  })
                )
                  .unwrap()
                  .then((result: any) => {
                    setEmployeeId(result?.user?.id);
                    setSchoolId(result.user.school_id);
                    if (tap === STEPS.length) {
                      navigate(-1);
                    } else {
                      setTap((prev: any) => {
                        return prev + 1;
                      });
                    }
                  })
                  .catch((err: any) => {
                    console.log(err);
                  });
              }}
              label="Submit"
              className="w-30 m-3"
            />
          )}
          {tap === 1 && (
            <Button
              onClick={() => {
                navigate(-1);
              }}
              label="Submit"
              className="w-30 m-3"
            />
          )}
        </Box>
      </Box>
      <Steps steps={STEPS} stepNumber={tap} />
      {tap === 0 && <AddEmployeeOverview formik={formik} />}
      {tap === 1 && (
        <AddGradeToSchoolEmployee employeeId={employeeId} schoolId={schoolId} />
      )}
    </>
  );
};

export default AddEmployee;
