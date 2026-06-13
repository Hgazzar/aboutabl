import { Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import Steps from "../../components/shared/Steps";
import QuizSetting from "../QuizDetails/QuizSetting";
import ReviewComplete from "../addAssignment/ReviewComplete";
import { dateFormat } from "@/utils/functions";
import { notify } from "@/utils/notify";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addQuizToSubject } from "@/redux/reducers/subjectsReducer";

const STEPS = ["Settings", "Review & Complete"];

const QuizDetalis = () => {
  // ----------- hooks ------------
  const [tap, setTap] = useState<any>(0);
  const [optionCount, setOptionCount] = useState<any>([]);
  const param = useParams();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const activity_lesson_id = searchParams.get("activity_lesson_id");
  const [score, setScore] = useState<any>([]);
  const [questions, setQuestions] = useState<any>([]);
  const navigate = useNavigate();
  const formik: any = useFormik({
    initialValues: {
      title_en: "",
      instructions_en: "",
      start_date: null,
      due_date: null,
      time_limit: 0,
      code: "",
      navigation_method: "free",
      questions_per_page: 1,
      score_method: "percentage",
      unit_id: "",
      q_id: [],
      q_score: [],
      lesson_id: "",
      score_to_pass: 50,
      status: true,
      unlimited_attempts: true,
      num_attempts: 1,
      notify_student: true,
      notify_about_submission: true,
      notify_about_late_submission: true,
      reminder_before_due_date: true,
      type_time: "minutes",
      do_when_time_end: "",
      subject_id: "",
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });

  // ----------- functions --------------
  function validateBeforeSubmittion() {
    if (formik.values.title_en === "") {
      notify("Title is required", "error");
      return false;
    } else if (questions?.length <= 0 || score.includes(null)) {
      notify("Questions are required", "error");
      return false;
    } else if (score?.length <= 0 || score.includes(0)) {
      notify("Score is required", "error");
      return false;
    } else if (
      formik.values?.score_to_pass >
        +score?.reduce((a: any, b: any) => +a + +b) &&
      formik.values?.score_method === "points"
    ) {
      notify("Score to pass must be less than total score", "error");
      return false;
    }
    return true;
  }

  const convertBooleanToNumeric = (bool: boolean) => {
    return bool ? "1" : "0";
  };

  // ----------- side effect ------------
  useEffect(() => {
    formik.setValues({ ...formik.values, subject_id: param.subjectId });
  }, []);

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
        <Typography variant="h5">Quiz details</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Typography
            component={"p"}
            sx={{
              color: "#1EBBA3",
              fontWeight: "400",
              mx: 4,
              cursor: "pointer",
            }}
            onClick={() => {
              if (tap > 0) {
                setTap((prev: any) => {
                  return prev - 1;
                });
              } else {
                navigate(-1);
              }
            }}
          >
            Cancel
          </Typography>{" "}
          <Button
            onClick={async () => {
              if (validateBeforeSubmittion()) {
                if (tap === 0) {
                  setTap((prev: any) => {
                    return prev + 1;
                  });
                } else {
                  const data = {
                    ...formik.values,
                    title_ar: formik.values.title_en,
                    instructions_ar: formik.values.instructions_en,
                    status: convertBooleanToNumeric(formik.values.status),
                    unlimited_attempts: convertBooleanToNumeric(
                      formik.values.unlimited_attempts
                    ),
                    num_attempts: convertBooleanToNumeric(
                      formik.values.num_attempts
                    ),
                    notify_student: convertBooleanToNumeric(
                      formik.values.notify_student
                    ),
                    notify_about_submission: convertBooleanToNumeric(
                      formik.values.notify_about_submission
                    ),
                    notify_about_late_submission: convertBooleanToNumeric(
                      formik.values.notify_about_late_submission
                    ),
                    reminder_before_due_date: convertBooleanToNumeric(
                      formik.values.reminder_before_due_date
                    ),
                    q_id: questions,
                    q_score: score,
                    ...(activity_lesson_id && { activity_lesson_id }),
                  };
                  await dispatch(addQuizToSubject(data));
                  navigate(-1);
                }
              }
            }}
            label={tap === 0 ? "Next" : "Save & Continue"}
            className="w-30 m-3"
          />
        </Box>
      </Box>
      <Steps steps={STEPS} stepNumber={tap} />
      {tap === 0 && (
        <QuizSetting
          formik={formik}
          optionCount={optionCount}
          setOptionCount={setOptionCount}
          score={score}
          questions={questions}
          setScore={setScore}
          setQuestions={setQuestions}
        />
      )}
      {tap === 1 && (
        <ReviewComplete formik={formik} score={score} questions={questions} />
      )}
    </>
  );
};

export default QuizDetalis;
