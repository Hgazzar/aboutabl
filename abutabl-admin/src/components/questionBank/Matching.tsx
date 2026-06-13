import { Box, Divider, TextField } from "@mui/material";
import React, { useState, useEffect } from "react";
import Button from "../shared/Button";
import TextEditor from "../shared/TextEditor";
import { useFormik } from "formik";
import "react-quill/dist/quill.snow.css"; // Import the styles
import SelectBox from "../shared/SelectBox";
import SwitchBox from "../shared/SwitchBox";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

type Props = {
  type: "MCQ" | "TF" | "SHN" | "Matching";
  setType: (type: "MCQ" | "TF" | "SHN" | "Matching") => void;
  formik?: any;
};

const Matching = ({ type, setType, formik: propFormik }: Props) => {
  // ------------ hooks -------------
  const defaultFormik: any = useFormik({
    initialValues: {
      question: "",
      answer: "",
      type: "",
      style: "",
      skill: "",
      code: "",
      nStyle: "",
      maxLineNumber: "",
      score: "",
      answer1_1: "",
      answer1_2: "",
      answer1_3: "",
      answer1_4: "",
      answer1_5: "",
      answer1_6: "",
      answer1_7: "",
      answer1_8: "",
    },
    onSubmit: async (values) => {},
  });
  
  const formik = propFormik || defaultFormik;
  const [optionCount, setOptionCount] = useState<any>([]);
  
  // Initialize optionCount based on existing answers
  React.useEffect(() => {
    if (formik && formik.values) {
      const answers = [];
      for (let i = 1; i <= 8; i++) {
        if (formik.values[`answer1_${i}`]) {
          answers.push(i);
        }
      }
      if (answers.length > 0) {
        setOptionCount(answers);
      }
    }
  }, [formik]);

  return (
    <Box>
      <Box
        sx={{
          bgcolor: "#fff",
          border: "1px solid #091E4224",
          my: 3,
          mr: 3,
        }}
      >
        <SelectBox
          styles={{ m: 3, width: "300px" }}
          values={[
            {
              label: "MCQ",
              value: "MCQ",
            },
            {
              label: "True or False",
              value: "TF",
            },
            {
              label: "Short notes",
              value: "SHN",
            },
            {
              label: "Matching",
              value: "Matching",
            },
          ]}
          value={type}
          onChange={(e: any) => setType(e.target.value)}
        />
        <Divider />
        <Box
          sx={{
            p: 3,
          }}
        >
          <label htmlFor="question">Question</label>
          <TextEditor
            id={"question"}
            formik={formik}
            placeholder="Add your question ..."
          />
          <Box sx={{ display: "flex", flexDirection: "row", gap: 5 }}>
            <Box sx={{ width: "50%" }}>
              <div className="flex flex-col gap-0 mt-14 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Question Score
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="score"
                  onChange={formik.onChange}
                  value={formik.values.score || ""}
                  name="score"
                  placeholder="Enter points score for this question"
                  sx={{ margin: 0, padding: 0 }}
                />
              </div>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Standard code
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="code"
                  onChange={formik.onChange}
                  value={formik.values.code}
                  name="code"
                  placeholder=""
                  sx={{ margin: 0, padding: 0 }}
                />
              </div>
            </Box>
            <Box sx={{ width: "50%" }}>
              <div className="flex flex-col gap-0 mt-14 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Skill <span className="text-red">*</span>
                </label>
                <SelectBox
                  styles={{ width: "100%" }}
                  id={"style"}
                  name={"style"}
                  values={[
                    {
                      label: "Scorm",
                      value: "scorm",
                    },
                  ]}
                  value={formik.values.style}
                  onChange={formik.onChange}
                />
              </div>
            </Box>
          </Box>

          <div className="flex flex-row justify-between items-center">
            <p className="font-bold text-lg">Answers</p>
            <div className="flex flex-row gap-3 items-center justify-end">
              <p className="font-bold text-xl">Randomly ordered</p>
              <SwitchBox value={false} onChange={() => {}} />
            </div>
          </div>
          <div>
            {optionCount?.map((item: any) => {
              return (
                <Box
                  key={item}
                  sx={{
                    height: "240px",
                    bgcolor: "#F7F9FA",
                    my: 3,
                    px: 3,
                    py: 2,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "stretch",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 4px 8px 0 rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex flex-col justify-evenly h-full w-full">
                    <label htmlFor={item}>
                      Item {item} <span className="text-red">*</span>
                    </label>
                    <TextEditor
                      id={`answer1_${item}`}
                      formik={formik}
                      height="50px"
                      placeholder="Item can be text or image"
                    />
                    <div className="mt-14 flex flex-col gap-1">
                      <label>
                        Correct order <span className="text-red">*</span>
                      </label>
                      <SelectBox
                        styles={{ width: "100%" }}
                        id={`answer${item}`}
                        name={`answer${item}`}
                        values={Array.from({ length: 8 }, (_, i) => ({
                          label: `${i + 1}`,
                          value: `${i + 1}`,
                        }))}
                        value={formik.values[`answer${item}`] || ""}
                        onChange={formik.handleChange}
                      />
                    </div>
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setOptionCount((prev: any) => {
                        return prev.slice(0, prev.length - 1);
                      })
                    }
                  >
                    <HighlightOffRoundedIcon sx={{ color: "tomato" }} />
                  </div>
                </Box>
              );
            })}
            <div
              className="text-primary cursor-pointer"
              onClick={() =>
                setOptionCount((prev: any) => {
                  return [...prev, prev.length + 1];
                })
              }
            >
              <AddCircleOutlineRoundedIcon /> Add option
            </div>
          </div>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            px: 3,
            py: 1,
          }}
        >
          <div className="flex flex-row items-center gap-5">
            <DeleteOutlineOutlinedIcon sx={{ color: "tomato" }} />
            <Button label="Done" />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default Matching;
