import { useState } from "react";
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MenuIcon from "@mui/icons-material/Menu";
import { useTranslation } from "react-i18next";
import { AccountPopover } from "@/layout/AccountPopover";
import NotificationDropdown from "@/layout/NotificationDropdown";
import { usePopover } from "@/hooks/usePopover";
import { useTeacherLayout } from "@/layout/TeacherLayoutContext";
import { ReactComponent as TrendArrowIcon } from "@/assets/arrow.svg";
import { ReactComponent as StatIconGreen } from "@/assets/btn.svg";
import { ReactComponent as StatIconBlue } from "@/assets/btn (1).svg";
import containerBanner from "@/assets/container.svg";
import { ReactComponent as NoteIcon } from "@/assets/note.svg";

export type TeacherDashboardStats = {
  totalClasses: number;
  totalStudents: number;
  studentsNeedAttention: number;
  assignmentsToReview: number;
  studentsGrowthThisTerm?: number;
};

export type TeacherDashboardHeaderProps = {
  userName: string;
  stats: TeacherDashboardStats;
};

type StatCardProps = {
  label: string;
  value: number;
  statusLabel: string;
  statusColor: string;
  statusIcon: React.ReactNode;
  icon: React.ReactNode;
};

const StatCard = ({
  label,
  value,
  statusLabel,
  statusColor,
  statusIcon,
  icon,
}: StatCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: "16px",
      bgcolor: "#FFFFFF",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
      height: "100%",
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Typography
        variant="body2"
        sx={{ color: "#6B7280", fontSize: "0.875rem", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box sx={{ flexShrink: 0 }}>{icon}</Box>
    </Stack>

    <Typography
      sx={{
        mt: 1.5,
        fontSize: "2rem",
        fontWeight: 700,
        color: "#111827",
        lineHeight: 1.1,
      }}
    >
      {value}
    </Typography>

    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
      {statusIcon}
      <Typography
        variant="body2"
        sx={{ color: statusColor, fontSize: "0.8125rem", fontWeight: 500 }}
      >
        {statusLabel}
      </Typography>
    </Stack>
  </Paper>
);

export const TeacherDashboardHeader = ({
  userName,
  stats,
}: TeacherDashboardHeaderProps) => {
  const { t } = useTranslation();
  const { openNav } = useTeacherLayout();
  const accountPopover = usePopover();
  const [searchQuery, setSearchQuery] = useState("");

  const notificationIcon = (
    <NoteIcon
      aria-hidden
      style={{ width: 24, height: 29, display: "block" }}
    />
  );

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1.5, md: 3 },
          mb: 2.5,
        }}
      >
        <IconButton
          onClick={openNav}
          sx={{ display: { lg: "none" }, ml: -1, flexShrink: 0 }}
          aria-label="Open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Paper
          component="form"
          elevation={0}
          onSubmit={(e) => e.preventDefault()}
          sx={{
            flex: { xs: 1, md: "0 0 auto" },
            width: { md: "68%" },
            maxWidth: { md: 720 },
            display: "flex",
            alignItems: "center",
            px: 2.25,
            height: 48,
            borderRadius: "28px",
            border: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          }}
        >
          <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20, mr: 1.25 }} />
          <InputBase
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("TEACHER_DASHBOARD.SEARCH_PLACEHOLDER")}
            sx={{
              fontSize: "0.9375rem",
              color: "#374151",
              "& input::placeholder": { color: "#9CA3AF", opacity: 1 },
            }}
          />
        </Paper>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ flexShrink: 0, ml: { xs: 0, md: "auto" } }}
        >
          <NotificationDropdown
            icon={notificationIcon}
            badgeVariant="dot"
            iconButtonSx={{ p: 0.75 }}
          />

          <Avatar
            onClick={accountPopover.handleOpen}
            ref={accountPopover.anchorRef}
            sx={{
              width: 44,
              height: 44,
              cursor: "pointer",
              bgcolor: "#038E7B",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
            }}
          >
            <PersonOutlineIcon sx={{ color: "#FFFFFF" }} />
          </Avatar>
        </Stack>
      </Box>

      <AccountPopover
        anchorEl={accountPopover.anchorRef.current}
        open={accountPopover.open}
        onClose={accountPopover.handleClose}
      />

      <Typography
        sx={{
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          fontWeight: 700,
          color: "#111827",
          mb: 1.5,
        }}
      >
        {t("TEACHER_DASHBOARD.WELCOME")},{" "}
        <Box component="span" sx={{ color: "#038E7B" }}>
          {userName}
        </Box>
      </Typography>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1.75,
          py: 0.75,
          mb: 2.5,
          borderRadius: "999px",
          bgcolor: "#ECFDF5",
          border: "1px solid #A7F3D0",
        }}
      >
        <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#038E7B" }} />
        <Typography
          variant="body2"
          sx={{ color: "#047857", fontSize: "0.8125rem", fontWeight: 500 }}
        >
          {t("TEACHER_DASHBOARD.ATTENTION_ALERT", {
            count: stats.studentsNeedAttention,
          })}
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 3,
          borderRadius: "20px",
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        <Box
          component="img"
          src={containerBanner}
          alt={t("TEACHER_DASHBOARD.BANNER_ALT")}
          sx={{
            width: "100%",
            height: "auto",
            display: "block",
            minHeight: { xs: 120, md: 161 },
            objectFit: "cover",
          }}
        />
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label={t("TEACHER_DASHBOARD.STATS.TOTAL_CLASSES")}
            value={stats.totalClasses}
            statusLabel={t("TEACHER_DASHBOARD.STATS.ACTIVE")}
            statusColor="#038E7B"
            statusIcon={<TrendArrowIcon />}
            icon={<StatIconGreen />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label={t("TEACHER_DASHBOARD.STATS.TOTAL_STUDENTS")}
            value={stats.totalStudents}
            statusLabel={t("TEACHER_DASHBOARD.STATS.GROWTH_THIS_TERM", {
              count: stats.studentsGrowthThisTerm ?? 0,
            })}
            statusColor="#2563EB"
            statusIcon={
              <TrendingUpIcon sx={{ fontSize: 18, color: "#2563EB" }} />
            }
            icon={<StatIconBlue />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label={t("TEACHER_DASHBOARD.STATS.NEED_ATTENTION")}
            value={stats.studentsNeedAttention}
            statusLabel={t("TEACHER_DASHBOARD.STATS.NEEDS_REVIEW")}
            statusColor="#EA580C"
            statusIcon={
              <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#EA580C" }} />
            }
            icon={<StatIconGreen />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label={t("TEACHER_DASHBOARD.STATS.ASSIGNMENTS_REVIEW")}
            value={stats.assignmentsToReview}
            statusLabel={t("TEACHER_DASHBOARD.STATS.ACTIVE")}
            statusColor="#038E7B"
            statusIcon={<TrendArrowIcon />}
            icon={<StatIconGreen />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboardHeader;
