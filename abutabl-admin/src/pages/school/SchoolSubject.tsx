import React, { useState } from "react";
import SubPageNav from "../../components/subjects/SubPageNav";
import Games from "../../components/subjectDetails/Games";
import Teachers from "../../components/subjectDetails/Teachers";
import Students from "../../components/subjectDetails/Students";
import Grade from "../../components/subjectDetails/Grade";
import Quizzes from "../../components/subjectDetails/Quizzes";
import Units from "../../components/subjectDetails/Units";
import Worksheets from "../../components/subjectDetails/Worksheets";
import { Box, Typography } from "@mui/material";
import Overview from "../../components/subjectDetails/Overview";
import "../../styles/subjectDetails.css";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Link, useNavigate, useParams } from "react-router-dom";

type Props = {};

const SingleSubject = (props: Props) => {
  const schoolState = useSelector(
    (state: RootState) => state?.school?.schoolDetails
  );

  const param = useParams();
  const subjectOverviewState = useSelector(
    (state: RootState) => state.subjects.subjectOverview
  );
  const subjectDetails = subjectOverviewState?.basic_info?.find(
    (item: any) => Number(item?.id) === Number(param?.id)
  );

  const [tap, setTap] = useState<string>("Overview");

  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewUnits = permissionState?.permissions?.units?.find(
    (permission: any) => permission["view-units"] === "1"
  );
  const viewquizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["view-quizes"] === "1"
  );
  const viewgames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["view-games"] === "1"
  );
  const viewworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["view-worksheets"] === "1"
  );
  const viewemployees = permissionState?.permissions?.teachers?.find(
    (permission: any) => permission["view-teachers"] === "1"
  );
  const viewstudents = permissionState?.permissions?.students?.find(
    (permission: any) => permission["view-students"] === "1"
  );
  const viewgrades = permissionState?.permissions?.grades?.find(
    (permission: any) => permission["view-grades"] === "1"
  );
  const navigate = useNavigate();

  return (
    <>
      <Box
        sx={{
          p: 3,
          bgcolor: "#fff",
        }}
      >
        <div className="pb-4">
          <span className="text-primary">School</span>{" "}
          <ArrowForwardIosIcon sx={{ fontSize: "medium" }} />{" "}
          <Link
            to={`/school/profile/${schoolState?.overview?.school_details?.id}`}
          >
            {schoolState?.overview?.school_details?.name}{" "}
          </Link>
          <ArrowForwardIosIcon sx={{ fontSize: "medium" }} /> School details
        </div>
        <Typography variant="h5">{subjectDetails?.name}</Typography>{" "}
      </Box>
      <SubPageNav
        allTaps={[
          "Overview",
          viewUnits ? "Units" : "",
          viewquizes ? "Quizzes" : "",
          viewgames ? "Games" : "",
          viewworksheets ? "Worksheets" : "",
          viewgrades ? "Grades" : "",
          viewemployees ? "Employees" : "",
          viewstudents ? "Students" : "",
        ]}
        tap={tap}
        setTap={setTap}
      />
      {tap === "Overview" && <Overview />}
      {tap === "Units" && viewUnits && <Units />}
      {tap === "Quizzes" && viewquizes && <Quizzes />}
      {tap === "Games" && viewgames && <Games />}
      {tap === "Worksheets" && viewworksheets && <Worksheets />}
      {tap === "Grades" && viewgrades && <Grade />}
      {tap === "Employees" && <Teachers />}
      {tap === "Students" && viewstudents && <Students />}
    </>
  );
};

export default SingleSubject;
