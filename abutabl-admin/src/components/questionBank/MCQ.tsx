import { Box, Divider, TextField, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import Button from "../shared/Button";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import TextEditor from "../shared/TextEditor";
import { useFormik } from "formik";
import "react-quill/dist/quill.snow.css"; // Import the styles
import SelectBox from "../shared/SelectBox";
import SwitchBox from "../shared/SwitchBox";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

type Props = {
  type: "MCQ" | "TF" | "SHN" | "Matching";
  setType: (type: "MCQ" | "TF" | "SHN" | "Matching") => void;
  formik: any;
  /** When true (e.g. question-bank edit), hides the draft footer with Next/delete icons. */
  hideFormFooter?: boolean;
};

const MCQ = ({ type, setType, formik, hideFormFooter = false }: Props) => {
  // ------------ hooks -------------
  const [optionCount, setOptionCount] = useState<any>([]);

  // Initialize optionCount only once when data is loaded - don't sync after that
  const hasInitialized = React.useRef<boolean>(false);
  const prevQuestionRef = React.useRef<string>("");
  
  useEffect(() => {
    // Only initialize once when question data is first loaded (when question field gets populated)
    const currentQuestion = formik?.values?.question || "";
    const questionJustLoaded = currentQuestion && currentQuestion !== prevQuestionRef.current && !hasInitialized.current;
    
    if (formik && formik.values && questionJustLoaded) {
      const answers: number[] = [];
      for (let i = 1; i <= 8; i++) {
        const answerValue = formik.values[`answer${i}`];
        if (answerValue && String(answerValue).trim() !== '') {
          answers.push(i);
        }
      }
      if (answers.length > 0) {
        setOptionCount(answers);
      }
      hasInitialized.current = true;
      prevQuestionRef.current = currentQuestion;
    } else if (currentQuestion) {
      prevQuestionRef.current = currentQuestion;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik?.values?.question]);

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
                  value={formik.values.score}
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
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  View style <span className="text-red">*</span>
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
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Numbering style
                </label>
                <SelectBox
                  styles={{ width: "100%" }}
                  id={"nStyle"}
                  name={"nStyle"}
                  values={[
                    {
                      label: "Scorm",
                      value: "scorm",
                    },
                  ]}
                  value={formik.values.nStyle}
                  onChange={formik.onChange}
                />
              </div>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Max no. per line
                </label>
                <SelectBox
                  styles={{ width: "100%" }}
                  id={"maxLineNumber"}
                  name={"maxLineNumber"}
                  values={[
                    {
                      label: "Scorm",
                      value: "scorm",
                    },
                  ]}
                  value={formik.values.maxLineNumber}
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
                    height: "200px",
                    bgcolor: "#F7F9FA",
                    my: 3,
                    px: 3,
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
                      Choice {item} <span className="text-red">*</span>
                    </label>
                    <TextEditor
                      id={`answer${item}`}
                      formik={formik}
                      height="50px"
                      placeholder="Choice can be text or image"
                    />
                    <div className="mt-10">
                      <input 
                        type="checkbox" 
                        checked={formik.values.corAnswer === `answer${item}` || formik.values.corAnswer === item.toString()}
                        onChange={(e) => {
                          if (e.target.checked) {
                            formik.setFieldValue("corAnswer", `answer${item}`);
                          }
                        }}
                      /> Set as correct
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
        {!hideFormFooter && (
          <>
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
                <Button label="Next" onClick={() => console.log(formik.values)} />
              </div>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MCQ;
