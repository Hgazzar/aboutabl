import { TextField } from "@mui/material";
import React from "react";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const PasswordInput = ({
  value,
  onChange,
  onBlur,
  id = "password",
  name = "password",
}: any) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setShowPassword(!showPassword)}
        className="cursor-pointer absolute top-2 right-3 z-10"
      >
        {!showPassword ? <VisibilityOffIcon /> : <RemoveRedEyeIcon />}
      </div>
      <TextField
        margin="normal"
        required
        fullWidth
        size="small"
        name={name}
        type={showPassword ? "text" : "password"}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        id={id}
        placeholder="Enter your password"
        sx={{ margin: 0, padding: 0 }}
      />
    </div>
  );
};

export default PasswordInput;
