import React, { useEffect, useLayoutEffect, useState } from "react";
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
import SchoolList from "../../components/subjectDetails/Schools";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getSubjectDetails } from "@/redux/reducers/subjectsReducer";
import { useTranslation } from "react-i18next";
import QuizzesActivity from "@/components/subjectDetails/QuizzesActivity";
import GamesActivity from "@/components/subjectDetails/GamesActivity";
import WorkSheetsActivity from "@/components/subjectDetails/WorkSheetsActivity";

type Props = {};

const SingleSubject = (props: Props) => {
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
  const viewschools = permissionState?.permissions?.schools?.find(
    (permission: any) => permission["view-schools"] === "1"
  );

  const { id } = useParams();
  const [tap, setTap] = useState<string>("Overview");
  const [name, setName] = useState<any>({});

  const subjectState = useSelector((state: RootState) => state?.subjects);
  useEffect(() => {
    setName(
      subjectState?.subjectsList?.subjects?.data?.find(
        (subject: any) => subject.id === id
      )
    );
  }, [subjectState?.subjectsList]);

  const param = useParams();
  const dispatch = useDispatch();
  // ------------ side effects -------------
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await dispatch(getSubjectDetails(param.id));
      setIsLoading(false);
    })();
  }, []);
  const subjectOverviewState = useSelector(
    (state: RootState) => state.subjects.subjectOverview
  );

  const { t } = useTranslation();
  const { i18n } = useTranslation();

  // ------------- side effects ---------------
  // Ensure body direction matches current language
  useEffect(() => {
    const currentLang = i18n.language || "en";
    document.body.dir = currentLang === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

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
        }}
      >
        <Typography variant="h5">{name?.name}</Typography>{" "}
      </Box>
      <SubPageNav
        allTaps={[
          t("overview"), // 👈 ترجمة كلمة Overview
          viewUnits ? t("units") : "",
          viewquizes ? t("quizzes") : "",
          viewgames ? t("games") : "",
          viewworksheets ? t("worksheets") : "",
          viewschools ? t("schools") : "",
        ]}
        tap={tap}
        setTap={setTap}
      />
      {(tap === "Overview" || tap === "نظرة عامة") && <Overview />}
      {(tap === "Units" || tap === "الوحدات") && viewUnits && <Units />}
      {/* {(tap === "Quizzes" || tap === "الاختبارات") && viewquizes && <Quizzes />} */}
      {/* {(tap === "Games" || tap === "الألعاب") && viewgames && <Games />} */}
      {/* {(tap === "Worksheets" || tap === "أوراق العمل") && viewworksheets && (
        <Worksheets />
      )} */}
      {(tap === "Quizzes" || tap === "الاختبارات") && viewquizes && (
        <QuizzesActivity />
      )}
      {(tap === "Games" || tap === "الألعاب") && viewgames && <GamesActivity />}

      {(tap === "Worksheets" || tap === "أوراق العمل") && viewworksheets && (
        <WorkSheetsActivity />
      )}
      {(tap === "Schools" || tap === "المدارس") && viewschools && (
        <SchoolList />
      )}
    </>
  );
};

export default SingleSubject;
