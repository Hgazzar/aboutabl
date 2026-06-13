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
type Props = {};

const AddQuestion = (props: Props) => {
  // ----------- hooks ------------
  const navigate = useNavigate();
  const [type, setType] = useState<"MCQ" | "TF" | "SHN" | "Matching">("MCQ");
  const formik: any = useFormik({
    initialValues: {
      question: "",
      answer: "",
      type: "",
      score: "",
      style: "",
      skill: "",
      code: "",
      nStyle: "",
      maxLineNumber: "",
    },
    onSubmit: async (values) => {},
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
          <Button label="Next" className="w-30 m-3" />
        </Box>
      </Box>
      {type === "MCQ" && <MCQ type={type} setType={setType} formik={formik} />}
      {type === "TF" && <TorF type={type} setType={setType} />}
      {type === "SHN" && <ShortNotes type={type} setType={setType} />}
      {type === "Matching" && <Matching type={type} setType={setType} />}
      <QuestionPreview
        type={type}
        question={formik.values.question}
        score={formik.values.score}
        answer={["Answer A", "Answer B", "Answer C"]}
      />
    </div>
  );
};

export default AddQuestion;
