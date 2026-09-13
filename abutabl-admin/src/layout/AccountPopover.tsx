import { useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Divider,
  MenuItem,
  MenuList,
  Popover,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { clearPermissions } from "../redux/reducers/permissionReducer";
import { setLoginProcess, setUser } from "../redux/reducers/loginReducer";
import { clearPersistedLoginUser } from "../utils/authSession";
import { redirectToStudentLogin } from "../utils/studentAppUrl";
import { clearStaffHandoffStorage } from "../utils/staffHandoff";

export const AccountPopover = (props: {
  anchorEl: any;
  onClose: any;
  open: any;
}) => {
  // -------------- hooks ------------
  const { anchorEl, onClose, open } = props;
  const dispatch = useDispatch();

  // ------------- functions ---------------
  const handleSignOut = useCallback(() => {
    onClose?.();
    Cookies.remove("token_");
    Cookies.remove("abotable_id");
    Cookies.remove("username");
    Cookies.remove("expiration");
    clearPersistedLoginUser();
    clearStaffHandoffStorage();
    dispatch(clearPermissions());
    dispatch(setUser({}));
    dispatch(setLoginProcess("signIn"));
    redirectToStudentLogin();
  }, [onClose, dispatch]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      onClose={onClose}
      open={open}
      PaperProps={{ sx: { width: 200 } }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2,
        }}
      >
        <Typography variant="overline">Account</Typography>
        <Typography color="text.secondary" variant="body2">
          {Cookies.get("username")}
        </Typography>
      </Box>
      <Divider />
      <MenuList
        disablePadding
        dense
        sx={{
          p: "8px",
          "& > *": {
            borderRadius: 1,
          },
        }}
      >
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </MenuList>
    </Popover>
  );
};

AccountPopover.propTypes = {
  anchorEl: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
};
