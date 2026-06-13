import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css"; // Import the styles
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
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
      file: fileList[0],
    });
  };

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
              Game name [English] <span className="text-red">*</span>
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
              placeholder="ex (Subtraction exersice)"
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
              Game name [Arabic] <span className="text-red">*</span>
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
              placeholder="ex (Subtraction exersice)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-10">
            <label className="text-sm font-semibold mb-1">
              Description (Arabic)
            </label>

            <TextEditor
              id={"des_ar"}
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
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <div className="flex flex-col gap-0 mb-10">
          <label className="text-sm font-semibold mb-1"> Upload Game</label>
          <Box
            sx={{
              marginBottom: 4,
              bgcolor: "#fff",
            }}
          >
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
                    {isUploading ? (
                      <>
                        <Loading />

                        <p className="font-semibold text-md pt-3">
                          Uploading files ...
                        </p>
                      </>
                    ) : (
                      <>
                        <img
                          className="w-16 h-16"
                          src={require("../../assets/Documenticon.png")}
                          alt="bookmark"
                        />
                        <p className="font-semibold text-md py-3">
                          Document Selected
                        </p>
                        <p className="text-sm text-gray-600 py-1 break-all px-4 text-center">
                          {fileName}
                        </p>
                        <Button
                          label="Discard"
                          type="bordered"
                          onClick={() => {
                            formik.setValues({
                              ...formik.values,
                              file: null,
                            });
                            setdisplayImages("");
                            setFileName("");
                          }}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-3 justify-center items-center cursor-pointer ">
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
                      key={"file"}
                      accept="*/*"
                      onChange={(event: any) => {
                        handleImageChange(event);
                      }}
                    />
                  </div>
                )}
              </Box>
              <p className="p-2 text-xs text-gray mx-48">
                Upload your game here .Accepted file types are. SCORM and HTML
                files
              </p>
            </Box>
          </Box>
        </div>
      </Box>
    </Box>
  );
};

export default BasicInfo;
