import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import "react-quill/dist/quill.snow.css"; // Import the styles
import "react-datepicker/dist/react-datepicker.css";
import TextEditor from "../shared/TextEditor";
import Button from "../shared/Button";
import Loading from "../shared/Loading";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const BasicInfo = ({
  formik,
  values,
  onChange,
  isUploading,
  initialValues,
}: any) => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string>("");
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    
    // Validate file type - only accept PDF and images
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isImage && !isPDF) {
      alert('Please select a PDF or image file');
      if (imageRef.current) {
        imageRef.current.value = "";
      }
      return;
    }

    setFileName(file.name);
    
    // Set file type and preview
    if (isImage) {
      setFileType("image");
      // Revoke previous preview URL if exists
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } else {
      setFileType("pdf");
      // Clear image preview for PDF
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setFilePreview("");
    }
    
    formik.setValues({
      ...formik.values,
      file: file,
    });
  };

  // Clean up object URL on unmount or when filePreview changes
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Basic information
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
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Wroksheet name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_en"
              onChange={onChange}
              value={values.name_en}
              name="name_en"
              placeholder="ُEnter your worksheet name ..."
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-10">
            <label className="text-sm font-semibold mb-1">
              Description (English)
            </label>

            <TextEditor
              id="des_en"
              name="des_en"
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.des_en}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Worksheet name [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_ar"
              onChange={onChange}
              value={values.name_ar}
              name="name_ar"
              placeholder="أدخل أسم ورقة العمل  ..."
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-10">
            <label className="text-sm font-semibold mb-1">
              Description (Arabic)
            </label>

            <TextEditor
              id={"des_ar"}
              name="des_ar"
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.des_ar}
            />
          </div>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          p: 3,
        }}
      >
        <Typography
          component={"p"}
          sx={{ fontSize: "18px", fontWeight: "600", mb: 2 }}
        >
          Upload worksheet
        </Typography>
        <Box
          sx={{
            bgcolor: "#fff",
            border: "1px solid #091E4224",
            borderRadius: "4px",
          }}
        >
          <Box
            sx={{
              p: 3,
            }}
          >
            <input
              style={{ display: "none" }}
              ref={imageRef}
              type="file"
              id="file"
              name="file"
              accept=".pdf,image/*,application/pdf"
              onChange={(event: any) => {
                handleImageChange(event);
              }}
            />
            <Box
              sx={{
                display: "flex",
                p: 6,
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                border: "1px dashed #091E4224",
                borderRadius: "20px",
                cursor: "pointer",
                minHeight: "200px",
              }}
              onClick={() => {
                imageRef?.current?.click();
              }}
            >
              {fileName ? (
                <>
                  {isUploading ? (
                    <>
                      <Loading />
                      <p className="font-semibold text-md pt-3">
                        Uploading files ...
                      </p>
                    </>
                  ) : (
                    <>
                      {fileType === "image" && filePreview ? (
                        <img
                          src={filePreview}
                          alt="preview"
                          className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200 mb-3"
                        />
                      ) : (
                        <img
                          className="w-16 h-16"
                          src={require("../../assets/Documenticon.png")}
                          alt="document"
                        />
                      )}
                      <p className="font-semibold text-md py-3">
                        {fileType === "image" ? "Image Selected" : "PDF Selected"}
                      </p>
                      <p className="text-sm text-gray-600 py-1 break-all px-4 text-center max-w-md">
                        {fileName}
                      </p>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          label="Discard"
                          type="bordered"
                          onClick={() => {
                            // Revoke preview URL if exists
                            if (filePreview) {
                              URL.revokeObjectURL(filePreview);
                            }
                            formik.setValues({
                              ...formik.values,
                              file: null,
                            });
                            setFileName("");
                            setFilePreview("");
                            setFileType(null);
                            // Reset input value to allow selecting the same file again
                            if (imageRef.current) {
                              imageRef.current.value = "";
                            }
                          }}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-3 justify-center items-center">
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
                </div>
              )}
            </Box>
            <p className="p-2 text-xs text-gray mt-2">
              Upload your worksheet file here. Supported formats: PDF, Images (.jpg, .jpeg, .png, .gif)
            </p>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
