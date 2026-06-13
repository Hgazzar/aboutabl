import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Button from "../shared/Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  setFile: any;
  file: any;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,

  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const ImportCSVModal = ({
  open,
  onClose,
  fileName,
  setFile,
  file,
}: ModalProps) => {
  // ------------ hooks ---------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // ----------- functions --------------
  const handleImageChange: any = function (
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const fileList = e.target.files;
    if (!fileList) return;

    setUploadedFileName(fileList[0].name);
    setFile(fileList[0]);
    // setdisplayImages(display);
  };

  useEffect(() => {
    if (typeof file === "string") {
      setdisplayImages(file);
    } else {
      setdisplayImages(URL.createObjectURL(file));
    }
  }, [file]);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
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
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Import {fileName}
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
            <div className="flex flex-col gap-0 my-4 w-full">
              <label className="text-sm font-semibold mb-1">
                Upload CSV file
              </label>
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
                    <img
                      width={300}
                      height={300}
                      src={displayImages}
                      alt="logo"
                    />
                    {uploadedFileName && (
                      <p className="text-sm text-gray-600 py-2 break-all px-4 text-center">
                        {uploadedFileName}
                      </p>
                    )}
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
                )}
              </Box>
            </div>
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
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button onClick={onClose} className="w-24" label="Save" />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ImportCSVModal;
