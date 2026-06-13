import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Divider from "@mui/material/Divider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { Link, useLocation, useParams } from "react-router-dom";
import PlayLessonOutlinedIcon from "@mui/icons-material/PlayLessonOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import { useDispatch, useSelector } from "react-redux";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { getSubjectDetails } from "@/redux/reducers/subjectsReducer";
import Button from "../shared/Button";
import { RootState } from "@/redux/store";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import LiveHelpOutlinedIcon from "@mui/icons-material/LiveHelpOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import BackupTableOutlinedIcon from "@mui/icons-material/BackupTableOutlined";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import { getFixedScormUrl } from "@/utils/scormProxy";

type DataType = {
  id: string;
  path: string;
  index: number | string;
  type: string;
  name: string;
  about: string;
};

const Scorm = () => {
  // ----------- hooks ------------
  const [data, setData] = useState<DataType>({
    id: "",
    path: "",
    index: "",
    type: "",
    name: "",
    about: "",
  });
  const [activeId, setActiveId] = useState<any>("");
  const [dataType, setDataType] = useState<any>("");
  const param = useParams();
  const dispatch = useDispatch();
  const [content, setContent] = useState<any>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const subjectOverviewState = useSelector(
    (state: RootState) => state.subjects.subjectOverview
  );
  const [openedUnits, setOpenedUnits] = useState<any>([]);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [fixedScormUrl, setFixedScormUrl] = useState<string | null>(null);

  //   ------------ side effects ------------

  useEffect(() => {
    dispatch(getSubjectDetails(param.scormId)).then((res: any) => {
      setActiveId(param.content);
    });
  }, []);

  useEffect(() => {
    if (subjectOverviewState?.unit?.length) {
      setOpenedUnits(
        subjectOverviewState?.unit?.map((item: any) => {
          return item?.id;
        })
      );
    }
  }, [subjectOverviewState.unit]);

  useEffect(() => {
    setContent(
      subjectOverviewState?.units
        ?.map((item: any) => {
          return item.lessons.map((i: any) => {
            return i.contents;
          });
        })
        .flat()
        .flat()
    );
  }, [subjectOverviewState?.units]);

  // Set initial data when content is loaded and URL has content param
  useEffect(() => {
    if (param.content && subjectOverviewState?.units && !data?.id) {
      // Find the content item from all units
      for (const unit of subjectOverviewState.units) {
        for (const lesson of unit.lessons || []) {
          const contentItem = lesson.contents?.find((item: any) => item.id == param.content);
          if (contentItem) {
            setData({
              id: contentItem.id,
              path: contentItem.path,
              index: 0,
              type: contentItem.type,
              name: contentItem.name,
              about: contentItem.about || "",
            });
            setDataType(contentItem.type);
            setActiveId(contentItem.id);
            break;
          }
        }
      }
    }
  }, [param.content, subjectOverviewState?.units]);

  // Reset error and loading state when data changes
  useEffect(() => {
    if (data?.path) {
      setIframeError(null);
      setIframeLoading(true);
      setFixedScormUrl(null);
      
      // Check if this is SCORM content by type or URL pattern
      // Also check for game/interactive content that might need similar treatment
      const isScormContent = 
        dataType === "scrom" ||
        dataType === "scorm" ||
        dataType === "game" ||
        data?.path?.includes('/scrom/') || 
        data?.path?.includes('/scorm/') ||
        data?.path?.includes('/games/') ||
        data?.path?.endsWith('.html') ||
        data?.path?.includes('index.html') ||
        // Check if URL looks like interactive content (UUID pattern or specific domains)
        (data?.path?.includes('aboutabl.com') && !data?.path?.match(/\.(pdf|doc|docx|xls|xlsx|mp4|mp3|jpg|jpeg|png|gif)$/i));
      
      // For SCORM content, use the proxy function to fix CSP issues and local file detection
      if (isScormContent) {
        getFixedScormUrl(data.path)
          .then((url) => {
            setFixedScormUrl(url);
          })
          .catch((error) => {
            console.error("Error fixing SCORM URL:", error);
            setFixedScormUrl(data.path); // Fallback to original URL
          });
      } else {
        setFixedScormUrl(data.path);
      }
    }
  }, [data?.path, dataType]);

  // useEffect(() => {
  //   const iframe = document.getElementById('scormViewer') as HTMLIFrameElement | null;

  //   const handleLoad = () => {
  //     iframe?.contentWindow?.postMessage('play', '*');
  //   };

  //   iframe?.addEventListener('load', handleLoad);

  //   return () => {
  //     iframe?.removeEventListener('load', handleLoad);
  //   };
  // }, []);

  return (
    <>
      <Box sx={{ position: "relative", zIndex: 100 }}>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              width: `${isSidebarOpen ? "30%" : "0%"}`,
              transition: "all 0.5s",
              overflow: "hidden",
              height: "100vh",
              border: "1px solid #091E4224",

              bgcolor: "#fff",
            }}
          >
            <Box
              sx={{
                height: "100%",
                mb: 4,
              }}
            >
              <Link to={`/subjects/${param.scormId}`}>
                <Box
                  sx={{
                    py: 2,
                    px: 3,
                  }}
                >
                  <img src={require("../../assets/Logo.png")} alt="" />
                </Box>
              </Link>
              <Divider sx={{ mt: 1 }} />
              <Box
                sx={{
                  flexDirection: "row",
                  px: 3,
                  py: 2,
                  position: "relative",
                }}
              >
                <Typography
                  component={"p"}
                  sx={{ fontSize: "18px", fontWeight: "600" }}
                >
                  Course content
                </Typography>
                <p className="text-gray">
                  {subjectOverviewState?.units?.length} units
                </p>
              </Box>
              <Divider />

              <div
                className={"flex flex-col h-full overflow-y-auto text-black"}
              >
                {subjectOverviewState?.units?.map((item: any) => {
                  return (
                    <Unit
                      item={item}
                      openedUnits={openedUnits}
                      setOpenedUnits={setOpenedUnits}
                      setDataType={setDataType}
                      setActiveId={setActiveId}
                      setData={setData}
                      setContent={setContent}
                      activeId={activeId}
                      content={content}
                    />
                  );
                })}
              </div>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100vh",
              border: "1px solid #091E4224",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="z-10 absolute cursor-pointer left-[-20px] pl-2 text-white top-[150px] bg-green w-12 h-12 rounded-full flex justify-center items-center"
            >
              {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </div>
            <>
              <div className="p-4 px-10 bg-white flex justify-between items-center flex-row">
                <div className="flex flex-row gap-10">
                  {!isSidebarOpen && (
                    <Link to={`/subjects/${param.scormId}`}>
                      <img src={require("../../assets/Logo.png")} alt="" />
                    </Link>
                  )}
                  <p className="font-bold text-2xl text-primary">
                    {data?.name}
                  </p>
                </div>
                <div className="bg-white flex flex-row gap-10">
                  <button
                    className={`hover:font-black hover:text-lg transition-all ${
                      content?.findIndex((item: any) => {
                        return item.id == activeId;
                      }) == 0 || activeId == ""
                        ? "text-gray"
                        : "text-primary"
                    }`}
                    disabled={
                      content?.findIndex((item: any) => {
                        return item.id == activeId;
                      }) == 0 || activeId == ""
                    }
                    onClick={() => {
                      let index = content?.findIndex((item: any) => {
                        return item.id == activeId;
                      });

                      if (typeof index === "number" && index != -1) {
                        setDataType(content[index - 1]?.type);
                        setActiveId(content[index - 1]?.id);
                        setData(content[index - 1]);
                      }
                    }}
                  >
                    <span className="mx-2">
                      <KeyboardBackspaceIcon />
                    </span>
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      let index = content?.findIndex((item: any) => {
                        return item.id == activeId;
                      });

                      if (typeof index === "number" && index != -1) {
                        setDataType(content[index + 1]?.type);
                        setActiveId(content[index + 1]?.id);
                        setData(content[index + 1]);
                      }
                    }}
                    className={`hover:font-black hover:text-lg transition-all ${
                      content?.findIndex((item: any) => {
                        return item.id == activeId;
                      }) ==
                        content?.length - 1 || activeId == ""
                        ? "text-gray"
                        : "text-primary"
                    } `}
                    disabled={
                      content?.findIndex((item: any) => {
                        return item.id == activeId;
                      }) ==
                        content?.length - 1 || activeId == ""
                    }
                  >
                    Next
                    <span className="mx-2">
                      <KeyboardBackspaceIcon className="rotate-180" />
                    </span>
                  </button>
                </div>
              </div>
              <div className="w-full h-full flex justify-center items-center">
                {dataType === "video" ? (
                  <video
                    className="w-full h-4/5"
                    src={data?.path}
                    aria-controls="video"
                    controls
                    autoPlay
                  ></video>
                ) : dataType === "image" ? (
                  <img src={data?.path} alt="i" />
                ) : dataType === "pdf" ? (
                  <>
                    {iframeError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                          Failed to load PDF
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {iframeError}
                        </Typography>
                        <Button
                          label="Retry"
                          onClick={() => {
                            setIframeError(null);
                            setIframeLoading(true);
                          }}
                        />
                      </div>
                    ) : (
                      <embed
                        src={`${data?.path}#toolbar=1&navpanes=1&scrollbar=1`}
                        type="application/pdf"
                        className="w-full h-full"
                        style={{ minHeight: '600px' }}
                        onLoad={() => setIframeLoading(false)}
                        onError={() => {
                          setIframeError("Unable to load the PDF file. Please check if the file URL is accessible.");
                          setIframeLoading(false);
                        }}
                      />
                    )}
                  </>
                ) : dataType === "word" || dataType === "excel" ? (
                  <>
                    {iframeError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                          Failed to load content
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {iframeError}
                        </Typography>
                        <Button
                          label="Retry"
                          onClick={() => {
                            setIframeError(null);
                            setIframeLoading(true);
                          }}
                        />
                      </div>
                    ) : (
                      <iframe
                        title="Word and excel Viewer"
                        className="w-full h-full"
                        height={"100%"}
                        width={"100%"}
                        src={
                          "https://view.officeapps.live.com/op/embed.aspx?src=" +
                          data?.path
                        }
                        allow="fullscreen"
                        allowFullScreen
                        onLoad={() => setIframeLoading(false)}
                        onError={() => {
                          setIframeError("Unable to load the document. Please check if the file URL is accessible.");
                          setIframeLoading(false);
                        }}
                      />
                    )}
                  </>
                ) : dataType === "scrom" || dataType === "scorm" ? (
                  <>
                    {iframeError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                          Failed to load SCORM content
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {iframeError}
                        </Typography>
                        <Button
                          label="Retry"
                          onClick={() => {
                            setIframeError(null);
                            setIframeLoading(true);
                          }}
                        />
                      </div>
                    ) : fixedScormUrl ? (
                      <iframe
                        src={fixedScormUrl}
                        id="scormViewer"
                        title="SCORM Viewer"
                        className="w-full h-full"
                        height={"100%"}
                        width={"100%"}
                        allow="autoplay; fullscreen; microphone; camera"
                        allowFullScreen
                        onLoad={() => setIframeLoading(false)}
                        onError={() => {
                          setIframeError("Unable to load the SCORM content. Please check if the file URL is accessible.");
                          setIframeLoading(false);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Typography>Loading SCORM content...</Typography>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {iframeError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8">
                        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                          Failed to load content
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {iframeError}
                        </Typography>
                        <Button
                          label="Retry"
                          onClick={() => {
                            setIframeError(null);
                            setIframeLoading(true);
                          }}
                        />
                      </div>
                    ) : fixedScormUrl ? (
                      <iframe
                        title="SCORM Viewer"
                        className="w-full h-full"
                        height={"100%"}
                        width={"100%"}
                        src={fixedScormUrl}
                        allow="autoplay; fullscreen; microphone; camera"
                        allowFullScreen
                        onLoad={() => setIframeLoading(false)}
                        onError={() => {
                          setIframeError("Unable to load the content. Please check if the file URL is accessible.");
                          setIframeLoading(false);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Typography>Loading content...</Typography>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
            {/* )} */}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Scorm;

const Unit = ({
  item,
  openedUnits,
  setOpenedUnits,
  setDataType,
  setActiveId,
  setData,
  setContent,
  activeId,
  content,
}: any) => {
  return (
    <>
      <div
        onClick={() => {
          if (openedUnits.includes(item.id)) {
            setOpenedUnits((prev: any) =>
              prev.filter((id: any) => id !== item.id)
            );
          } else {
            setOpenedUnits((prev: any) => [...prev, item.id]);
          }
        }}
        className="font-bold cursor-pointer bg-veryLightGray flex justify-between px-6 text-lg py-4 border-b  border-b-lightGray shadow-sm"
      >
        {item.name}
        {!openedUnits.includes(item.id) ? (
          <ArrowDropDownIcon />
        ) : (
          <ArrowDropUpIcon />
        )}
      </div>
      <div className={`${!openedUnits.includes(item.id) && "hidden"}`}>
        {!item?.lessons?.length && (
          <div className="text-center text-xs p-3">No Lessons to display!</div>
        )}
        {item.lessons.map((lesson: any) => {
          return (
            <Lesson
              lesson={lesson}
              setDataType={setDataType}
              setActiveId={setActiveId}
              setData={setData}
              setContent={setContent}
              activeId={activeId}
              content={content}
            />
          );
        })}
      </div>
    </>
  );
};

const Lesson = ({
  lesson,
  setDataType,
  setActiveId,
  setData,
  setContent,
  activeId,
  content,
}: any) => {
  const param = useParams();
  const [activeLesson, setActiveLesson] = useState<any>("");
  const [openLesson, setOpenLesson] = useState(false);

  useEffect(() => {
    const contentList = lesson?.contents?.map((item: any, index: any) => {
      if (item.id == param.content) {
        setData({
          id: item.id,
          path: item.path,
          index: +index,
          type: item.type,
          name: item.name,
          about: item.about,
        });
        setDataType(item.type);
      }
      return {
        id: item.id,
        path: item.path,
        index: +index + +content?.length,
        type: item.type,
        name: item.name,
        about: item.about,
      };
    });
  }, []);

  useEffect(() => {
    let lessonIndex: any = lesson?.contents?.findIndex((item: any) => {
      return item.id == activeId;
    });
    setActiveLesson(lessonIndex === -1 ? "" : lesson.id);
    setOpenLesson(
      lessonIndex !== -1 && openLesson == false ? true : openLesson
    );
  }, [activeId]);

  return (
    <>
      <div
        className={`font-bold flex flex-row items-center justify-between px-6  border-b  border-b-lightGray  py-4 cursor-pointer ${
          activeLesson == lesson?.id
            ? "bg-lightGreen border-green border-l-4"
            : " border-l-white"
        }`}
        onClick={() => {
          setOpenLesson(!openLesson);
        }}
      >
        <div className="flex flex-row items-center gap-1">
          <PlayLessonOutlinedIcon />
          {lesson?.name}
        </div>
        {!openLesson ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
      </div>
      <div className={`${!openLesson && "hidden"}`}>
        {!lesson.contents?.length && (
          <div className="text-center text-xs p-3">No Content to display!</div>
        )}
        {lesson?.contents?.map((content: any, index: any) => {
          return (
            <>
              <div
                onClick={() => {
                  setDataType(content?.type);

                  setActiveId(content?.id);
                  setData(content);
                }}
                className={`flex cursor-pointer flex-row items-center justify-start gap-3 px-10 py-3 ${
                  activeLesson == lesson?.id
                    ? "bg-lightGreen border-green"
                    : " border-l-white"
                }`}
              >
                <div
                  className={`flex flex-row items-center gap-2 ${
                    activeId == content?.id ? "text-green font-semibold" : ""
                  }`}
                >
                  {content?.type === "video" ? (
                    <PlayCircleOutlineIcon />
                  ) : content?.type === "quiz" ? (
                    <LiveHelpOutlinedIcon />
                  ) : content?.type === "audio" ? (
                    <AudioFileOutlinedIcon />
                  ) : content?.type === "pdf" ? (
                    <PictureAsPdfOutlinedIcon />
                  ) : content?.type === "image" ? (
                    <InsertPhotoOutlinedIcon />
                  ) : content?.type === "word" ? (
                    <TextSnippetOutlinedIcon />
                  ) : (
                    <BackupTableOutlinedIcon />
                  )}

                  <span>{content?.name}</span>
                </div>
              </div>
            </>
          );
        })}
      </div>
    </>
  );
};
