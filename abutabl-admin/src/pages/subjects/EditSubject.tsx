import { Box, Divider, Grid, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SubjectStatus from "../../components/shared/SubjectStatus";
import BasicInfo from "../../components/addSubject/BasicInfo";
import { useNavigate, useParams } from "react-router-dom";
import {
  editSubject,
  getSubjectDetails,
} from "../../redux/reducers/subjectsReducer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Dropzone, { useDropzone } from "react-dropzone";
import SubjectLang from "@/components/shared/SubjectLang";

type Props = {};

const EditSubject = (props: Props) => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [fileName, setFileName] = useState("");
  const [initialValues, setInitialValues] = useState<any>({});
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
  const param = useParams();

  // ----------- functions --------------
  const handleImageChange: any = function (
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const fileList = e.target.files;
    if (!fileList) return;

    // Set file name
    setFileName(fileList[0].name);

    // Convert image to base64 for preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setdisplayImages(base64String);
    };
    reader.readAsDataURL(fileList[0]);

    formik.setValues({
      ...formik.values,
      photo: fileList[0],
    });
  };

  //   ----------- side effect --------------
  useEffect(() => {
    if (typeof formik.values.photo === "string") {
      // If photo is already a string (base64 or URL), use it directly
      if (formik.values.photo.length > 0) {
        setdisplayImages(formik.values.photo);
        // Clear fileName for existing URLs (not new file uploads)
        if (!formik.values.photo.startsWith("data:")) {
          setFileName("");
        }
      } else {
        setdisplayImages("");
        setFileName("");
      }
    } else if (
      formik.values.photo instanceof Blob ||
      formik.values.photo instanceof File
    ) {
      // If photo is a Blob or File, convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setdisplayImages(reader.result as string);
      };
      reader.readAsDataURL(formik.values.photo);
      // Set fileName if it's a File object
      if (formik.values.photo instanceof File) {
        setFileName(formik.values.photo.name);
      }
    } else {
      setdisplayImages("");
      setFileName("");
    }
  }, [formik?.values?.photo]);

  useEffect(() => {
    dispatch(getSubjectDetails(param.id))
      .unwrap()
      .then((result: any) => {
        const basicInfo = result?.basic_info[0] || {};
        // Convert lang string to boolean for SwitchBox component
        // "en" = true, "ar" = false
        const formValues = {
          ...basicInfo,
          lang: basicInfo.lang === "en" ? true : basicInfo.lang === "ar" ? false : true,
        };
        formik.setValues(formValues);
        setInitialValues(basicInfo);
      });
  }, []);
  const [loading, setLoading] = useState(false);
  const onDrop = useCallback(
    (acceptedFiles: any) => {
      handleImageChange({ target: { files: acceptedFiles } });
    },
    [handleImageChange]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
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
        <Typography variant="h5">Edit Subject</Typography>{" "}
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
                    editSubject({
                      data: {
                        ...formik.values,
                        status: formik?.values?.status ? 1 : 0,
                        lang: formik.values.lang === true ? "en" : "ar",
                        photo:
                          typeof formik.values.photo === "string"
                            ? null
                            : formik.values.photo,
                      },
                      id: param.id,
                    })
                  ).unwrap();
                  navigate(-1);
                  setLoading(false);
                } catch (error: any) {
                  setLoading(false);
                  console.log(error);
                }
              }}
              disabled={loading}
              label="Save"
              className="w-30 m-3"
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
                Subject thumbnail
              </Typography>{" "}
              <Divider />
              <Box
                sx={{
                  p: 3,
                  gap: 4,
                }}
                onClick={() => {
                  // Only trigger when there's no preview (for initial upload)
                  if (!displayImages?.length && imageRef?.current) {
                    imageRef.current.value = '';
                    imageRef.current.click();
                  }
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
                >
                  <div className="image-uploader">
                    {displayImages?.length ? (
                      <>
                        <div 
                          className="image-container"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          {...getInputProps()}
                          style={{ display: "none" }}
                          type="file"
                          id="logo-dropzone"
                          name="logo"
                          accept="image/*"
                          onChange={(event) => {
                            // Fallback handler for direct file input
                            if (event.target.files && event.target.files.length > 0) {
                              handleImageChange(event);
                            }
                          }}
                        />
                      </div>
                      // <Dropzone onDrop={handleImageChange}>
                      //   {({ getRootProps, getInputProps }) => (
                      //     <div className="flex flex-col gap-3 justify-center items-center cursor-pointer">
                      //       <div className="w-16 h-16 rounded-full flex justify-center items-center bg-veryLightprimary rounded-full">
                      //         <UploadFileRoundedIcon
                      //           style={{
                      //             fontSize: "30px",
                      //             color: "#1EBBA3",
                      //           }}
                      //         />
                      //       </div>
                      //       <p className="font-semibold text-md">
                      //         Drag & Drop file here
                      //       </p>
                      //       <p className="text-gray text-sm">
                      //         or click to browse (4mb max)
                      //       </p>
                      //       <input
                      //         style={{ display: "none" }}
                      //         ref={imageRef}
                      //         type="file"
                      //         id="logo"
                      //         name="logo"
                      //         accept="image/*"
                      //         onChange={(event) => {
                      //           handleImageChange(event);
                      //         }}
                      //       />
                      //     </div>
                      //   )}
                      // </Dropzone>
                    )}
                  </div>
                  {/* {displayImages?.length ? (
                    <div>
                      <img
                        width={300}
                        height={300}
                        src={displayImages}
                        alt="logo"
                        className="cursor-pointer"
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
          <Grid item md={8}>
            <BasicInfo formik={formik} initialValues={initialValues} />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default EditSubject;
