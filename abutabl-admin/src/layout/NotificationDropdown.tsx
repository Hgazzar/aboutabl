import { useState } from "react";
import {
  Avatar,
  Badge,
  IconButton,
  SvgIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";

import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useGetNotificationsQuery } from "@/redux/reducers/notificationsApi";
import axios from "axios";
import { deleteRequest, postRequest } from "@/utils/fetchMethods";

const NotificationDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const { data, error, isLoading, refetch } = useGetNotificationsQuery<any>(
    {
      limit: 10,
      //   is_read: false,
    },
    { pollingInterval: 60000 }
  );

  const notReaded = data?.notifications?.filter(
    (item: any) => item?.is_read === "0"
  );

  const readingNotify = async (id: number) => {
    const res = await postRequest({}, `/api/notifications/update_read/${id}`);
  };
  const deleteNotify = async () => {
    const res = await deleteRequest({}, `/api/notifications/delete_all`);
    refetch();
    // console.log(res);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading notifications</div>;

  //   console.log(data);

  return (
    <Tooltip title="">
      <div>
        <IconButton onClick={handleClick}>
          <Badge
            badgeContent={notReaded?.length ?? ""}
            color="success"
            variant={"standard"}
          >
            <SvgIcon fontSize="small">
              <NotificationsNoneIcon />
            </SvgIcon>
          </Badge>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          // PaperProps={{}}
        >
          <Box
            sx={{ maxHeight: 400, overflowY: "auto", padding: "10px" }}
          >
            {data?.notifications?.length > 0
              ? data?.notifications?.map((item: any, index: number) => (
                  <MenuItem
                    key={index}
                    onClick={() => {
                      readingNotify(item?.id);
                      window.open(item?.url, "_blank");
                      handleClose();
                    }}
                    sx={{ background: item?.is_read === "0" ? "#eee" : "" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        alt={item?.title}
                        src={item?.photo || "/assets/images/notification1.png"}
                        sx={{ width: 40, height: 40, marginRight: 2 }}
                      />
                      <Box>
                        <Typography variant="body1">{item?.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {item?.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              : "not found notifications now"}
          </Box>

          {data?.notifications?.length > 0 && (
            <MenuItem
              onClick={() => {
                deleteNotify();
                handleClose();
              }}
            >
              <Typography variant="body2" color="primary">
                Clear All Notifications
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </div>
    </Tooltip>
  );
};

export default NotificationDropdown;
