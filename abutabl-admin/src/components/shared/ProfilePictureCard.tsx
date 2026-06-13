import { Box, Typography, Divider, Avatar } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import Button from "../../components/shared/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

const ProfilePictureCard = ({ formik, id }: any) => {
  // -------------- hooks -------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const [fileName, setFileName] = useState("");

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    // Set file name
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
      [id]: fileList[0],
    });
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    imageRef.current?.click();
  };

  // ----------- side effects -------------
  useEffect(() => {
    const photoValue = formik?.values?.[id];
    if (typeof photoValue === "string") {
      // If photo is already a string (base64 or URL), use it directly
      setdisplayImages(photoValue);
      // Clear fileName for existing URLs (not new file uploads)
      if (!photoValue.startsWith("data:")) {
        setFileName("");
      }
    } else if (
      photoValue instanceof Blob ||
      photoValue instanceof File
    ) {
      // If photo is a Blob or File, convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setdisplayImages(reader.result as string);
      };
      reader.readAsDataURL(photoValue);
      // Set fileName if it's a File object
      if (photoValue instanceof File) {
        setFileName(photoValue.name);
      }
    } else {
      setdisplayImages("");
      setFileName("");
    }
  }, [formik?.values?.[id], id]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Profile picture
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          p: 5,
          gap: 4,
        }}
      >
        {displayImages?.length ? (
          <>
            <label 
              htmlFor="profile-picture-input" 
              style={{ cursor: "pointer" }}
              onClick={handleLabelClick}
            >
              <img 
                width={300} 
                height={300} 
                src={displayImages} 
                alt="logo"
                style={{ cursor: "pointer" }}
              />
            </label>
            {fileName && (
              <p className="text-sm text-gray-600 py-2 break-all px-4 text-center">
                {fileName}
              </p>
            )}
          </>
        ) : (
          <label 
            htmlFor="profile-picture-input"
            className="w-32 h-32 rounded-full flex justify-center items-center border border-easyGray rounded-full cursor-pointer"
            onClick={handleLabelClick}
          >
            <AccountCircleOutlinedIcon
              style={{
                fontSize: "70px",
                color: "#8E9AA0",
              }}
            />
          </label>
        )}

        <label
          htmlFor="profile-picture-input"
          className="py-2 px-4 relative rounded flex flex-row items-center gap-2 justify-center border border-grayDarkHoverd text-primary w-30 m-3 cursor-pointer"
          style={{ cursor: "pointer" }}
          onClick={handleLabelClick}
        >
          {displayImages?.length ? "Change picture" : "Upload picture"}
        </label>
        <input
          style={{ display: "none" }}
          ref={imageRef}
          type="file"
          id="profile-picture-input"
          name="logo"
          accept="image/*"
          onChange={(event: any) => {
            handleImageChange(event);
          }}
        />
      </Box>
    </Box>
  );
};

export default ProfilePictureCard;
