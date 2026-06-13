import React from "react";
import { Grid } from "@mui/material";
import AccountStatus from "../shared/AccountStatus";
import StudentView from "../studentDetails/StudentView";
import LevelView from "../studentDetails/LevelView";
import FatherInfo from "../studentDetails/FatherInfo";
import CredentialsView from "../studentDetails/CredentialsView";
import MotherInfo from "../studentDetails/MotherInfo";
import {
  getStudentDetails,
  setStudentStatus,
} from "../../redux/reducers/studentReducer";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

const OverviewStudent = ({ data }: any) => {
  const param = useParams();
  const dispatch = useDispatch();

  return (
    <Grid container sx={{ my: 3 }} gap={2}>
      <Grid
        item
        xs={11}
        md={8}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <StudentView data={data} />
        <LevelView data={data} />
        <FatherInfo data={data} />
        <MotherInfo data={data} />
        <CredentialsView data={data} />
      </Grid>
      <Grid
        item
        xs={11}
        md={3.5}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <AccountStatus
          onChange={async () => {
            await dispatch(setStudentStatus(param.id));
            await dispatch(getStudentDetails(param.id));
          }}
          value={data?.status}
        />
      </Grid>
    </Grid>
  );
};

export default OverviewStudent;
