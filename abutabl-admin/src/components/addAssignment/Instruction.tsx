import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css"; // Import the styles
import TextEditor from "../shared/TextEditor";
import AddedQuestion from "./AddedQuestion";

const Instruction = ({ formik }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Enter your instruction
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
              Request Title (English) <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              placeholder="ex (English)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-20">
            <label className="text-sm font-semibold mb-1">
              Description (English)
            </label>

            <TextEditor
              id={"des"}
              formik={formik}
              placeholder="Add your description ..."
            />
          </div>
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
              Request title (Arabic) <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="request_ar"
              name="request_ar"
              value={formik.values.request_ar}
              onChange={formik.handleChange}
              placeholder="ex (English)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-20">
            <label className="text-sm font-semibold mb-1">
              Description (Arabic) <span className="text-red">*</span>
            </label>

            <TextEditor
              id={"des_ar"}
              formik={formik}
              placeholder="Add your description ..."
            />
          </div>
        </Box>
      </Box>
      <Box
        sx={{
          width: "95%",
          display: "flex",
          flexDirection: "column",
          margin: "auto",
        }}
      >
        <div className="flex flex-col gap-0 mb-4">
          <label className="text-sm font-semibold mb-1">
            Request Title (English) <span className="text-red">*</span>
          </label>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="request_en"
            name="request_en"
            value={formik.values.request_en}
            onChange={formik.handleChange}
            placeholder="ex (English)"
            sx={{ margin: 0, padding: 0 }}
          />
        </div>
      </Box>
      <AddedQuestion />
    </Box>
  );
};

export default Instruction;
