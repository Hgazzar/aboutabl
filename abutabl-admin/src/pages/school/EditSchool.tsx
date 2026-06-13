import { Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import OverviewList from "../../components/editSchool/OverviewList";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  editSchool,
  getSchoolDetails,
  getSchoolList,
} from "../../redux/reducers/schoolReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import { getCityList } from "../../redux/reducers/commonReducer";

type Props = {};

const EditSchool = (props: Props) => {
  // ------------- hooks -------------
  const formik: any = useFormik({
    initialValues: {
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
  const param = useParams();
  const editedSchoolState = useSelector((state: RootState) => state.school);
  const navigate = useNavigate();

  // ------------- side effects --------------
  useEffect(() => {
    dispatch(getSchoolDetails(param.id));
  }, [dispatch, param.id]);

  useEffect(() => {
    formik?.setValues({
      ...editedSchoolState?.schoolDetails?.overview?.school_details,
      status:
        +editedSchoolState?.schoolDetails?.overview?.school_details?.status,
    });
    dispatch(
      getCityList({
        govern_id: formik?.values?.govern_id,
      })
    );
  }, [editedSchoolState?.schoolDetails]);

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
        <Typography variant="h5">Edit School</Typography>{" "}
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
            <Button
              onClick={() => {
                navigate(-1);
              }}
              type="bordered"
              label="Cancel"
              className="w-30 m-3"
            />

            <Button
              onClick={async () => {
                try {
                  const data = {
                    ...formik.values,
                    status: formik.values.status === true ? 1 : 0,
                  };
                  if (typeof data.logo === "string") {
                    delete data.logo;
                  }
                  await dispatch(editSchool({ data, id: param.id })).unwrap();
                  await dispatch(getSchoolList({ paginate: 10 }));
                  navigate("/school/profile");
                } catch (error: any) {}
              }}
              label={"Save Changes"}
              className="w-30 m-3"
            />
          </Box>
        </Box>
      </Box>
      <OverviewList formik={formik} />
    </>
  );
};

export default EditSchool;
