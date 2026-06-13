import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React from "react";
import ProfilePictureCard from "../../components/shared/ProfilePictureCard";
import AccountStatus from "../../components/shared/AccountStatus";
import BasicInfo from "../../components/editEmployee/BasicInfo";
import LocationInfo from "../../components/editEmployee/LocationInfo";
import JopInfo from "../../components/editEmployee/JopInfo";
import CredentialisInfo from "../../components/editEmployee/CredentialsInfo";

const OverviewList = ({ formik }: any) => {
  return (
    <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
      <Grid
        item
        xs={11}
        md={3.5}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <ProfilePictureCard formik={formik} id={"photo"} />
        <AccountStatus formik={formik} value={formik.values.status} />
      </Grid>
      <Grid
        item
        xs={11}
        md={7.5}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <BasicInfo
          formik={formik}
          values={formik.values}
          onChange={formik.handleChange}
        />
        {/* <LocationInfo values={formik.values} onChange={formik.handleChange} /> */}
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
  );
};

export default OverviewList;
