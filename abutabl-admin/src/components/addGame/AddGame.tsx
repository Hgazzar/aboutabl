import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicInfo from "../../components/addGame/BasicInfo";
import Assign from "../../components/addGame/Assign";
import SkillTags from "../../components/addGame/SkillTags";
import StandardCode from "../../components/addGame/StandardCode";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SwitchBox from "../shared/SwitchBox";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addGame } from "../../redux/reducers/subjectsReducer";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Games from "../subjectDetails/Games";

const AddGame = () => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const param = useParams();
  const formik: any = useFormik({
    initialValues: {
      background: "",
      file: null,
      name_en: "",
      name_ar: "",
      des_en: "",
      des_ar: "",
      skills_tags: "",
      code: "",
      subject_id: "",
      status: 1,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Clean up object URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (displayImages) {
        URL.revokeObjectURL(displayImages);
      }
    };
  }, [displayImages]);

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const file = fileList[0];
    
    // Validate it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      if (imageRef.current) {
        imageRef.current.value = "";
      }
      return;
    }

    // Revoke previous URL if exists
    if (displayImages) {
      URL.revokeObjectURL(displayImages);
    }

    try {
      let display = URL.createObjectURL(file);
      setdisplayImages(display);
      formik.setValues({
        ...formik.values,
        background: file,
      });
    } catch (error) {
      console.error('Error creating object URL:', error);
      alert('Error loading image preview');
    }
  };

  const handleRemoveImage = () => {
    if (displayImages) {
      URL.revokeObjectURL(displayImages);
    }
    setdisplayImages("");
    formik.setValues({
      ...formik.values,
      background: "",
    });
    // Reset input value to allow selecting the same file again
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  return (
    <Box sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",

          borderBottom: "1px solid #091E4224",
          overflow: "hidden",
        }}
      >
        <Typography variant="h5">
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              p: 1,
              mr: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                color: "green",
                display: "flex",
                flexDirection: "row",
              }}
            >
              {" "}
              {/* <img
                src={require("../../assets/Ticketing/vuesax/linear/greenbook.png")}
                alt="arrow"
                className=" mr-2 h-5 w-4"
              /> */}
              Course Management{" "}
              <ArrowForwardIosIcon sx={{ fontSize: "medium" }} />
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "gray",
                }}
              >
                {" "}
                Subjects name
              </Typography>
            </Typography>
          </Box>{" "}
          Add New game
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Typography
            component={"p"}
            sx={{
              color: "#1EBBA3",
              fontWeight: "400",
              mx: 4,
              cursor: "pointer",
            }}
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </Typography>{" "}
          <Button
            onClick={async () => {
              try {
                // Prepare skills_tags array - filter out empty values
                const skillsTagsArray = formik.values.skills_tags 
                  ? (Array.isArray(formik.values.skills_tags) 
                      ? formik.values.skills_tags.filter((tag: any) => tag && tag.trim() !== '')
                      : [formik.values.skills_tags].filter((tag: any) => tag && tag.trim() !== ''))
                  : [];
                
                await dispatch(
                  addGame({
                    ...formik.values,
                    status: formik.values.status === true ? 1 : 0,
                    subject_id: param.subject_id,
                    skills_tags: skillsTagsArray,
                  })
                ).unwrap();
                navigate(`/subjects/${param.subject_id}`);
              } catch (error: any) {
                console.log(error);
              }
            }}
            label="Add"
            className="w-30 m-3"
          />
        </Box>
      </Box>

      <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
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
              Upload Game Thumbnail
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
              >
                <input
                  style={{ display: "none" }}
                  ref={imageRef}
                  type="file"
                  id="background"
                  name="background"
                  accept="image/*"
                  onChange={(event: any) => {
                    handleImageChange(event);
                  }}
                />
                {displayImages ? (
                  <div className="flex flex-col gap-3 justify-center items-center w-full">
                    <img
                      width={200}
                      height={200}
                      src={displayImages}
                      alt="preview"
                      className="cursor-pointer rounded-lg object-cover border border-gray-200"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      onClick={() => {
                        imageRef?.current?.click();
                      }}
                      onError={(e) => {
                        console.error('Error loading image preview');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      label="Remove"
                      type="bordered"
                      onClick={() => {
                        handleRemoveImage();
                      }}
                      className="w-30"
                    />
                  </div>
                ) : (
                  <div 
                    className="flex flex-col gap-3 justify-center items-center cursor-pointer"
                    onClick={() => {
                      imageRef?.current?.click();
                    }}
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
                  </div>
                )}
              </Box>
              <p className="p-2 text-xs text-gray">
                Upload your Game image here. It must meet our Game image quality
                standards to be accepted. Important guidelines: 750x422 pixels;
                .jpg, .jpeg,. gif, or .png. no text on the image.
              </p>
            </Box>
          </Box>
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
            <Typography
              component={"p"}
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Accessibility
            </Typography>{" "}
            <Divider />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "row",
                alignItems: "center",
                p: 3,
              }}
            >
              <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
                Active
              </Typography>{" "}
              <SwitchBox id={"status"} formik={formik} />
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <BasicInfo
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
          <SkillTags
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
          <StandardCode
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddGame;
