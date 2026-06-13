import React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "../shared/Button";
import ResetPasswordModal from "../modals/ResetPasswordModal";
import { useFormik } from "formik";
import * as Yup from "yup";
import Box from "@mui/material/Box";
import { sendEmailVerification } from "../../redux/reducers/loginReducer";
import { useDispatch } from "react-redux";
import { notify } from "@/utils/notify";

interface SigninProps {}

const ForgetPassword = ({}: SigninProps) => {
  // ------------ hooks --------------
  const [open, setOpen] = React.useState(false);
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Email is required"),
    }),
    onSubmit: async (values) => {
      // console.log(values);
    },
  });
  const dispatch = useDispatch();
  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
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
          Forget Password ?
        </Typography>
        <Typography
          component="p"
          sx={{ mb: 2, fontSize: "12px", color: "#8E9AA0" }}
        >
          Please enter your email to send a code to reset your password
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Email <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="email"
              onChange={formik.handleChange}
              value={formik.values.email}
              name="email"
              placeholder="Enter email"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <Button
            className="w-full"
            label="Send code"
            onClick={async () => {
              await dispatch(sendEmailVerification(formik.values))
                .unwrap()
                .then(() => !open && handleOpen())
                .catch((error: any) => notify(error.message, "error"));
            }}
          />
        </Box>
      </Box>
      <ResetPasswordModal
        sendEmailVerification={async () => {
          try {
            await dispatch(sendEmailVerification(formik.values)).unwrap();
            !open && handleOpen();
          } catch (error) {
            console.log(error);
          }
        }}
        email={formik.values.email}
        open={open}
        onClose={handleClose}
      />
    </>
  );
};

export default ForgetPassword;
