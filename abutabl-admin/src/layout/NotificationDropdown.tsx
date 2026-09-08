import { useMemo, useState } from "react";
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
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useDeleteAllNotificationsMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/reducers/notificationsApi";
import {
  countStaffUnreadNotifications,
  isStaffNotificationUnread,
  openStaffNotificationNavTarget,
  type StaffNotificationItem,
} from "@/utils/notificationNav";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";

const MUI_BADGE_COLORS = [
  "error",
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
] as const;

type MuiBadgeColor = (typeof MUI_BADGE_COLORS)[number];

const POLL_MS = 60_000;
const LIST_LIMIT = 10;

const NotificationDropdown = ({
  icon,
  badgeVariant = "standard",
  iconButtonSx,
  badgeColor = "error",
}: {
  icon?: React.ReactNode;
  badgeVariant?: "standard" | "dot";
  iconButtonSx?: object;
  badgeColor?: MuiBadgeColor | string;
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const open = Boolean(anchorEl);
  const isRtl = i18n.language === "ar";

  const { data, error, isLoading, isFetching } = useGetNotificationsQuery(
    { limit: LIST_LIMIT },
    { pollingInterval: POLL_MS }
  );
  const [markRead, markReadState] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();
  const [deleteAll, deleteAllState] = useDeleteAllNotificationsMutation();

  const list = data?.notifications ?? [];
  const unreadCount = useMemo(() => countStaffUnreadNotifications(list), [list]);
  const mutating =
    markReadState.isLoading || markAllState.isLoading || deleteAllState.isLoading;
  const hasItems = list.length > 0;
  const hasUnread = unreadCount > 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onItemClick = async (item: StaffNotificationItem) => {
    if (mutating) return;
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) return;

    try {
      if (isStaffNotificationUnread(item)) {
        await markRead(id).unwrap();
      }
    } catch {
      // Do not block navigation on mark-read failure.
    }

    openStaffNotificationNavTarget(navigate, item.url);
    handleClose();
  };

  const onMarkAllRead = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (mutating || !hasUnread) return;
    try {
      await markAllRead().unwrap();
    } catch {
      // Keep unread state on failure.
    }
  };

  const onConfirmDeleteAll = async () => {
    await deleteAll().unwrap();
    handleClose();
  };

  const isPaletteBadgeColor = MUI_BADGE_COLORS.includes(
    badgeColor as MuiBadgeColor
  );
  const resolvedBadgeColor: MuiBadgeColor = isPaletteBadgeColor
    ? (badgeColor as MuiBadgeColor)
    : "error";

  const bellButton = (
    <IconButton
      onClick={handleClick}
      sx={iconButtonSx}
      aria-label={t("NOTIFICATIONS.BELL_LABEL")}
      disabled={mutating}
    >
      <Badge
        badgeContent={
          badgeVariant === "dot"
            ? unreadCount
              ? ""
              : 0
            : unreadCount || undefined
        }
        color={resolvedBadgeColor}
        variant={badgeVariant}
        invisible={badgeVariant === "dot" ? !unreadCount : !unreadCount}
        sx={
          badgeVariant === "dot"
            ? {
                "& .MuiBadge-badge": {
                  minWidth: 8,
                  height: 8,
                  borderRadius: "50%",
                  top: 4,
                  ...(isRtl ? { left: 4, right: "auto" } : { right: 4 }),
                  ...(!isPaletteBadgeColor
                    ? { backgroundColor: badgeColor }
                    : {}),
                },
              }
            : undefined
        }
      >
        {icon ?? (
          <SvgIcon fontSize="small">
            <NotificationsNoneIcon />
          </SvgIcon>
        )}
      </Badge>
    </IconButton>
  );

  return (
    <Tooltip title={t("NOTIFICATIONS.BELL_LABEL")}>
      <div>
        {bellButton}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: isRtl ? "left" : "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: isRtl ? "left" : "right",
          }}
          PaperProps={{
            sx: {
              maxWidth: "min(360px, calc(100vw - 24px))",
              overflowX: "hidden",
            },
          }}
        >
          <Box
            sx={{
              maxHeight: 400,
              overflowY: "auto",
              overflowX: "hidden",
              px: 1.5,
              pt: 1.5,
              pb: 1,
              minWidth: 280,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t("NOTIFICATIONS.TITLE")}
              </Typography>
              {hasUnread ? (
                <Button
                  size="small"
                  onClick={onMarkAllRead}
                  disabled={mutating}
                >
                  {markAllState.isLoading
                    ? t("NOTIFICATIONS.MARKING")
                    : t("NOTIFICATIONS.MARK_ALL_READ")}
                </Button>
              ) : null}
            </Stack>

            {isLoading && !data ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={22} />
              </Box>
            ) : null}

            {error ? (
              <Typography variant="body2" color="error" sx={{ py: 1 }}>
                {t("NOTIFICATIONS.ERROR")}
              </Typography>
            ) : null}

            {!isLoading && !error && !hasItems ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t("NOTIFICATIONS.EMPTY")}
              </Typography>
            ) : null}

            {!error &&
              list.map((item) => {
                const unread = isStaffNotificationUnread(item);
                return (
                  <MenuItem
                    key={String(item.id)}
                    disabled={mutating}
                    onClick={() => {
                      void onItemClick(item);
                    }}
                    sx={{
                      background: unread ? "#eee" : undefined,
                      alignItems: "flex-start",
                      whiteSpace: "normal",
                      mb: 0.5,
                      borderRadius: 1,
                      opacity: mutating ? 0.7 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      <Avatar
                        alt={item?.title ?? ""}
                        src={
                          item?.photo || "/assets/images/notification1.png"
                        }
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          mr: isRtl ? 0 : 2,
                          ml: isRtl ? 2 : 0,
                        }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight={unread ? 700 : 500}
                          sx={{
                            wordBreak: "break-word",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item?.title}
                        </Typography>
                        {item?.description ? (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                              wordBreak: "break-word",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}

            {isFetching && data && !mutating ? (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                sx={{ mt: 0.5 }}
              >
                {t("NOTIFICATIONS.REFRESHING")}
              </Typography>
            ) : null}
          </Box>

          {hasItems ? (
            <MenuItem
              disabled={mutating}
              onClick={() => setConfirmOpen(true)}
            >
              <Typography variant="body2" color="primary">
                {t("NOTIFICATIONS.CLEAR_ALL")}
              </Typography>
            </MenuItem>
          ) : null}
        </Menu>

        <DeleteConfirmationModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          item={t("NOTIFICATIONS.ITEM_LABEL")}
          onConfirm={onConfirmDeleteAll}
        />
      </div>
    </Tooltip>
  );
};

export default NotificationDropdown;
