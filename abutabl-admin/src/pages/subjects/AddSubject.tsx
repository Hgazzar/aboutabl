import { Box, Divider, Grid, Typography } from "@mui/material";
import React, { useCallback, useRef, useState, useEffect } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SubjectStatus from "../../components/shared/SubjectStatus";
import BasicInfo from "../../components/addSubject/BasicInfo";
import { useNavigate } from "react-router-dom";
import { addSubject } from "../../redux/reducers/subjectsReducer";
import { useDispatch } from "react-redux";
import Dropzone, { useDropzone } from "react-dropzone";
import SubjectLang from "@/components/shared/SubjectLang";

type Props = {};

const AddSubject = (props: Props) => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const formik: any = useFormik({
    initialValues: {
      photo: null,
      name_en: "",
      name_ar: "",
      des_en: "",
      des_ar: "",
      pass_en: "",
      pass_ar: "",
      lang: "en",
      status: true,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ----------- functions --------------
  const handleImageChange: any = function (
    e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | FileList | null } }
  ) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    if (!file) return;

    // Convert file to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setdisplayImages(base64String);
      // Store the original File object for submission
      formik.setValues({
        ...formik.values,
        photo: file,
      });
    };
    reader.onerror = () => {
      console.error("Error reading file");
    };
    reader.readAsDataURL(file);
  };

  const [loading, setLoading] = useState(false);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        // Create a FileList-like object for handleImageChange
        const dataTransfer = new DataTransfer();
        acceptedFiles.forEach((file) => dataTransfer.items.add(file));
        handleImageChange({ target: { files: dataTransfer.files } });
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">Add new Subject</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Typography
              onClick={() => {
                navigate(-1);
              }}
              component={"p"}
              sx={{
                color: "#1EBBA3",
                fontWeight: "400",
                mx: 4,
                cursor: "pointer",
              }}
            >
              Cancel
            </Typography>
            <Button
              onClick={async () => {
                try {
                  setLoading(true);
                  await dispatch(
                    addSubject({
                      ...formik.values,
                      status: formik.values.status === true ? 1 : 0,
                      lang: formik.values.lang === true ? "en" : "ar",
                    })
                  ).unwrap();
                  navigate("/subjects/list");
                  setLoading(false);
                } catch (error: any) {
                  setLoading(false);
                  console.log(error);
                }
              }}
              label="Submit"
              className="w-30 m-3"
              disabled={loading}
            />
          </Box>
        </Box>
      </Box>

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
                Subject thumbnail <span className="text-red">*</span>
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
                  <div className="image-uploader">
                    {displayImages ? (
                      <>
                        <div className="image-container">
                          <img
                            width={300}
                            height={300}
                            src={displayImages}
                            alt="logo"
                          />
                          <div className="edit-overlay">
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
                            id="logo-edit"
                            name="logo"
                            accept="image/*"
                            onChange={(event) => {
                              handleImageChange(event);
                            }}
                          />
                        </div>
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
                          ref={imageRef}
                          type="file"
                          id="logo"
                          name="logo"
                          accept="image/*"
                        />
                      </div>
                      // <div className="flex flex-col gap-3 justify-center items-center cursor-pointer">
                      //   <div className="w-16 h-16 flex justify-center items-center bg-veryLightprimary rounded-full">
                      //     <UploadFileRoundedIcon
                      //       style={{
                      //         fontSize: "30px",
                      //         color: "#1EBBA3",
                      //       }}
                      //     />
                      //   </div>
                      //   <p className="font-semibold text-md">
                      //     Drag & Drop file here
                      //   </p>
                      //   <p className="text-gray text-sm">
                      //     or click to browse (4mb max)
                      //   </p>
                      //   <input
                      //     style={{ display: "none" }}
                      //     ref={imageRef}
                      //     type="file"
                      //     id="logo"
                      //     name="logo"
                      //     accept="image/*"
                      //     onChange={(event: any) => {
                      //       handleImageChange(event);
                      //     }}
                      //   />
                      // </div>
                    )}
                  </div>
                  {/* {displayImages?.length ? (
                    <>
                      <img
                        width={100}
                        height={100}
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
                  )} */}
                </Box>
                <p className="p-2 text-xs text-gray">
                  Upload your course image here. It must meet our course image
                  quality standards to be accepted. Important guidelines:
                  750x422 pixels; .jpg, .jpeg,. gif, or .png. no text on the
                  image.
                </p>
              </Box>
            </Box>

            <SubjectLang formik={formik} />
            <SubjectStatus formik={formik} />
          </Grid>
          <Grid item md={8} spacing={2} gap={2}>
            <BasicInfo formik={formik} />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default AddSubject;
