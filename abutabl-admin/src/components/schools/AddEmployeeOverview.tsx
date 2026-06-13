import { Grid } from "@mui/material";
import React, { useEffect } from "react";
import ProfilePictureCard from "../shared/ProfilePictureCard";
import AccountStatus from "../shared/AccountStatus";
import BasicInfo from "../../components/addEmployee/BasicInfo";
import LocationInfo from "../../components/addEmployee/LocationInfo";
import JopInfo from "../../components/schools/JopInfo";
import CredentialisInfo from "../../components/addEmployee/CredentialsInfo";
import { useLocation } from "react-router-dom";

const AddEmployeeOverview = ({ formik }: any) => {
  //   ---------- side effects -----------

  return (
    <div>
      <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <ProfilePictureCard formik={formik} id={"photo"} />
          <AccountStatus formik={formik} />
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
    </div>
  );
};

export default AddEmployeeOverview;
