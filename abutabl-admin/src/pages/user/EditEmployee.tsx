import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  editTeacher,
  editUser,
  getEmployeeDetails,
  setIsTeacher,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "../../redux/store";
import OverviewList from "../../components/editEmployee/OverviewList";

const EditEmployee = () => {
  // ----------- hooks ------------
  const [tap, setTap] = useState<any>(0);
  const formik: any = useFormik({
    initialValues: {
      photo: "",
      full_name_ar: "",
      full_name_en: "",
      // fname_en: "",
      // lname_en: "",
      // fname_ar: "",
      // lname_ar: "",
      email: "",
      birthday: "",
      specialization_ar: "",
      specialization_en: "",
      phone: "",
      gender: "",
      govern_id: "",
      city_id: "",
      address_en: "",
      address_ar: "",
      role_id: "",
      joining_date: "",
      username: "",
      password: "",
      status: true,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const dispatch = useDispatch();
  const param = useParams();
  const editedEmployeeState = useSelector((state: RootState) => state.employee);
  const navigate = useNavigate();

  // ------------ side effects ------------
  useEffect(() => {
    dispatch(getEmployeeDetails(param.id));
  }, []);

  useEffect(() => {
    const details = editedEmployeeState.employeeDetails;
    if (!details?.school_id) return;
    const school_id = [details.school_id];
    formik.setValues({
      ...details,
      full_name_en: details.name_en ?? details.name ?? "",
      full_name_ar: details.name_ar ?? "",
      status: details.status === "1" || details.status === 1,
      school_id,
    });
  }, [editedEmployeeState.employeeDetails]);

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
          ></Box>{" "}
          Edit Employee
        </Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {tap === 0 && (
            <Button
              onClick={() => {
                navigate(-1);
              }}
              type="bordered"
              label="Cancel"
              className="w-30 m-3"
            />
          )}
          {tap === 0 && (
            <Button
              onClick={async () => {
                // Name fallback: use Arabic as English and vice versa when one is missing
                const full_name_en = (formik.values.full_name_en || formik.values.full_name_ar) ?? "";
                const full_name_ar = (formik.values.full_name_ar || formik.values.full_name_en) ?? "";
                const payload = {
                  ...formik.values,
                  full_name_en,
                  full_name_ar,
                  status: formik?.values?.status ? 1 : 0,
                  photo:
                    typeof formik.values.photo === "string"
                      ? null
                      : formik.values.photo,
                };
                if (!editedEmployeeState?.isTeacher) {
                  await dispatch(
                    editUser({
                      data: payload,
                      id: param?.id,
                    })
                  )
                    .unwrap()
                    .then(() => {
                      setIsTeacher(false);
                      navigate(-1);
                    })
                    .catch((err: any) => {
                      console.log(err);
                    });
                } else {
                  await dispatch(
                    editTeacher({
                      data: payload,
                      id: param?.id,
                    })
                  )
                    .unwrap()
                    .then(() => {
                      setIsTeacher(false);
                      navigate(-1);
                    })
                    .catch((err: any) => {
                      console.log(err);
                    });
                }
              }}
              label={"Submit"}
              className="w-30 m-3"
            />
          )}
        </Box>
      </Box>
      {tap === 0 && <OverviewList formik={formik} />}
    </>
  );
};

export default EditEmployee;
