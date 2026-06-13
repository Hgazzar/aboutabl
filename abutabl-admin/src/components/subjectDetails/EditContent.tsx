import { Box, Grid, Typography } from "@mui/material";
import Button from "../shared/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicInfo from "../addContent/BasicInfo";
import Resources from "../addContent/Resources";
import AccountStatus from "../shared/AccountStatus";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  editContentInLesson,
  viewContent,
} from "../../redux/reducers/subjectsReducer";
import { useEffect, useState } from "react";

const EditContent = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // ----------- hooks ------------
  const [links, setLinks] = useState<any>([]);
  const [initialValues, setInitialValues] = useState<any>({});
  const formik: any = useFormik({
    initialValues: {
      name_en: "",
      name_ar: "",
      about_en: "",
      about_ar: "",
      file: null,
      status: 1,
      type: "",
      subject_id: "",
      lesson_id: "",
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {},
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const param = useParams();

  // console.log(param.id);
    
  // ----------- functions --------------

  // ----------- side effects ------------
  
  useEffect(() => {
    dispatch(viewContent(param.id))
      .unwrap()
      .then((result: any) => {
        formik.setValues({
          ...result.data,
          file: null,
        });
        setInitialValues({ ...result.data });
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
        <Typography variant="h5">Edit Content</Typography>{" "}
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
              try {
                setIsUploading(true);
                await dispatch(
                  editContentInLesson({
                    data: {
                      ...formik?.values,
                      status: formik.values.status === true ? 1 : 0,
                      resource_id: links.map((item: any) => item.id),
                    },
                    id: param.id,
                  })
                ).unwrap();

                setIsUploading(false);
                navigate(-1);
              } catch (error: any) {
                console.log(error);
              }
            }}
            label="Edit"
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
            initialValues={initialValues}
          />
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

export default EditContent;
