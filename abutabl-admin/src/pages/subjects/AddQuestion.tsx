import MCQ from "@/components/questionBank/MCQ";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/shared/Button";
import TorF from "@/components/questionBank/TorF";
import ShortNotes from "@/components/questionBank/ShortNotes";
import Matching from "@/components/questionBank/Matching";
import QuestionPreview from "@/components/questionBank/QuestionPreview";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import { createQuestion } from "@/redux/reducers/questionBankReducer";
import { notify } from "@/utils/notify";
import { normalizeQuestionType } from "@/utils/questionType";

type Props = {};

const AddQuestion = (props: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"MCQ" | "TF" | "SHN" | "Matching">("MCQ");

  const formik: any = useFormik({
    initialValues: {
      subject_id: "",
      unit_id: "",
      lesson_id: "",
      question: "",
      type: "MCQ",
      score: "",
      code: "",
      questionBodyType: "text",
      answerBodyType: "text",
      answer1: "",
      answer2: "",
      answer3: "",
      answer4: "",
      answer5: "",
      answer6: "",
      answer7: "",
      answer8: "",
      corAnswer: "",
      reason: "",
      reason_is_required: 0,
      answer1_1: "",
      answer1_2: "",
      answer1_3: "",
      answer1_4: "",
      answer1_5: "",
      answer1_6: "",
      answer1_7: "",
      answer1_8: "",
      add_to_question_bank: 1,
    },
    onSubmit: async (values) => {
      const questionText = String(values.question || "").trim();
      if (!questionText) {
        notify("Question text is required", "error");
        return;
      }
      if (!values.answer1 || !values.answer2) {
        notify("At least two answers are required", "error");
        return;
      }
      if (!values.corAnswer) {
        notify("Please set a correct answer", "error");
        return;
      }

      try {
        setLoading(true);
        const body = {
          ...values,
          type: normalizeQuestionType(type),
          questionBodyType: values.questionBodyType || "text",
          answerBodyType: values.answerBodyType || "text",
          subject_id: values.subject_id || undefined,
          unit_id: values.unit_id || undefined,
          lesson_id: values.lesson_id || undefined,
        };
        const action = await dispatch(createQuestion(body));
        if (createQuestion.fulfilled.match(action)) {
          navigate("/question-bank");
        }
      } catch (error: any) {
        console.error("Error creating question:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div>
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
        <Typography variant="h5">New Question</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Typography
            onClick={() => navigate(-1)}
            sx={{ fontWeight: "700", cursor: "pointer", color: "#1EBBA3" }}
            component="p"
          >
            Cancel
          </Typography>{" "}
          <Button
            label="Save"
            className="w-30 m-3"
            onClick={() => formik.handleSubmit()}
            disabled={loading}
          />
        </Box>
      </Box>
      {type === "MCQ" && <MCQ type={type} setType={setType} formik={formik} hideFormFooter />}
      {type === "TF" && <TorF type={type} setType={setType} formik={formik} />}
      {type === "SHN" && <ShortNotes type={type} setType={setType} formik={formik} />}
      {type === "Matching" && <Matching type={type} setType={setType} formik={formik} />}
      <QuestionPreview
        type={type}
        question={formik.values.question}
        score={formik.values.score || "0"}
        answer={
          type === "MCQ"
            ? [
                formik.values.answer1 || "",
                formik.values.answer2 || "",
                formik.values.answer3 || "",
                formik.values.answer4 || "",
                formik.values.answer5 || "",
                formik.values.answer6 || "",
                formik.values.answer7 || "",
                formik.values.answer8 || "",
              ]
            : type === "SHN"
            ? [formik.values.corAnswer || ""]
            : []
        }
        corAnswer={formik.values.corAnswer || ""}
        code={formik.values.code || ""}
      />
    </div>
  );
};

export default AddQuestion;
