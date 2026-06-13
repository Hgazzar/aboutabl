import { Grid } from "@mui/material";
import BasicInfo from "../QuizDetails/BasicInfo";
import Score from "../QuizDetails/Score";
import StandardCode from "../QuizDetails/StandardCode";
import Notify from "../QuizDetails/Notify";
import Timing from "./Timing";
import Layout from "./Layout";
import QuizQuestions from "./QuizQuestions";
import AccountStatus from "../shared/AccountStatus";

const QuizSetting = ({
  formik,
  optionCount,
  setOptionCount,
  score,
  setScore,
  questions,
  setQuestions,
  quizInfo,
}: any) => {
  // ----------- hooks ------------

  // ----------- functions --------------

  return (
    <>
      <Grid container sx={{ my: 2 }} spacing={2}>
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <BasicInfo formik={formik} quizInfo={quizInfo} />
          <Timing formik={formik} quizInfo={quizInfo} />
          <QuizQuestions
            optionCount={optionCount}
            setOptionCount={setOptionCount}
            formik={formik}
            score={score}
            setScore={setScore}
            questions={questions}
            setQuestions={setQuestions}
          />
          <StandardCode formik={formik} />
        </Grid>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <AccountStatus
            label="Quiz status"
            onChange={async () => {
              // await dispatch(setSchoolStatus(param.id));
              // await dispatch(getSchoolDetails(param.id));
            }}
            value={formik?.values?.status}
            formik={formik}
          />
          <Layout formik={formik} />
          <Score formik={formik} />
          <Notify formik={formik} />
        </Grid>
      </Grid>
    </>
  );
};

export default QuizSetting;
