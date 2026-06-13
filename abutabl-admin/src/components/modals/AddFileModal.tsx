import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import Button from "../shared/Button";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectBoxOptions } from "../../utils/functions";
import { getCommonSchoolList } from "../../redux/reducers/commonReducer";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Loading from "../shared/Loading";
import {
  addFile,
  getFilesList,
} from "../../redux/reducers/fileManagementReducer";
import { notify } from "@/utils/notify";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 500,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const AddFileModal = ({ open, onClose }: any) => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState([]);
  const [files, setFiles] = useState<any>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const dispatch = useDispatch();

  const [newSchool, setNewSchool] = useState<any>(null);
  // ----------- functions --------------
  const handleImageChange = function (e: any) {
    const fileList: any = Object.values(e.target.files);

    if (!fileList) return;

    let display = fileList?.map((file: any) => {
      return URL.createObjectURL(file);
    });
    let names = fileList?.map((file: any) => {
      return file.name;
    });
    setdisplayImages(display);
    setFiles(fileList);
    setFileNames(names);
  };

  // Helper function to check if file is an image
  const isImageFile = (file: File): boolean => {
    if (!file || !file.type) {
      // Fallback: check file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const fileName = file.name.toLowerCase();
      return imageExtensions.some(ext => fileName.endsWith(ext));
    }
    return file.type.startsWith('image/');
  };

  // ------------ side effects -------------
  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsSchools = permissionState?.permissions?.schools;
  const viewSchools = permissionsSchools?.find((permission: any) => permission["view-schools"] === "1")
  useEffect(() => {
    viewSchools &&
    dispatch(getCommonSchoolList());
  }, [viewSchools]);

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      displayImages.forEach((url: string) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [displayImages]);


  return (
    <>
      <Modal
        open={open}
        onClose={() => {
          // Cleanup object URLs
          displayImages.forEach((url: string) => {
            URL.revokeObjectURL(url);
          });
          setFiles([]);
          setdisplayImages([]);
          setFileNames([]);
          onClose();
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1F1E1E",
              mb: 2,
              width: 400,
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add File
            </Typography>

            <span
              className="cursor-pointer"
              onClick={() => {
                // Cleanup object URLs
                displayImages.forEach((url: string) => {
                  URL.revokeObjectURL(url);
                });
                setFiles([]);
                setdisplayImages([]);
                setFileNames([]);
                onClose();
              }}
            >
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />

          <Box
            sx={{
              bgcolor: "#fff",
              my: 3,
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
                        <div className="relative h-32">
                          <Loading />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-row gap-2 flex-wrap justify-center">
                          {displayImages.map((image: any, index: any) => (
                            <div
                              className="relative flex flex-col items-center group"
                              onClick={(e: any) => {
                                e.stopPropagation();
                                // Revoke the object URL before removing
                                URL.revokeObjectURL(image);
                                setdisplayImages((prev: any) =>
                                  prev.filter((i: any) => i !== image)
                                );
                                setFiles((prev: any) =>
                                  prev.filter((i: any, idx: any) => idx !== index)
                                );
                                setFileNames((prev: any) =>
                                  prev.filter((i: any, idx: any) => idx !== index)
                                );
                              }}
                              key={`${image}-${index}`}
                            >
                              <div className="relative w-20 h-20">
                                {isImageFile(files[index]) ? (
                                  <>
                                    <img
                                      className="w-20 h-20 object-cover rounded border border-gray-200"
                                      src={image}
                                      alt={fileNames[index] || "Preview"}
                                      onError={(e: any) => {
                                        // Show fallback if image fails to load
                                        e.target.style.display = 'none';
                                        const fallback = e.target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                    <div 
                                      className="w-20 h-20 text-xs font-bold bg-lightGray flex-col justify-center items-center rounded border border-gray-200 hidden"
                                    >
                                      <span className="text-gray-600">IMG</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-20 h-20 text-xs font-bold bg-lightGray flex flex-col justify-center items-center rounded border border-gray-200">
                                    <span className="text-gray-600">
                                      {files[index]?.type?.split("/")[1]?.toUpperCase() || 
                                       files[index]?.name?.split(".").pop()?.toUpperCase() || 
                                       "FILE"}
                                    </span>
                                  </div>
                                )}
                                <div className="cursor-pointer absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex justify-center items-center transition-all duration-200">
                                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                                    Discard
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-2 break-all text-center max-w-[120px] truncate">
                                {fileNames[index]}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="font-semibold text-xs text-gray mt-4 text-center">
                          Click on a file to remove it.
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
                  </div>
                )}
              </Box>
              <input
                style={{ display: "none" }}
                ref={imageRef}
                type="file"
                multiple
                id="file"
                name="file"
                accept="*/*"
                onChange={(event: any) => {
                  handleImageChange(event);
                }}
              />
              <p className="p-2 text-xs text-gray">
                Upload your course image here. It must meet our course image
                quality standards to be accepted. Important guidelines: 750x422
                pixels; .jpg, .jpeg,. gif, or .png. no text on the image.
              </p>
            </Box>
          </Box>
          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              color: "#1F1E1E",
              gap: 3,
              mt: 2,
            }}
          >
            <Button
              onClick={() => {
                // Cleanup object URLs
                displayImages.forEach((url: string) => {
                  URL.revokeObjectURL(url);
                });
                setdisplayImages([]);
                setFiles([]);
                setFileNames([]);
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                if(files.length === 0){
                  notify("there is no file chosen", "error");
                  return;
                }
                
                setIsUploading(true);
                try {
                  await dispatch(
                    addFile({
                      school_id: newSchool,
                      files: files,
                    })
                  )
                    .unwrap()
                    .then(() => {
                      // Cleanup object URLs after successful upload
                      displayImages.forEach((url: string) => {
                        URL.revokeObjectURL(url);
                      });
                      dispatch(getFilesList({ paginate: 10 }));
                      setdisplayImages([]);
                      setFiles([]);
                      setFileNames([]);
                      setNewSchool(null);
                      onClose();
                    });
                } catch (error) {
                  // Error is already handled in the reducer
                } finally {
                  setIsUploading(false);
                }
              }}
              className="w-24"
              label="Save"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default AddFileModal;
