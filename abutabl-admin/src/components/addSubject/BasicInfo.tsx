import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import the styles
import TextEditor from "../shared/TextEditor";

const BasicInfo = ({ formik, initialValues }: any) => {
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
        <Box
          sx={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Subject name (English) <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_en"
              name="name_en"
              value={formik.values.name_en}
              onChange={formik.handleChange}
              placeholder="ex (English)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-20">
            <label className="text-sm font-semibold mb-1">
              About (English)
            </label>

            <TextEditor
              id={"des_en"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.des_en}
            />
          </div>
          {/* <div className="flex flex-col gap-0 mb-10">
            <label className="text-sm font-semibold mb-1">
              How to pass (English)
            </label>

            <TextEditor
              id={"pass_en"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.pass_en}
            />
          </div> */}
        </Box>
        <Box
          sx={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Subject name (Arabic) <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_ar"
              name="name_ar"
              value={formik.values.name_ar}
              onChange={formik.handleChange}
              placeholder="ex (Arabic)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-20">
            <label className="text-sm font-semibold mb-1">About (Arabic)</label>

            <TextEditor
              id={"des_ar"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.des_ar}
            />
          </div>
          {/* <div className="flex flex-col gap-0 mb-10">
            <label className="text-sm font-semibold mb-1">
              How to pass ( Arabic ){" "}
            </label>
            <TextEditor
              id={"pass_ar"}
              formik={formik}
              placeholder="Add your description ..."
              initialValue={initialValues?.pass_ar}
            />
          </div> */}
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
