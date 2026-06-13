import { Box, Divider, Typography } from "@mui/material";
import MatchingFlow from "../shared/MatchingFlow";
import { imageFormats } from "@/constants/constants";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
//@ts-ignore
import bird from "@/assets/bird.svg";
import AudioIcon from "./AudioIcon";
import { HtmlPreview } from "@/utils/htmlPreview";
import { mcqOptionRowShouldShow, mcqOptionIsCorrect } from "@/utils/answerContent";

type Props = {
  type: "MCQ" | "TF" | "SHN" | "Matching";
  question: any;
  score: string;
  answer: string[];
  corAnswer?: any;
  code?: any;
  question_audio?: any;
  question_image?: any;
  active?: any;
};

const QuestionPreview = ({
  type,
  question,
  score,
  answer,
  corAnswer,
  code,
  question_audio,
  question_image,
  active,
}: Props) => {
  return (
    <Box sx={{ p: 5 }}>
      {/* ---------------- MCQ ------------------ */}
      {type === "MCQ" && (
        <Box
          sx={{
            py: 10,
            mx: "auto",
            width: {
              xs: "100%",
              sm: "100%",
              md: "100%",
            },
          }}
        >
          <div className="text-[#f7ad66] py-2 flex flex-row items-center gap-1">
            <span className="bg-[#f7ad66] text-white w-7 h-7 justify-center items-center rounded-full inline-flex">
              <MenuBookIcon className="" fontSize="small" />
            </span>{" "}
            <span className="text-bold text-lg">Reading</span>
          </div>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "16px",
              fontWeight: "600",
              fontSize: "18px",
              marginBottom: "16px",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                fontWeight: "600",
                fontSize: "18px",
                pb: 5,
              }}
            >
              {question_audio && <AudioIcon src={question_audio} />}
              {question?.split(",")[0] &&
              question.split(",")[0]?.includes(".mp3") ? (
                // <audio src={question.split(",")[0]} controls/>
                <AudioIcon src={question.split(",")[0]} />
              ) : question.split(",")[0]?.includes(".jpg") ||
                question.split(",")[0]?.includes(".png") ? (
                <img className="w-96" src={question.split(",")[0]} alt="" />
              ) : question.split(",")[0]?.includes(".mp4") ||
                question.split(",")[0]?.includes(".mkv") ||
                question.split(",")[0]?.includes(".avi") ||
                question.split(",")[0]?.includes(".ogg") ? (
                <video width="320" height="240" controls>
                  <source src={question.split(",")[0]} type="video/mp4" />
                  <source src={question.split(",")[0]} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <HtmlPreview
                  content={question.split(",")[0]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}
              {question?.split(",")[1] &&
              question.split(",")[1]?.includes(".mp3") ? (
                // <audio src={question.split(",")[1]}  controls/>
                <AudioIcon src={question.split(",")[1]} />
              ) : question.split(",")[1]?.includes(".jpg") ||
                question.split(",")[1]?.includes(".png") ? (
                <img className="w-96" src={question.split(",")[1]} alt="" />
              ) : question.split(",")[1]?.includes(".mp4") ||
                question.split(",")[1]?.includes(".mkv") ||
                question.split(",")[1]?.includes(".avi") ||
                question.split(",")[1]?.includes(".ogg") ? (
                <video width="321" height="241" controls>
                  <source src={question.split(",")[1]} type="video/mp4" />
                  <source src={question.split(",")[1]} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <HtmlPreview
                  content={question.split(",")[1]}
                  className="inline-block [&_p]:m-0"
                />
              )}
              {question_image && (
                <img className="w-96" src={question_image} alt="" />
              )}
            </Typography>
          </Box>
          {question?.split(",")[2] &&
          question.split(",")[2]?.includes(".mp3") ? (
            // <audio src={question.split(",")[2]} controls/>
            <AudioIcon src={question.split(",")[2]} />
          ) : question.split(",")[2]?.includes(".jpg") ||
            question.split(",")[2]?.includes(".png") ? (
            <img
              src={question.split(",")[2]}
              alt=""
              className="w-64 my-10 mr-auto shadow-lg rounded-lg"
            />
          ) : question.split(",")[2]?.includes(".mp4") ||
            question.split(",")[2]?.includes(".mkv") ||
            question.split(",")[2]?.includes(".avi") ||
            question.split(",")[2]?.includes(".ogg") ? (
            <video width="322" height="242" controls>
              <source src={question.split(",")[2]} type="video/mp4" />
              <source src={question.split(",")[2]} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <HtmlPreview
              content={question.split(",")[2]}
              className="py-2 [&_p]:m-0"
            />
          )}
          {code && (
            <p className="text-md text-gray font-bold">
              Standard Code : <span className="text-md">({code})</span>
            </p>
          )}
          <p className="text-md text-gray font-bold">
            Your answer : <span className="text-md">({score} points)</span>
          </p>
          <div className="flex flex-row items-center justify-evenly gap-10 w-full overflow-auto">
            {(answer ?? [])
              .map((item: any, idx: number) => ({
                item,
                optionNum: idx + 1,
              }))
              .filter(({ item, optionNum }) =>
                mcqOptionRowShouldShow(item, optionNum, active)
              )
              .map(({ item, optionNum }) => {
                const img = item?.split(",")?.find((x: any) => {
                  return imageFormats?.includes(x.slice(-4));
                });
                const option = item?.split(",")?.filter((x: any) => {
                  return x !== img;
                });
                const optJoined = option?.join("") ?? "";
                const answerImage = active?.[`answer${optionNum}_image`];
                const answerAudio = active?.[`answer${optionNum}_audio`];
                const embeddedAudioInText = /\.(mp3|m4a|wav|aac|flac|ogg|webm)(\?|#|$)/i.test(
                  optJoined
                );
                const embeddedImageInText =
                  optJoined.includes(".png") ||
                  optJoined.includes(".jpg") ||
                  /\.(jpe?g|gif|webp|png)(\?|#|$)/i.test(optJoined);

                const isCorrect = mcqOptionIsCorrect(corAnswer, optionNum, item);
                return (
                  <div
                    key={`mcq-opt-${optionNum}`}
                    className={`flex-1 my-3 p-4 flex flex-row items-center gap-4 w-full font-bold rounded-xl border-b-8 ${
                      isCorrect
                        ? "border border-green bg-lightGreen"
                        : "border border-easyGray bg-white"
                    }`}
                  >
                    <div className="flex flex-row items-start gap-2 flex-1 min-w-0">
                      {embeddedAudioInText ? (
                        <AudioIcon src={optJoined} />
                      ) : (
                        <>
                          {answerAudio ? (
                            <AudioIcon src={answerAudio} />
                          ) : null}
                          {embeddedImageInText ? (
                            <img
                              src={optJoined}
                              alt=""
                              className="max-w-full"
                            />
                          ) : (
                            <HtmlPreview
                              content={optJoined}
                              className="[&_p]:m-0 flex-1 min-w-0"
                            />
                          )}
                        </>
                      )}
                    </div>
                    {answerImage ? (
                      <img
                        src={answerImage}
                        alt=""
                        className="w-52 shrink-0"
                      />
                    ) : null}
                    {img ? (
                      <div className="w-52 my-3 shrink-0">
                        <img src={img} alt="" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </Box>
      )}
      {/* ---------------- True or False ------------------ */}
      {type === "TF" && (
        <Box
          sx={{
            mx: "auto",
            width: {
              xs: "100%",
              sm: "100%",
              md: "60%",
            },
          }}
        >
          <p className="text-[#f7ad66] py-2 flex flex-row items-center gap-1">
            <span className="bg-[#f7ad66] text-white w-7 h-7 justify-center items-center rounded-full inline-flex">
              <MenuBookIcon className="" fontSize="small" />
            </span>{" "}
            <p className="text-bold text-lg">Reading</p>
          </p>

          <Box>
            <Typography
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "16px",
                fontWeight: "600",
                fontSize: "18px",
              }}
              variant="h5"
            >
              {question?.split(",")[0] &&
              question.split(",")[0]?.includes(".mp3") ? (
                // <audio src={question.split(",")[0]} controls/>
                <AudioIcon src={question.split(",")[0]} />
              ) : question.split(",")[0]?.includes(".jpg") ||
                question.split(",")[0]?.includes(".png") ? (
                <img
                  className="w-72 my-10 mx-auto shadow-lg rounded-lg"
                  src={question.split(",")[0]}
                  alt=""
                />
              ) : question.split(",")[0]?.includes(".mp4") ||
                question.split(",")[0]?.includes(".mkv") ||
                question.split(",")[0]?.includes(".avi") ||
                question.split(",")[0]?.includes(".ogg") ? (
                <video width="320" height="240" controls>
                  <source src={question.split(",")[0]} type="video/mp4" />
                  <source src={question.split(",")[0]} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <HtmlPreview
                  content={question.split(",")[0]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}
              {question?.split(",")[1] &&
              question.split(",")[1]?.includes(".mp3") ? (
                <AudioIcon src={question.split(",")[1]} />
              ) : // <audio src={question.split(",")[1]} controls/>
              question.split(",")[1]?.includes(".jpg") ||
                question.split(",")[1]?.includes(".png") ? (
                <img
                  className="w-72 my-10 mx-auto shadow-lg rounded-lg"
                  src={question.split(",")[1]}
                  alt=""
                />
              ) : question.split(",")[1]?.includes(".mp4") ||
                question.split(",")[1]?.includes(".mkv") ||
                question.split(",")[1]?.includes(".avi") ||
                question.split(",")[1]?.includes(".ogg") ? (
                <video width="321" height="241" controls>
                  <source src={question.split(",")[1]} type="video/mp4" />
                  <source src={question.split(",")[1]} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <HtmlPreview
                  content={question.split(",")[1]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}
            </Typography>
          </Box>
          {question?.split(",")[2] &&
          question.split(",")[2]?.includes(".mp3") ? (
            <AudioIcon src={question.split(",")[2]} />
          ) : // <audio src={question.split(",")[2]} controls/>
          question.split(",")[2]?.includes(".jpg") ||
            question.split(",")[1]?.includes(".png") ? (
            <img
              className="w-64 my-10 mr-auto shadow-lg rounded-lg"
              src={question.split(",")[2]}
              alt=""
            />
          ) : question.split(",")[2]?.includes(".mp4") ||
            question.split(",")[2]?.includes(".mkv") ||
            question.split(",")[2]?.includes(".avi") ||
            question.split(",")[2]?.includes(".ogg") ? (
            <video width="322" height="242" controls>
              <source src={question.split(",")[2]} type="video/mp4" />
              <source src={question.split(",")[2]} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <HtmlPreview
              content={question.split(",")[2]}
              className="inline-block py-2 [&_p]:m-0"
            />
          )}
          {code && (
            <p className="text-md text-gray font-bold">
              Standard Code : <span className="text-md">({code})</span>
            </p>
          )}
          <p className="text-md text-gray font-bold">
            Your answer : <span className="text-md">({score} points)</span>
          </p>
          <div className="flex flex-row justify-center gap-10">
            <div
              className={`w-1/2 my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 rounded-xl border-b-8 ${
                corAnswer == 1
                  ? "border border-green bg-lightGreen"
                  : "border border-easyGray bg-white"
              }`}
            >
              True
            </div>
            <div
              className={`w-1/2 rounded-xl my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 border-b-8  ${
                corAnswer == 0
                  ? "border border-green bg-lightGreen"
                  : "border border-easyGray bg-white"
              }`}
            >
              False
            </div>
          </div>
        </Box>
      )}
      {/* ---------------- Short notes ------------------ */}
      {type === "SHN" && (
        <Box
          sx={{
            mx: "auto",
            width: {
              xs: "100%",
              sm: "100%",
              md: "60%",
            },
          }}
        >
          <div className="text-[#2962ff] px-6 py-2 flex flex-row items-center gap-1">
            <span className="bg-[#2962ff] text-white w-7 h-7 justify-center items-center rounded-full inline-flex">
              <DriveFileRenameOutlineIcon className="" fontSize="small" />
            </span>{" "}
            <span className="text-bold text-lg">Writing</span>
          </div>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                fontWeight: "600",
                fontSize: "18px",
              }}
            >
              {/* {(question?.split(",")[0] &&
                question.split(",")[0]?.includes(".mp3")) ||
              question.split(",")[0]?.includes(".png") ?
               (
                <img
                  className="inline-block px-3"
                  src={require("@/assets/voice.png")}
                  alt=""
                />
              ) 
              : (
                <p className="py-2">{question.split(",")[0]}</p>
              )} */}

              {question?.split(",")[0] &&
              question.split(",")[0]?.includes(".mp3") ? (
                // <audio src={question.split(",")[0]} controls/>
                <AudioIcon src={question.split(",")[0]} />
              ) : question.split(",")[0]?.includes(".png") ? (
                <img className="w-96" src={question.split(",")[0]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[0]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}
              {question?.split(",")[1] &&
              question.split(",")[1]?.includes(".mp3") ? (
                // <audio src={question.split(",")[1]} controls/>
                <AudioIcon src={question.split(",")[1]} />
              ) : question.split(",")[1]?.includes(".png") ? (
                <img className="w-96" src={question.split(",")[1]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[1]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}

              {question?.split(",")[2] &&
              question.split(",")[2]?.includes(".mp3") ? (
                // <audio src={question.split(",")[2]} controls/>
                <AudioIcon src={question.split(",")[2]} />
              ) : question.split(",")[2]?.includes(".png") ? (
                <img src={question.split(",")[2]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[2]}
                  className="py-2 [&_p]:m-0"
                />
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#F7F9FA",
              my: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "stretch",
              alignItems: "flex-start",
            }}
          >
            <p className="text-md text-gray font-bold">
              Your answer : <span className="text-md">({score} points)</span>
            </p>
            <div
              className={`w-full my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 rounded-xl border-b-8 border border-green bg-lightGreen`}
            >
              <HtmlPreview
                content={Array.isArray(answer) ? answer[0] ?? "" : String(answer)}
                className="[&_p]:m-0"
              />
            </div>
          </Box>
        </Box>
      )}
      {/* ---------------- Matching ------------------ */}
      {type === "Matching" && (
        <Box
          sx={{
            mx: "auto",
            width: {
              xs: "100%",
              sm: "100%",
              md: "60%",
            },
          }}
        >
          <p className="text-[#f7ad66] py-2 flex flex-row items-center gap-1">
            <span className="bg-[#f7ad66] text-white w-7 h-7 justify-center items-center rounded-full inline-flex">
              <MenuBookIcon className="" fontSize="small" />
            </span>{" "}
            <p className="text-bold text-lg">Reading</p>
          </p>
          {code && (
            <p className="text-md text-gray font-bold">
              Standard Code : <span className="text-md">({code})</span>
            </p>
          )}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                fontWeight: "600",
                fontSize: "18px",
              }}
            >
              {/* {(question?.split(",")[0] &&
                question.split(",")[0]?.includes(".mp3")) ||
              question.split(",")[0]?.includes(".png") ? (
                <img
                  className="inline-block px-3"
                  src={require("@/assets/voice.png")}
                  alt=""
                />
              ) : (
                <p className="py-2">{question.split(",")[0]}</p>
              )} */}

              {question?.split(",")[0] &&
              question.split(",")[0]?.includes(".mp3") ? (
                // <audio src={question.split(",")[0]} controls/>
                <AudioIcon src={question.split(",")[0]} />
              ) : question.split(",")[0]?.includes(".png") ||
                question.split(",")[0]?.includes(".jpg") ? (
                <img className="w-96" src={question.split(",")[0]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[0]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}
              {question?.split(",")[1] &&
              question.split(",")[1]?.includes(".mp3") ? (
                // <audio src={question.split(",")[1]} controls/>
                <AudioIcon src={question.split(",")[1]} />
              ) : question.split(",")[1]?.includes(".png") ? (
                <img className="w-96" src={question.split(",")[1]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[1]}
                  className="inline-block py-2 [&_p]:m-0"
                />
              )}

              {question?.split(",")[2] &&
              question.split(",")[2]?.includes(".mp3") ? (
                // <audio src={question.split(",")[2]} controls/>
                <AudioIcon src={question.split(",")[2]} />
              ) : question.split(",")[2]?.includes(".png") ? (
                <img src={question.split(",")[2]} alt="" />
              ) : (
                <HtmlPreview
                  content={question.split(",")[2]}
                  className="py-2 [&_p]:m-0"
                />
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#F7F9FA",
              my: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "stretch",
              alignItems: "flex-start",
            }}
          >
            <p className="text-md text-gray font-bold">
              Your answer : <span className="text-md">({score} points)</span>
            </p>
          </Box>
          <div className="flex flex-col gap-0 mb-4">
            <MatchingFlow answer={answer} corAnswer={corAnswer} />
          </div>
        </Box>
      )}
      <img className="w-72 h-72 scale-x-[-1] mx-20" src={bird} alt="" />
    </Box>
  );
};

export default QuestionPreview;
