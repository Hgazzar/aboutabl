import React from "react";
import { Grid } from "@mui/material";
import AccountStatus from "../shared/AccountStatus";
import BasicView from "./BasicView";
import LocationView from "./LocationView";
import JopView from "./JopView";
import CredentialsView from "./CredentialsView";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getEmployeeDetails,
  setEmployeeStatus,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "@/redux/store";

const OverviewEmployee = ({ data }: any) => {
  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsUsers = permissionState?.permissions?.users;
  const activationUsers = permissionsUsers?.find((permission: any) => permission["activation-uses"] === "1")

  const param = useParams();
  const dispatch = useDispatch();

  return (
    <Grid container sx={{ my: 2 }} spacing={2} gap={2}>
      <Grid
        item
        xs={11}
        md={8}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <BasicView data={data} />
        <LocationView data={data} />
        <JopView data={data} />
        <CredentialsView data={data} />
      </Grid>
      <Grid
        item
        xs={11}
        md={3.5}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {
          activationUsers &&
          <AccountStatus
            onChange={async () => {
              await dispatch(setEmployeeStatus(param.id));
              await dispatch(getEmployeeDetails(param.id));
            }}
            value={data?.status}
          />
        }
      </Grid>
    </Grid>
  );
};

export default OverviewEmployee;
