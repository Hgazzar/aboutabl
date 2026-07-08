import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Button from "../shared/Button";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { login, setLoginProcess } from "../../redux/reducers/loginReducer";
import PasswordInput from "../shared/PasswordInput";

const Signin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      remember: false,
    },
    validationSchema: Yup.object({
      username: Yup.string().required("Username is required"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters long"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (values.remember) {
          localStorage.setItem("remember", "true");
        } else {
          localStorage.removeItem("remember");
        }

        const result = await dispatch(login(values)).unwrap();
        if (result?.redirected) {
          return;
        }
        navigate("/dashboard");
      } catch {
        // Errors are surfaced via notify() in login thunk.
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        width: "50%",
      }}
    >
      <img
        className="mb-20 self-start"
        src={require("../../assets/Logo.png")}
        alt="logo"
      />
      <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
        Welcome Back
      </Typography>
      <Typography component="p" sx={{ mb: 2, color: "#8E9AA0" }}>
        Login to manage your schools
      </Typography>
      <Box
        component="form"
        noValidate
        sx={{ mt: 1 }}
        onSubmit={formik.handleSubmit}
      >
        <div className="flex flex-col gap-0 mb-4">
          <label className="text-sm font-semibold mb-1">
            Username <span className="text-red">*</span>
          </label>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="username"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.username}
            name="username"
            placeholder="Enter your username"
            error={formik.touched.username && Boolean(formik.errors.username)}
            helperText={formik.touched.username && formik.errors.username}
            sx={{ margin: 0, padding: 0 }}
          />
        </div>
        <div className="flex flex-col gap-0 mb-4">
          <label className="text-sm font-semibold mb-1">
            Password <span className="text-red">*</span>
          </label>
          <PasswordInput
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
          />
          {formik.touched.password && formik.errors.password && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {formik.errors.password}
            </Typography>
          )}
        </div>
        <div className="flex flex-row justify-between items-center my-4">
          <FormControlLabel
            control={
              <Checkbox
                name="remember"
                color="primary"
                checked={formik.values.remember}
                onChange={formik.handleChange}
              />
            }
            label="Remember me"
            className="text-sm font-semibold"
          />

          <p
            onClick={() => {
              dispatch(setLoginProcess("forgetPassword"));
            }}
            className="text-sm font-semibold text-primary cursor-pointer"
          >
            Forget Password ?
          </p>
        </div>
        <Button
          label="Login"
          className="w-full"
          disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
        />
      </Box>
    </Box>
  );
};

export default Signin;
