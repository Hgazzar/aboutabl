import { Box, Divider, Grid, IconButton, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AccountStatus from "../shared/AccountStatus";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import BasicInfo from "./BasicInfo";
import Dropzone, { useDropzone } from "react-dropzone";
import "./overlay.css";

const OverviewList = ({ formik }: any) => {
  // ------------ hooks ---------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [fileName, setFileName] = useState("");

  // ----------- functions --------------
  const handleImageChange: any = function (
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const fileList = e.target.files;
    if (!fileList) return;

    setFileName(fileList[0].name);
    
    // Convert image to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setdisplayImages(base64String);
    };
    reader.readAsDataURL(fileList[0]);
    
    formik.setValues({
      ...formik.values,
      logo: fileList[0],
    });
  };

  useEffect(() => {
    if (typeof formik.values.logo === "string") {
      // If logo is already a string, use it directly
      setdisplayImages(formik.values.logo);
    } else if (
      formik.values.logo instanceof Blob ||
      formik.values.logo instanceof File
    ) {
      // If logo is a Blob or File, convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setdisplayImages(reader.result as string);
      };
      reader.readAsDataURL(formik.values.logo);
    } else {
      setdisplayImages("");
    }
  }, [formik?.values?.logo]);
  
  const onDrop = useCallback(
    (acceptedFiles: any) => {
      handleImageChange({ target: { files: acceptedFiles } });
    },
    [handleImageChange]
  );
  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    noClick: false // Allow dropzone to handle clicks for drag-and-drop area
  });
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} gap={2}>
        <Grid item md={3.5}>
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
              Upload School logo
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
                  // Only trigger when there's no preview (initial upload)
                  // When there's a preview, the image-container handles clicks
                  if (!displayImages?.length && imageRef?.current) {
                    imageRef.current.value = '';
                    imageRef.current.click();
                  }
                }}
              >
                <div className="image-uploader">
                  {displayImages?.length ? (
                    <>
                      <div 
                        className="image-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Reset input value to allow selecting the same file again
                          if (imageRef?.current) {
                            imageRef.current.value = '';
                            imageRef.current.click();
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          width={300}
                          height={300}
                          src={displayImages}
                          alt="logo"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (imageRef?.current) {
                              imageRef.current.value = '';
                              imageRef.current.click();
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <div 
                          className="edit-overlay"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (imageRef?.current) {
                              imageRef.current.value = '';
                              imageRef.current.click();
                            }
                          }}
                        >
                          <svg
                            className="feather feather-edit"
                            fill="none"
                            height="24"
                            stroke="#fff"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          {/* <IconButton style={{ fontSize: "30px", color: "#FFFFFF" }} /> */}
                        </div>
                        <input
                          style={{ display: "none" }}
                          ref={imageRef}
                          type="file"
                          id="logo"
                          name="logo"
                          accept="image/*"
                          onChange={(event) => {
                            handleImageChange(event);
                          }}
                        />
                      </div>
                      {fileName && (
                        <p className="text-sm text-gray-600 py-2 break-all px-4 text-center">
                          {fileName}
                        </p>
                      )}
                    </>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="flex flex-col gap-3 justify-center items-center cursor-pointer"
                    >
                      <div className="w-16 h-16 flex justify-center items-center bg-veryLightprimary rounded-full">
                        <UploadFileRoundedIcon
                          style={{
                            fontSize: "30px",
                            color: "#1EBBA3",
                          }}
                        />
                      </div>
                      <p className="font-semibold text-md">
                        Drag & Drop file here
                      </p>
                      <p className="text-gray text-sm">
                        or click to browse (4mb max)
                      </p>
                      <input 
                        {...getInputProps()} 
                        onChange={(event) => {
                          // Handle direct file input change (when clicking, not dragging)
                          if (event.target.files && event.target.files.length > 0) {
                            handleImageChange(event);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* {displayImages?.length ? (
                  <>
                    <img
                      width={300}
                      height={300}
                      src={displayImages}
                      alt="logo"
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
                  </>
                ) : (
                  <Dropzone onDrop={handleImageChange}>
                    {({ getRootProps, getInputProps }) => (
                      <div className="flex flex-col gap-3 justify-center items-center cursor-pointer">
                        <div className="w-16 h-16 rounded-full flex justify-center items-center bg-veryLightprimary rounded-full">
                          <UploadFileRoundedIcon
                            style={{
                              fontSize: "30px",
                              color: "#1EBBA3",
                            }}
                          />
                        </div>
                        <p className="font-semibold text-md">
                          Drag & Drop file here
                        </p>
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
                  </Dropzone>
                )} */}
              </Box>
              <p className="p-2 text-xs text-gray">
                some data format such dates, numbers and colors may not be
                recognised.
              </p>
            </Box>
          </Box>

          <AccountStatus formik={formik} value={formik.values.status} />
        </Grid>
        <Grid item md={8}>
          <BasicInfo formik={formik} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewList;
