import { Box, Typography, Divider, TextField, Checkbox } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Button from "../shared/Button";
import Loading from "../shared/Loading";
type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
  isUploading: boolean;
};

const Upload = ({ formik, values, onChange, isUploading }: InfoProps) => {
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
    <>
      <Box>
        <div className="flex flex-col gap-0 mb-4 p-2">
          <label className="text-sm font-semibold mb-1">
            Title <span className="text-red">*</span>
          </label>
          <TextField
            margin="normal"
            required
            fullWidth
            placeholder="ex:(English)"
            size="small"
            id="gradeName"
            name="gradeName"
            sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
          />
        </div>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            gap: 3,
          }}
        >
          <div className="flex flex-col gap-0 p-2">
            <Box
              sx={{
                bgcolor: "#fff",
              }}
            >
              <Box
                sx={{
                  gap: 4,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    alignItems: "center",
                    px: 3,
                    py: 6,
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
                          <p className="font-semibold text-md pt-3">
                            Document Selected
                          </p>
                          <p className="text-sm text-gray-600 py-1 break-all px-4 text-center">
                            {fileName}
                          </p>
                        </>
                      )}
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
                        id="file"
                        name="file"
                        accept="audio/*, video/*, image/*, .zip/*,application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,"
                        onChange={(event: any) => {
                          handleImageChange(event);
                        }}
                      />
                    </div>
                  )}
                </Box>
                <p className="p-2 text-xs text-gray">
                  Upload your course image here. It must meet our course image
                  quality standards to be accepted. Important guidelines:
                  750x422 pixels; .jpg, .jpeg,. gif, or .png. no text on the
                  image.
                </p>
              </Box>
            </Box>
            <Divider />
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "right",
              }}
            >
              <Button label="Discard" type="bordered" className="w-30 m-3" />
              <Button label="Submit" className="w-30 m-3" />
            </Box>
          </div>
        </Box>
      </Box>
    </>
  );
};

export default Upload;
