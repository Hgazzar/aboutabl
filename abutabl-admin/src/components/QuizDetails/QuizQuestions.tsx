import { Box, Typography, Divider, Input } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import React, { useEffect, useState } from "react";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import SelectBox from "../shared/SelectBox";
import { useDispatch } from "react-redux";
import { getQuestionList } from "@/redux/reducers/questionBankReducer";
import SelectQuistion from "../shared/SelectQuistionComponent";

const QuizQuestions = ({
  formik,
  optionCount,
  setOptionCount,
  score,
  setScore,
  questions,
  setQuestions,
}: any) => {
  // ------------ hooks -------------
  const [questionList, setQuestionList] = useState([]);
  const dispatch = useDispatch();

  // ------------ functions -------------

  // ------------ use effect -------------
  useEffect(() => {
    dispatch(getQuestionList()).then((res: any) => {
      setQuestionList(() => {
        return res?.payload?.question?.map((item: any) => {
          return {
            label: item?.question?.split(",")?.filter((q: any) => {
                return !q.includes("https");
              })
              .join(" "),
            value: item.id,
          };
        });
      });
    });
  }, []);
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Questions
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <div>
            {optionCount?.map((item: any, index: any) => {
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
                      Question {item} <span className="text-red">*</span>
                    </label>
                    <SelectQuistion
                      values={questionList}
                      onChange={(e: any) => {
                        setQuestions((prev: any) => {
                          const newQuestions = [...prev];
                          newQuestions[index] = e.value;
                          return newQuestions;
                        });
                      }}
                      id={`q_id[${index}]`}
                      name={`q_id[${index}]`}
                      value={questions[index]?.id}
                    />
                    {/* <SelectBox
                      values={questionList}
                      onChange={(e: any) => {
                        setQuestions((prev: any) => {
                          const newQuestions = [...prev];
                          newQuestions[index] = e.target.value;
                          return newQuestions;
                        });
                      }}
                      id={`q_id[${index}]`}
                      name={`q_id[${index}]`}
                      value={questions[index]?.id}
                    /> */}
                    <div className="flex flex-col gap-0 mb-4">
                      <label className="text-sm font-semibold mb-1">
                        Score <span className="text-red">*</span>
                      </label>

                      <Input
                        type="number"
                        id={`q_score[${index}]`}
                        name={`q_score[${index}]`}
                        value={score[index]}
                        onChange={(e: any) => {
                          if (e.target.value >= 0) {
                            setScore((prev: any) => {
                              const newScore = [...prev];
                              newScore[index] = e.target.value;
                              return newScore;
                            });
                          }
                        }}
                        sx={{
                          border: "1px solid #091E4224",
                          p: 0.5,
                          borderRadius: 1,
                          outline: "0px",
                          "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button":
                            {
                              appearance: "none",
                              margin: 0,
                            },
                          "-moz-appearance": "textfield", // For Firefox
                        }}
                        size="medium"
                      />
                    </div>
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setOptionCount((prev: any) => {
                        return prev.slice(0, prev.length - 1);
                      });
                      setScore((prev: any) => {
                        return prev?.filter((_: any, i: any) => {
                          return i !== index;
                        });
                      });
                      setQuestions((prev: any) => {
                        return prev?.filter((_: any, i: any) => {
                          return i !== index;
                        });
                      });
                    }}
                  >
                    <HighlightOffRoundedIcon sx={{ color: "tomato" }} />
                  </div>
                </Box>
              );
            })}
            <div
              className="text-primary cursor-pointer"
              onClick={() => {
                setOptionCount((prev: any) => {
                  return [...prev, prev.length + 1];
                });
                setScore((prev: any) => {
                  return [...prev, 0];
                });
                setQuestions((prev: any) => {
                  return [...prev, null];
                });
              }}
            >
              <AddCircleOutlineRoundedIcon /> Add Question
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default QuizQuestions;
