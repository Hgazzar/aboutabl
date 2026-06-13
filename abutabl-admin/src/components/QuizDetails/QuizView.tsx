import { Box, Typography, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import QuestionPreview from "../questionBank/QuestionPreview";
import { getQuestionDetails } from "@/redux/reducers/questionBankReducer";
import { useDispatch } from "react-redux";

const AddedQuestion = ({ formik }: any) => {
  // ----------- hooks ------------
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const dispatch = useDispatch();
  // ----------- function ------------
  console.log(activeQuestion);

  return (
    <>
      <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "col",
              gap: 3,
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            {formik?.map((item: any, index: any) => (
              <Box
                onClick={() => {
                  dispatch(getQuestionDetails(item?.info?.id)).then(
                    (res: any) => {
                      const answers: any = [];
                      if (res.payload.question?.type === "Matching") {
                        for (let [key, value] of Object.entries(
                          res.payload.question as object
                        )) {
                          if (key.slice(0, 6) === "answer") {
                            answers.push([
                              key.length === 7
                                ? `q${key[key.length - 1]}`
                                : `a${key[key.length - 1]}`,
                              value,
                            ]);
                          }
                        }
                      }

                      setActiveQuestion({
                        ...res.payload.question,
                        answer: answers.length
                          ? answers
                          : res.payload.question.corAnswer,
                        score: item?.score,
                        multiAnswer: [
                          res.payload.question.answer1,
                          res.payload.question.answer2,
                          res.payload.question.answer3,
                          res.payload.question.answer4,
                          res.payload.question.answer5,
                        ],
                        index,
                      });
                    }
                  );
                }}
                // sx={{ width: "100px" }}
              >
                <div
                  className={`w-32 border p-5 rounded-lg cursor-pointer hover:border-green hover:bg-lightGreen flex flex-col items-start gap-1 ${
                    activeQuestion?.index === index
                      ? "border-green bg-lightGreen "
                      : "border-lightGray"
                  }`}
                >
                  <div className="rounded-md w-6 h-6 flex justify-center items-center mx-auto">
                    <p className="font-semibold pt-2 text-green">
                      Q{index + 1}
                    </p>
                  </div>
                  <p className="text-gray text-sm pt-2">Point: {item?.score}</p>
                </div>
              </Box>
            ))}
          </Box>
          <div
          // className={`border p-5 rounded-lg border-lightGray cursor-pointer hover:border-green hover:bg-lightGreen flex flex-col items-start gap-1`}
          >
            {/* <div className="rounded-md w-full flex justify-center items-center">
              <p className="font-semibold pt-2 text-green">Total score:</p>
            </div>
            <p className="text-gray text-sm pt-2">
              Point:{" "}
              {formik?.values?.q_score?.reduce((item: any, acc: any) => {
                return item + acc;
              })}
            </p> */}
          </div>
        </Box>
        {activeQuestion && (
          <>
            <Divider />
            <QuestionPreview
              type={activeQuestion.type}
              question={activeQuestion.question}
              score={activeQuestion.score}
              answer={
                activeQuestion.type === "MCQ"
                  ? activeQuestion?.multiAnswer
                  : activeQuestion?.answer
              }
              corAnswer={activeQuestion.corAnswer}
              question_audio={activeQuestion?.question_audio}
              question_image={activeQuestion?.question_image}
              active={activeQuestion}
            />
          </>
        )}
      </Box>
    </>
  );
};

export default AddedQuestion;
