import { Box, Divider, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import SubjectStatus from "../shared/SubjectStatus";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  getSubjectDetails,
  setSubjectStatus,
} from "../../redux/reducers/subjectsReducer";
import LoadingWrapper from "../shared/LoadingWrapper";
import { useTranslation } from "react-i18next";

const Overview = ({ formik }: any) => {
  const param = useParams();
  const dispatch = useDispatch();
  // ------------ side effects -------------
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const defaultLogo = require("../../assets/Logo.png");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await dispatch(getSubjectDetails(param.id));
      setIsLoading(false);
    })();
  }, []);
  const subjectOverviewState = useSelector(
    (state: RootState) => state.subjects.subjectOverview
  );

  const { t } = useTranslation();
  const { i18n } = useTranslation();

  // ------------- side effects ---------------
  // Ensure body direction matches current language
  useEffect(() => {
    const currentLang = i18n.language || "en";
    document.body.dir = currentLang === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // ------------ hooks ---------------

  const navigate = useNavigate();

  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionsSubjects = permissionState?.permissions?.subjects;
  const activationSubjects = permissionsSubjects?.find(
    (permission: any) => permission["activation-subjects"] === "1"
  );

  // Check if image URL is valid (not empty, not just a directory path)
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Check if URL ends with just /storage/ or similar directory paths
    if (url.endsWith('/storage/') || url.endsWith('/storage') || url.trim() === '') {
      return false;
    }
    // Check if URL has a file extension or contains a filename
    const hasFilename = url.split('/').pop()?.includes('.') || false;
    return hasFilename;
  };

  const subjectPhoto = subjectOverviewState?.basic_info?.[0]?.photo;
  const shouldUseDefault = !isValidImageUrl(subjectPhoto) || imageError;
  const displayImage = shouldUseDefault ? defaultLogo : subjectPhoto;

  return (
    <LoadingWrapper isLoading={isLoading}>
      <Box sx={{ my: 2, mr: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={11} md={3.7}>
            <Box
              sx={{
                marginBottom: 4,
                bgcolor: "#fff",
                border: "1px solid #091E4224",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  p: 3,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  component={"p"}
                  sx={{ fontSize: "18px", fontWeight: "600" }}
                >
                  {t("subjectThumbnail")}
                </Typography>
              </Box>
              <Divider />
              <Box
                sx={{
                  p: 3,
                  gap: 4,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "300px",
                  }}
                >
                  <img
                    className="m-10 w-72 h-72"
                    src={displayImage}
                    alt="subject"
                    onError={() => setImageError(true)}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              </Box>
              <Divider />
              <Box sx={{ p: 3, backgroundColor: "#FCFCFC" }}>
                <Typography component={"p"} sx={{ fontWeight: "600" }}>
                  {t("thisCourseIncludes")}
                </Typography>
                <div className="py-4 flex flex-col gap-4">
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/play-circle.png")}
                      alt="play"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.videos_hours}{" "}
                      {t("hoursOnDemandVideos")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/arrow-down.png")}
                      alt="downloads"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.resources_count}{" "}
                      {t("downloadableResources")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/book-icon.png")}
                      alt="forum"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.units_count}{" "}
                      {t("units")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/book-icon.png")}
                      alt="forum"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.lessons_count}{" "}
                      {t("lessons")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/book-icon.png")}
                      alt="forum"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.articles_count}{" "}
                      {t("article")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/message-question.png")}
                      alt="articals"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.quizes_count}{" "}
                      {t("quiz")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/game.png")}
                      alt="quizes"
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.games_count}{" "}
                      {t("game")}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      className="w-6 h-6"
                      src={require("../../assets/note-2.png")}
                      alt="work sheets "
                    />
                    <span className="text-gray">
                      {subjectOverviewState?.basic_info?.[0]?.work_sheets_count}{" "}
                      {t("workSheets")}
                    </span>
                  </div>
                </div>
              </Box>
            </Box>

            {activationSubjects && (
              <SubjectStatus
                onChange={async () => {
                  await dispatch(setSubjectStatus({ id: param.id }));
                  await dispatch(getSubjectDetails(param.id));
                }}
                value={subjectOverviewState?.basic_info?.[0]?.status}
              />
            )}
          </Grid>
          <Grid item xs={11} md={8}>
            <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  p: 2,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  component={"p"}
                  sx={{ fontSize: "18px", fontWeight: "600" }}
                >
                  {t("basicInfo")}
                </Typography>

                <Button
                  onClick={() => navigate(`/subjects/edit/${param.id}`)}
                  label={t("edit")}
                  type="bordered"
                />
              </Box>
              <Divider />
              <Box
                sx={{
                  p: 3,
                }}
              >
                <Typography
                  component={"p"}
                  sx={{ fontSize: "16px", fontWeight: "600", pb: 4 }}
                >
                  {i18n.language === "en"
                    ? subjectOverviewState?.basic_info?.[0]?.name_en
                    : subjectOverviewState?.basic_info?.[0]?.name_ar}
                </Typography>
                <Typography
                  component={"p"}
                  sx={{ fontSize: "16px", fontWeight: "600", pb: 1 }}
                >
                  {t("about")}
                </Typography>
                <Typography component={"p"} sx={{ color: "#8E9AA0", pb: 4 }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        i18n.language === "en"
                          ? subjectOverviewState?.basic_info?.[0]?.des_en
                          : subjectOverviewState?.basic_info?.[0]?.des_ar,
                    }}
                  />
                </Typography>
                {/* <Typography
                  component={"p"}
                  sx={{ fontSize: "16px", fontWeight: "600", pb: 1 }}
                >
                  How to pass
                </Typography> */}
                <Typography component={"p"} sx={{ color: "#8E9AA0", pb: 4 }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        i18n.language === "en"
                          ? subjectOverviewState?.basic_info?.[0]?.pass_en
                          : subjectOverviewState?.basic_info?.[0]?.pass_ar,
                    }}
                  />
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
                <Typography
                  component={"p"}
                  sx={{ fontSize: "18px", fontWeight: "600", m: 2 }}
                >
                  {t("syllabus")}
                </Typography>{" "}
                <Divider />
                <Box
                  sx={{
                    p: 3,
                  }}
                >
                  {subjectOverviewState?.units?.map((item: any) => {
                    const unitContent: any = [];
                    item?.lessons?.forEach((lesson: any) => {
                      if (lesson?.contents?.length) {
                        unitContent.push(...lesson?.contents);
                      }
                    });

                    return (
                      <Box
                        key={item.id}
                        sx={{
                          bgcolor: "#fff",
                          border: "1px solid #091E4224",
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            p: 3,
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            component={"p"}
                            sx={{ fontSize: "15px", fontWeight: "600" }}
                          >
                            {item?.name}
                          </Typography>
                          <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
                            {item?.lessons_count} {t("lessons")} -{" "}
                            {item?.quizes_count} {t("quiz")}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box
                          sx={{
                            p: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {!unitContent?.length && (
                            <div className="text-center">
                              {t("noContentToDisplay")}
                            </div>
                          )}
                          {unitContent?.map((item: any) => {
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  // Use setTimeout to ensure window.open is not blocked by file chooser
                                  // Increased delay to 300ms to ensure file chooser dialog is fully closed
                                  setTimeout(() => {
                                    const newWindow = window.open(
                                      `/subjects/scorm/${param?.id}/${item.id}`,
                                      "_blank"
                                    );
                                    // Fallback if popup is blocked - try again after a longer delay
                                    if (!newWindow) {
                                      setTimeout(() => {
                                        window.open(
                                          `/subjects/scorm/${param?.id}/${item.id}`,
                                          "_blank"
                                        );
                                      }, 200);
                                    }
                                  }, 300);
                                }}
                                className={`flex flex-row items-center justify-between cursor-pointer hover:bg-lightGreen p-2 rounded-md`}
                              >
                                <div className="flex flex-row items-center gap-2">
                                  {item?.type === "video" ? (
                                    <img
                                      src={require("../../assets/play-circle-gray.png")}
                                      alt="video"
                                    />
                                  ) : item?.type === "quiz" ? (
                                    <img
                                      src={require("../../assets/message-question-gray.png")}
                                      alt="quiz"
                                    />
                                  ) : (
                                    <img
                                      src={require("../../assets/book-gray.png")}
                                      alt="book"
                                    />
                                  )}
                                  <span className="text-gray">
                                    {item?.type}: {item?.name}
                                  </span>
                                </div>
                                <span className="text-gray">
                                  {item?.period}
                                </span>
                              </div>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LoadingWrapper>
  );
};

export default Overview;
