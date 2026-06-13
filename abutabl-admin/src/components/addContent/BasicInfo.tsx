import { Box, Typography, Divider, TextField, ToggleButtonGroup, ToggleButton } from "@mui/material";
import React, { useCallback, useRef, useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TextEditor from "../shared/TextEditor";
import "react-quill/dist/quill.snow.css"; // Import the styles
import Loading from "../shared/Loading";
import { notify } from "@/utils/notify";
import Button from "../shared/Button";
import SelectBox from "../shared/SelectBox";
import { useDropzone } from "react-dropzone";
import { getRequest } from "@/utils/fetchMethods";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const MAX_UPLOAD_SIZE = 5000; // 20 MB in bytes

type ScormDirItem = { name: string; relative_path: string; has_entry: boolean };

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
  const [ddlCurrentPath, setDdlCurrentPath] = useState("");
  const [ddlDirectories, setDdlDirectories] = useState<ScormDirItem[]>([]);
  const [ddlParentPath, setDdlParentPath] = useState<string | null>(null);
  const [loadingDirs, setLoadingDirs] = useState(false);

  const source = values.source ?? "upload";
  const isDdl = source === "ddl";

  useEffect(() => {
    if (!isDdl) return;
    setLoadingDirs(true);
    getRequest({ path: ddlCurrentPath }, "/api/contents/scorm-directories")
      .then((res: any) => {
        if (res?.data) {
          setDdlDirectories(res.data.directories || []);
          setDdlParentPath(res.data.parent_path ?? null);
        }
      })
      .catch(() => {
        setDdlDirectories([]);
        setDdlParentPath(null);
      })
      .finally(() => setLoadingDirs(false));
  }, [isDdl, ddlCurrentPath]);

  // Helper function to determine file type from file extension
  const getFileTypeFromExtension = (fileName: string): string => {
    if (!fileName) return "";
    
    const extension = fileName.split('.').pop()?.toLowerCase() || "";
    
    const typeMap: { [key: string]: string } = {
      // Video
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'wmv': 'video',
      'flv': 'video',
      'webm': 'video',
      'mkv': 'video',
      'm4v': 'video',
      '3gp': 'video',
      // Word
      'doc': 'word',
      'docx': 'word',
      // PowerPoint
      'ppt': 'powerpoints',
      'pptx': 'powerpoints',
      // Excel
      'xls': 'excel',
      'xlsx': 'excel',
      // Image
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      // Audio
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      // PDF
      'pdf': 'pdf',
      // SCORM
      'zip': 'scorm',
    };
    
    return typeMap[extension] || "";
  };

  // ----------- functions --------------
  const handleImageChange: any = function (
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const fileList: any = e.target.files;
    if (!fileList) return;

    const fileSizeLimit = MAX_UPLOAD_SIZE * 1024 * 1024;

    if (fileList[0].size > fileSizeLimit) {
      notify(
        "File size exceeds the limit of MAX_UPLOAD_SIZE MB. Please choose a smaller file.",
        "error"
      );
      return;
    }

    let display = URL.createObjectURL(fileList[0]);
    setdisplayImages(display);
    setFileName(fileList[0].name);
    
    // Automatically determine and set file type
    const fileType = getFileTypeFromExtension(fileList[0].name);
    
    formik.setValues({
      ...formik.values,
      file: fileList[0],
      type: fileType || formik.values.type, // Keep existing type if can't determine
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: any) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileSizeLimit = MAX_UPLOAD_SIZE * 1024 * 1024;

        if (file.size > fileSizeLimit) {
          notify(
            "File size exceeds the limit of MAX_UPLOAD_SIZE MB. Please choose a smaller file.",
            "error"
          );
          return;
        }

        let display = URL.createObjectURL(file);
        setdisplayImages(display);
        setFileName(file.name);
        
        // Automatically determine and set file type
        const fileType = getFileTypeFromExtension(file.name);
        
        formik.setValues({
          ...formik.values,
          file: file,
          type: fileType || formik.values.type, // Keep existing type if can't determine
        });
      }
    },
    [formik]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
              Content name [English] <span className="text-red">*</span>
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
          <div className="flex flex-col gap-0">
            <label className="text-sm font-semibold mb-1">
              About (English)
            </label>
            <TextEditor
              id={"about_en"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.about_en}
            />
          </div>
          {/* <div className="flex flex-col gap-0 mt-14">
            <label className="text-sm font-semibold mb-1">
              Content type <span className="text-red">*</span>
            </label>
            <SelectBox
              styles={{ width: "100%" }}
              id={"type"}
              name={"type"}
              values={[
                {
                  label: "Scorm",
                  value: "scorm",
                },
                {
                  label: "Audio",
                  value: "audio",
                },
                {
                  label: "Video",
                  value: "video",
                },
                {
                  label: "Image",
                  value: "image",
                },
                {
                  label: "Word",
                  value: "word",
                },
                {
                  label: "Powerpoints",
                  value: "powerpoints",
                },
                {
                  label: "Excel",
                  value: "excel",
                },
                {
                  label: "PDF",
                  value: "pdf",
                },
              ]}
              value={values.type}
              onChange={onChange}
            />
          </div> */}
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Content name [Arabic] <span className="text-red">*</span>
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
          <div className="flex flex-col gap-0 ">
            <label className="text-sm font-semibold mb-1">About (Arabic)</label>
            <TextEditor
              id={"about_ar"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.about_ar}
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
          mt: 5,
        }}
      >
        <div className="flex flex-col gap-0 mb-10">
          <label className="text-sm font-semibold mb-1">
            Add SCORM content <span className="text-red">*</span>
          </label>

          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={source}
              exclusive
              onChange={(_, newSource) => {
                if (newSource == null) return;
                formik.setValues({
                  ...formik.values,
                  source: newSource,
                  ...(newSource === "ddl" ? { file: null, type: "scorm", scorm_directory: null } : { scorm_directory: null }),
                });
                if (newSource === "ddl") {
                  setdisplayImages("");
                  setFileName("");
                } else {
                  setDdlCurrentPath("");
                }
              }}
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", px: 2 } }}
            >
              <ToggleButton value="upload" aria-label="Upload file">
                <UploadFileRoundedIcon sx={{ mr: 1, fontSize: 20 }} />
                Upload SCORM file
              </ToggleButton>
              <ToggleButton value="ddl" aria-label="Choose from DDL">
                <FolderOpenIcon sx={{ mr: 1, fontSize: 20 }} />
                Choose from DDL
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {isDdl ? (
            <Box
              sx={{
                border: "1px solid #091E4224",
                borderRadius: "12px",
                p: 2,
                minHeight: 200,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                DDL directory: storage/app/public/scorms/
                {ddlCurrentPath ? ` ${ddlCurrentPath}` : " (root)"}
              </Typography>
              {ddlParentPath !== null && (
                <Button
                  type="bordered"
                  label="↑ Up"
                  onClick={() => setDdlCurrentPath(ddlParentPath)}
                  className="mb-2"
                />
              )}
              {loadingDirs ? (
                <Loading />
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {ddlDirectories.length === 0 && !loadingDirs && (
                    <Typography variant="body2" color="text.secondary">
                      No subdirectories here. Select a folder that contains index.html, index_lms.html, or story.html.
                    </Typography>
                  )}
                  {ddlDirectories.map((dir) => (
                    <Box
                      key={dir.relative_path}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", cursor: "pointer", flex: 1 }}
                        onClick={() => setDdlCurrentPath(dir.relative_path)}
                      >
                        <ChevronRightIcon fontSize="small" />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {dir.name}
                        </Typography>
                        {dir.has_entry && (
                          <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                            (has entry file)
                          </Typography>
                        )}
                      </Box>
                      {dir.has_entry && (
                        <Button
                          type="bordered"
                          label="Select this folder"
                          onClick={() => {
                            formik.setValues({
                              ...formik.values,
                              type: "scorm",
                              scorm_directory: dir.relative_path,
                            });
                            notify(`Selected: ${dir.relative_path}`, "success");
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {values.scorm_directory && (
                <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
                  Selected: {values.scorm_directory}
                </Typography>
              )}
            </Box>
          ) : (
          <Box
            sx={{
              pt: 1,
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
                  <p className="font-semibold text-md">Drag & Drop file here</p>
                  <p className="text-gray text-sm">
                    or click to browse
                     {/* ({MAX_UPLOAD_SIZE}mb max) */}
                  </p>
                  <input
                    {...getInputProps()}
                    style={{ display: "none" }}
                    ref={imageRef}
                    type="file"
                    id="logo"
                    name="logo"
                    accept="*/*"
                    onChange={(event) => {
                      handleImageChange(event);
                    }}
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
                //   <p className="font-semibold text-md">Drag & Drop file here</p>
                //   <p className="text-gray text-sm">
                //     or click to browse ({MAX_UPLOAD_SIZE}mb max)
                //   </p>
                //   <input
                //     style={{ display: "none" }}
                //     ref={imageRef}
                //     type="file"
                //     id="logo"
                //     name="logo"
                //     accept="*/*"
                //     // accept="audio/*, video/*, image/*,.zip/*,application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
                //     onChange={(event: any) => {
                //       handleImageChange(event);
                //     }}
                //   />
                // </div>
              )}
            </Box>
            <p className="p-2 text-xs text-gray">
              Upload your course image here. It must meet our course image
              quality standards to be accepted. Important guidelines: 750x422
              pixels; .jpg, .jpeg,. gif, or .png. no text on the image.
            </p>
          </Box>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default BasicInfo;
