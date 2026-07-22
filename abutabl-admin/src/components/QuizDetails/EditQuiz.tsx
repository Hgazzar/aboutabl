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
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  addQuizToSubject,
  editQuiz,
  getQuizDetails,
} from "@/redux/reducers/subjectsReducer";

const STEPS = ["Settings", "Review & Complete"];

const EditQuiz = () => {
  // ----------- hooks ------------
  const [tap, setTap] = useState<any>(0);
  const [optionCount, setOptionCount] = useState<any>([]);
  const param = useParams();
  const dispatch = useDispatch();
  const [score, setScore] = useState<any>([]);
  const [questions, setQuestions] = useState<any>([]);
  const navigate = useNavigate();

  // console.log(param.quizId);
  const [quizInfo, setQuizInfo] = useState<any>([]);
  useEffect(() => {
    dispatch(getQuizDetails(param.quizId))
      .unwrap()
      .then((result: any) => {
        // console.log(result);
        setQuizInfo(result.quize[0]);
      });
  }, [param.quizId]);

  // console.log(quizInfo);

  const formik: any = useFormik({
    initialValues: {
      title_en: quizInfo.title_en,
      instructions_en: "",
      start_date: quizInfo?.start_date ?? null,
      due_date: quizInfo?.DueDate ?? null,
      time_limit: +quizInfo.time_limit ?? 0,
      code: quizInfo.code,
      navigation_method: quizInfo?.navigation_method ?? "free",
      score_method: quizInfo?.score_method ?? "percentage",
      notify_about_submission:
        quizInfo?.notify_about_submission === "1" ? true : false,
      reminder_before_due_date:
        quizInfo?.reminder_before_due_date === "1" ? true : false,
      notify_about_late_submission: true,
      type_time: quizInfo?.type_time,
      questions_per_page: 1,
      unit_id: "",
      q_id: [],
      q_score: [],
      lesson_id: "",
      score_to_pass: 50,
      status: true,
      unlimited_attempts: true,
      num_attempts: 1,
      shuffle_questions: false,
      shuffle_answers: false,
      notify_student: true,
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
  // console.log(quizInfo);

  useEffect(() => {
    // if (quizInfo) {
    formik.setValues({
      ...formik.values,
      title_en: quizInfo?.title_en,
      start_date: quizInfo?.startDate ?? null,
      due_date: quizInfo?.DueDate ?? null,
      type_time: quizInfo?.type_time,
      time_limit: +quizInfo.time_limit ?? 0,
      code: quizInfo.code,
      navigation_method: quizInfo?.navigation_method ?? "free",
      score_to_pass: quizInfo?.score_to_pass,
      score_method: quizInfo?.score_method ?? "percentage",
      notify_about_submission:
        quizInfo?.notify_about_submission === "1" ? true : false,
      reminder_before_due_date:
        quizInfo?.reminder_before_due_date === "1" ? true : false,
      questions_per_page: quizInfo?.questions_per_page,
      do_when_time_end: quizInfo?.do_when_time_end,
      shuffle_questions: quizInfo?.shuffle_questions === "1" ? true : false,
      shuffle_answers: quizInfo?.shuffle_answers === "1" ? true : false,
      notify_about_late_submission: true,
      subject_id: param.subjectId,
    });
    // }
  }, [quizInfo]);

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
        <Typography variant="h5">Edit Quiz</Typography>{" "}
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
                    shuffle_questions: convertBooleanToNumeric(
                      formik.values.shuffle_questions
                    ),
                    shuffle_answers: convertBooleanToNumeric(
                      formik.values.shuffle_answers
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
                  };
                  await dispatch(
                    //@ts-ignore
                    editQuiz({ body: data, params: param.quizId })
                  );
                  navigate(`/subjects/${param.subjectId}`);
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
          quizInfo={quizInfo}
        />
      )}
      {tap === 1 && (
        <ReviewComplete formik={formik} score={score} questions={questions} />
      )}
    </>
  );
};

export default EditQuiz;
