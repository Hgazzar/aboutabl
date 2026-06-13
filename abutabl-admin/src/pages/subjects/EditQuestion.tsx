import MCQ from "@/components/questionBank/MCQ";
import { Box, Typography } from "@mui/material";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/shared/Button";
import TorF from "@/components/questionBank/TorF";
import ShortNotes from "@/components/questionBank/ShortNotes";
import Matching from "@/components/questionBank/Matching";
import QuestionPreview from "@/components/questionBank/QuestionPreview";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import { getQuestionDetails, updateQuestion } from "@/redux/reducers/questionBankReducer";
import { notify } from "@/utils/notify";

type Props = {};

const EditQuestion = (props: Props) => {
  // ----------- hooks ------------
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const questionId = params.id;
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"MCQ" | "TF" | "SHN" | "Matching">("MCQ");
  const [questionData, setQuestionData] = useState<any>(null);
  
  const formik: any = useFormik({
    initialValues: {
      subject_id: "",
      unit_id: "",
      lesson_id: "",
      question: "",
      type: "",
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
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const updateData = {
          ...values,
          type: type,
        };
        await dispatch(updateQuestion({ id: questionId, body: updateData }));
        navigate("/question-bank");
      } catch (error: any) {
        console.error("Error updating question:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  // Load question details - only once per questionId
  const loadedQuestionId = React.useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (!questionId) {
      navigate("/question-bank");
      return;
    }

    // Only load if this is a different question
    if (loadedQuestionId.current === questionId) {
      return;
    }

    setLoading(true);
    loadedQuestionId.current = questionId;
    
    dispatch(getQuestionDetails(questionId))
      .unwrap()
      .then((result: any) => {
        console.log("Question details response:", result);
        if (result?.status && result?.question) {
          const question = result.question;
          setQuestionData(question);
          
          // Set question type
          if (question.type) {
            setType(question.type);
          }

          // Helper function to extract text from API response (handles both string and object)
          const getTextValue = (value: any): string => {
            if (!value) return "";
            if (typeof value === "string") return value;
            if (typeof value === "object" && value.text) return value.text;
            if (typeof value === "object" && value.value) return value.value;
            return "";
          };

          // Map question data to formik values
          const formValues: any = {
            subject_id: question.subject_id || "",
            unit_id: question.unit_id || "",
            lesson_id: question.lesson_id || "",
            question: getTextValue(question.question) || "",
            type: question.type || "",
            code: question.code || "",
            score: question.score || "",
            questionBodyType: question.question_body_type || "text",
            answerBodyType: question.answer_body_type || "text",
            corAnswer: getTextValue(question.corAnswer) || "",
            reason: getTextValue(question.reason) || "",
            reason_is_required: question.reason_is_required || 0,
          };

          // Map answers
          for (let i = 1; i <= 8; i++) {
            if (question[`answer${i}`] !== undefined && question[`answer${i}`] !== null) {
              formValues[`answer${i}`] = getTextValue(question[`answer${i}`]);
            }
          }

          // Map matching answers if type is Matching
          if (question.type === "Matching") {
            for (let i = 1; i <= 8; i++) {
              if (question[`answer1_${i}`] !== undefined && question[`answer1_${i}`] !== null) {
                formValues[`answer1_${i}`] = getTextValue(question[`answer1_${i}`]);
              }
              // Also map answer{i} for matching order
              if (question[`answer${i}`] !== undefined && question[`answer${i}`] !== null) {
                formValues[`answer${i}`] = getTextValue(question[`answer${i}`]);
              }
            }
          }

          formik.setValues(formValues);
        } else {
          notify("Question not found", "error");
          navigate("/question-bank");
        }
      })
      .catch((error: any) => {
        const errorMessage = error?.message || error?.toString() || "Failed to load question details";
        notify(errorMessage, "error");
        console.error("Error loading question:", error);
        setTimeout(() => {
          navigate("/question-bank");
        }, 2000);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading question...</Typography>
      </Box>
    );
  }

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
        <Typography variant="h5">Edit Question</Typography>{" "}
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
      {type === "MCQ" && (
        <MCQ type={type} setType={setType} formik={formik} hideFormFooter />
      )}
      {type === "TF" && <TorF type={type} setType={setType} formik={formik} />}
      {type === "SHN" && <ShortNotes type={type} setType={setType} formik={formik} />}
      {type === "Matching" && <Matching type={type} setType={setType} formik={formik} />}
      {questionData && (
        <QuestionPreview
          type={type}
          question={formik.values.question || ""}
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
          active={questionData}
          question_audio={questionData?.question_audio}
          question_image={questionData?.question_image}
        />
      )}
    </div>
  );
};

export default EditQuestion;
