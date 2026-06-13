import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import { setupScormAPIHandler } from "@/utils/scormProxy";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  height: "90%",
  overflowY: "auto",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const DisplayContent = ({ open, onClose, content }: any) => {
  // ----------- hooks ------------
  const [data, setData] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [contentType, setContentType] = useState<string>("");
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);

  // Set up SCORM API handler once when component mounts
  useEffect(() => {
    setupScormAPIHandler();
  }, []);

  // Reset error and loading state when data changes
  useEffect(() => {
    if (data) {
      setIframeError(null);
      setIframeLoading(true);
    }
  }, [data]);

  return (
    <>
      <Modal open={open}>
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1F1E1E",
              mb: 2,
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Content
            </Typography>

            <span
              className="cursor-pointer"
              onClick={() => {
                setActiveId("");
                setData(null);
                onClose();
              }}
            >
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Grid container sx={{ m: 3 }} gap={3}>
            <Grid
              item
              xs={11}
              md={3.5}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <Box
                sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}
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
                    File{" "}
                  </Typography>
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    p: 2,
                    px: 4,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    component={"p"}
                    sx={{ fontSize: "12px", fontWeight: "600" }}
                  >
                    File name{" "}
                  </Typography>
                  <Typography
                    component={"p"}
                    sx={{ fontSize: "12px", fontWeight: "600" }}
                  >
                    Type{" "}
                  </Typography>
                </Box>
                <Divider />

                <div className={"flex flex-col"}>
                  {content?.map((item: any) => {
                    return (
                      <div
                        onClick={() => {
                          const type = item?.type || "";
                          setIsVideo(type === "video");
                          setContentType(type);
                          setActiveId(item?.id);
                          setData(item?.path);
                        }}
                        className={`flex cursor-pointer flex-row items-center justify-between gap-3 hover:bg-lightGreen border-l-white border-l-4 hover:border-green p-6 ${
                          activeId === item?.id
                            ? "bg-lightGreen border-l-green border-l-4"
                            : ""
                        }`}
                      >
                        <div>{item?.name_en}</div>
                        <div>{item?.type}</div>
                      </div>
                    );
                  })}
                </div>
              </Box>
            </Grid>
            <Grid
              item
              xs={11}
              md={6}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              {!data ? (
                <div className="bg-black h-96"></div>
              ) : (
                <>
                  {isVideo ? (
                    <video src={data} controls className="w-full h-full"></video>
                  ) : contentType === "pdf" ? (
                    <>
                      {iframeError ? (
                        <div className="flex flex-col items-center justify-center h-96 p-8">
                          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                            Failed to load PDF
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {iframeError}
                          </Typography>
                          <button
                            onClick={() => {
                              setIframeError(null);
                              setIframeLoading(true);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-green"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <embed
                          src={`${data}#toolbar=1&navpanes=1&scrollbar=1`}
                          type="application/pdf"
                          className="w-full h-full"
                          style={{ minHeight: '500px' }}
                          onLoad={() => setIframeLoading(false)}
                          onError={() => {
                            setIframeError("Unable to load the PDF file. Please check if the file URL is accessible.");
                            setIframeLoading(false);
                          }}
                        />
                      )}
                    </>
                  ) : iframeError ? (
                    <div className="flex flex-col items-center justify-center h-96 p-8">
                      <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                        Failed to load content
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {iframeError}
                      </Typography>
                      <button
                        onClick={() => {
                          setIframeError(null);
                          setIframeLoading(true);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-green"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <iframe
                      title="Content Viewer"
                      src={data}
                      className="w-full h-full"
                      height={"100%"}
                      width={"100%"}
                      allow="autoplay; fullscreen; microphone; camera"
                      allowFullScreen
                      onLoad={() => setIframeLoading(false)}
                      onError={() => {
                        setIframeError("Unable to load the content. Please check if the file URL is accessible.");
                        setIframeLoading(false);
                      }}
                    />
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default DisplayContent;
