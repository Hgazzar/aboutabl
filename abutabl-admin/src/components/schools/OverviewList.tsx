import { Box, Divider, Grid, Typography } from "@mui/material";
import React, { useEffect } from "react";
import InfoCard from "../shared/InfoCard";
import AccountStatus from "../shared/AccountStatus";
import { useFormik } from "formik";
import * as Yup from "yup";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  getSchoolDetails,
  setSchoolStatus,
} from "../../redux/reducers/schoolReducer";
import { useParams } from "react-router-dom";

const OverviewList = ({ data }: any) => {
  const formik = useFormik({
    initialValues: {
      status: false,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const dispatch = useDispatch();
  const param = useParams();

  const schoolStatus = useSelector(
    (state: RootState) => state?.school?.schoolDetails?.status
  );

  useEffect(() => {
    formik.setValues({ ...formik.values, status: schoolStatus });
  }, [data]);

  const permissionState = useSelector((state: RootState) => state.permissions)
  const activationschools = permissionState?.permissions?.schools?.find((permission: any) => permission["activation-schools"] === "1")
 return (
    <Box sx={{ my: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Grid sx={{ p: 2 }} container spacing={2} gap={2}>
            <InfoCard title="Employees" value={data?.users_count} />
            <InfoCard title="Grades" value={data?.grades_count} />
            <InfoCard title="Classes" value={data?.classes_count} />
            <InfoCard title="Students" value={data?.students_count} />
            <InfoCard title="subjects" value={data?.subjects} />
            <InfoCard title="Quizzes" value={data?.quizes_count} />
            <InfoCard title="Homework" value={data?.homework_count} />
            <InfoCard title="Assessments" value={data?.assessments_count} />
          </Grid>
          <Box sx={{ mr: 3, bgcolor: "#fff", border: "1px solid #091E4224" }}>
            <Typography
              component={"p"}
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Basic info
            </Typography>{" "}
            <Divider />
            <Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  p: 3,
                  gap: 3,
                }}
              >
                <Box sx={{ width: "50%" }}>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">
                      School Name (English)
                    </label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.name_en}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">Email</label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.email}
                    </p>
                  </div>
                </Box>
                <Box sx={{ width: "50%" }}>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">
                      School Name (Arabic)
                    </label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.name_ar}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">
                      Phone number
                    </label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.contanct_number}
                    </p>
                  </div>
                </Box>
              </Box>
              <Divider sx={{ mx: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  p: 3,
                  gap: 3,
                }}
              >
                <Box sx={{ width: "50%" }}>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">
                      Governments
                    </label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.govern}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">Address</label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.address_en}
                    </p>
                  </div>
                </Box>
                <Box sx={{ width: "50%" }}>
                  <div className="flex flex-col gap-0 mb-4 h-12">
                    <label className="text-sm mb-1 text-gray">City</label>
                    <p className="text-sm font-semibold mb-1">
                      {data?.school_details?.city_name_en}
                    </p>
                  </div>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
        {
          activationschools &&
          <Grid item xs={11} md={3.5}>
            <AccountStatus
              onChange={async () => {
                await dispatch(setSchoolStatus(param.id));
                await dispatch(getSchoolDetails(param.id));
              }}
              value={data?.school_details?.status}
            />
          </Grid>
        }
      </Grid>
    </Box>
  );
};

export default OverviewList;
