import { Box, Checkbox, Divider, Grid, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import AccountStatus from "../shared/AccountStatus";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "../shared/Button";
import AddedQuestion from "./AddedQuestion";

const Upload = ({ formik }: any) => {
  // ------------ hooks ---------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [fileName, setFileName] = useState("");

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    let display = URL.createObjectURL(fileList[0]);
    setdisplayImages(display);
    setFileName(fileList[0].name);
    formik.setValues({
      ...formik.values,
      logo: fileList[0],
    });
  };

  useEffect(() => {
    setdisplayImages(formik?.values?.logo);
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Box>
        <Box
          sx={{
            marginBottom: 4,
            bgcolor: "#fff",
            border: "1px solid #091E4224",
          }}
        >
          <Typography
            component={"p"}
            sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
          >
            Upload SCORM
          </Typography>{" "}
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
                p: 6,
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",

                border: "1px dashed #091E4224",
                borderRadius: "20px",
              }}
              onClick={() => {
                imageRef?.current?.click();
              }}
            >
              {displayImages?.length ? (
                <>
                  <img width={300} height={300} src={displayImages} alt="logo" />
                  <p className="text-sm text-gray-600 py-2 break-all px-4 text-center">
                    {fileName}
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-3 justify-center items-center cursor-pointer">
                  <div className="w-16 h-16 rounded-full flex justify-center items-center bg-veryLightprimary rounded-full">
                    <UploadFileRoundedIcon
                      style={{
                        fontSize: "30px",
                        color: "#1EBBA3",
                      }}
                    />
                    <input
                      style={{ display: "none" }}
                      ref={imageRef}
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={(event: any) => {
                        handleImageChange(event);
                      }}
                    />
                  </div>
                  <p className="font-semibold text-md">Drag & Drop file here</p>
                  <p className="text-gray text-sm">
                    or click to browse (4mb max)
                  </p>
                  <input
                    style={{ display: "none" }}
                    ref={imageRef}
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/*"
                    onChange={(event: any) => {
                      handleImageChange(event);
                    }}
                  />
                </div>
              )}
            </Box>
            <p className="p-2 text-xs text-gray">
              some data format such dates, numbers and colors may not be
              recognised.
            </p>
          </Box>
        </Box>
      </Box>
      <AddedQuestion />
    </Box>
  );
};

export default Upload;
