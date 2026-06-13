import { Box, Grid, Typography } from "@mui/material";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicInfo from "../../components/addContent/BasicInfo";
import Resources from "../../components/addContent/Resources";
import AccountStatus from "../shared/AccountStatus";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addContentToLesson } from "../../redux/reducers/subjectsReducer";
import { useEffect, useState } from "react";
import { notify } from "@/utils/notify";

const AddContent = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // ----------- hooks ------------
  const [links, setLinks] = useState<any>([]);
  const location = useLocation();
  const formik: any = useFormik({
    initialValues: {
      name_en: "",
      name_ar: "",
      about_en: "",
      about_ar: "",
      file: null,
      status:false,
      type: "",
      subject_id: "",
      lesson_id: "",
      source: "upload",
      scorm_directory: null as string | null,
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  
  // ----------- functions --------------
  useEffect(() => {
    formik.setValues({
      ...formik.values,
      ...location.state,
    });
  }, []);  
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

          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">Add Content</Typography>{" "}
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
            onClick={() => navigate(-1)}
          >
            Cancel
          </Typography>{" "}
          <Button
            onClick={async () => {
              const isDdl = formik.values.source === "ddl";
              if (isDdl && !formik.values.scorm_directory) {
                notify("Please select a SCORM folder from DDL", "error");
                return;
              }
              if (!isDdl && !formik.values.file) {
                notify("Please upload a file or select a folder from DDL", "error");
                return;
              }
              try {
                setIsUploading(true);
                await dispatch(
                  addContentToLesson({
                    ...formik?.values,
                    status: (formik.values.status === true ? 1 : 0),
                    resource_id: links.map((item: any) => item.id),
                  })
                ).unwrap();

                setIsUploading(false);
                navigate(-1);
              } catch (error: any) {
                setIsUploading(false);
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
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <BasicInfo
            formik={formik}
            values={formik.values}
            onChange={formik.handleChange}
            isUploading={isUploading}
          />
          {/* <Resources links={links} setLinks={setLinks} /> */}
        </Grid>
        <Grid
          item
          xs={12}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <AccountStatus formik={formik} value={formik.values.status} />
        </Grid>
      </Grid>
    </>
  );
};

export default AddContent;
