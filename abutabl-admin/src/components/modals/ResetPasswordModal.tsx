import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import {
  setLoginProcess,
  setVerificationCode,
} from "../../redux/reducers/loginReducer";
import { useDispatch } from "react-redux";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  sendEmailVerification: () => void;
  email: string;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 700,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const ResetPasswordModal = ({
  sendEmailVerification,
  open,
  onClose,
  email,
}: ModalProps) => {
  // ----------- hooks ------------
  const [seconds, setSeconds] = useState(60);
  const [OTP, setOTP] = useState<string>("");
  const dispatch = useDispatch();

  // ------------ side effects -------------
  useEffect(() => {
    if (open) {
      if (seconds === 0) return;

      const intervalId = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setSeconds(60);
    }
  }, [seconds, open]);
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
              Verification
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2 }}>
            <Typography sx={{ fontSize: "13px" }} component="p">
              Please verify your email, a 4 digits OTP is send to {email}
            </Typography>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                OTP <span className="text-red">*</span>
              </label>
              <TextField
                margin="normal"
                required
                fullWidth
                size="small"
                id="otpCode"
                name="otpCode"
                value={OTP}
                onChange={(e: any) => setOTP(e.target.value)}
                placeholder="Enter OTP code"
                sx={{ margin: 0, padding: 0 }}
              />
            </div>
            <p className="text-sm text-silver">
              Time Remaining{" "}
              <span className="text-dark text-md text-bold">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </p>
          </Box>

          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1F1E1E",
              mb: 2,
              mt: 4,
            }}
          >
            <Typography component="p">
              Didn’t get the code?{" "}
              <span
                onClick={() => {
                  sendEmailVerification();
                  setSeconds(60);
                }}
                className="text-primary cursor-pointer"
              >
                Resend code
              </span>
            </Typography>

            <Button
              onClick={() => {
                dispatch(setLoginProcess("resetPassword"));
                dispatch(setVerificationCode(OTP));

                onClose();
              }}
              className="w-24"
              label="Continue"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ResetPasswordModal;
