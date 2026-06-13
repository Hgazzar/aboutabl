import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
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
import { editGame, getGamesShow } from "../../redux/reducers/subjectsReducer";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const EditGame = () => {
  // ----------- hooks ------------
  const imageRef: any = useRef(null);
  const [displayImages, setdisplayImages] = useState("");
  const param = useParams();
  const [initialValues, setInitialValues] = useState<any>({});
  const [skill, setskill] = useState<any>({});

  const formik: any = useFormik({
    initialValues: {
      background: null,
      file: null,
      name_en: "",
      name_ar: "",
      des_en: "",
      des_ar: "",
      skills_tags: "",
      code: "",
      subject_id: "",
      status: 0,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // ----------- functions --------------
  const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    let display = URL.createObjectURL(fileList[0]);
    setdisplayImages(display);
    formik.setValues({
      ...formik.values,
      background: fileList[0],
    });
  };

  //   ----------- side effect --------------
  useEffect(() => {
    if (typeof formik.values.background === "string") {
      // If photo is already a string, use it directly
      setdisplayImages(formik.values.background);
    } else if (
      formik.values.background instanceof Blob ||
      formik.values.background instanceof File
    ) {
      // If photo is a Blob or File, create an object URL
      setdisplayImages(URL.createObjectURL(formik.values.background));
    } else {
      setdisplayImages("");
    }
  }, [formik?.values?.background]);

  useEffect(() => {
    dispatch(getGamesShow({ id: param.game_id }))
      .unwrap()
      .then((result: any) => {
        formik.setValues({
          ...result?.game?.[0],
          file: null,
        });
        setInitialValues(result?.game?.[0]);
        setskill(result);
        // console.log(result);
      });
  }, []);
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
          Edit game
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
                await dispatch(
                  editGame({
                    ...formik.values,
                    status: formik.values.status === true ? 1 : 0,
                    subject_id: param.subject_id,
                    background:
                      typeof formik.values.background === "string"
                        ? null
                        : formik.values.background,
                    skills_tags: [formik.values.skills_tags],

                    id: param.game_id,
                  })
                ).unwrap();
                navigate(`/subjects/${param.subject_id}`);
              } catch (error: any) {
                console.log(error);
              }
            }}
            label="Save"
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
                onClick={() => {
                  imageRef?.current?.click();
                }}
              >
                {displayImages?.length ? (
                  <div>
                    <img
                      width={100}
                      height={100}
                      src={displayImages}
                      alt="logo"
                      className="cursor-pointer"
                    />
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
                      id="background"
                      name="background"
                      accept="image/*"
                      onChange={(event: any) => {
                        handleImageChange(event);
                      }}
                    />
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
              <SwitchBox
                id="status"
                formik={formik}
                value={formik.values.status}
              />
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
            isUploading={isUploading}
            initialValues={initialValues}
          />
          <SkillTags
            skill={skill}
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

export default EditGame;
