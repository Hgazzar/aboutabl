import { Box, Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  TD_GREEN,
  TD_GREEN_SOFT,
  TD_INK_SOFT,
  TD_MUTED,
  TD_PAGE_BG,
} from "./teacherLiveTokens";

export type TeacherLiveCrumb = { label: string; to?: string };

type Props = {
  title: string;
  subtitle?: ReactNode;
  crumbs?: TeacherLiveCrumb[];
  headerActions?: ReactNode;
  children: ReactNode;
};

/**
 * Page chrome aligned with teacher dashboard / class-details headers —
 * large title, muted subtitle, soft page background (no admin bordered panels).
 */
export function TeacherLivePageShell({
  title,
  subtitle,
  crumbs,
  headerActions,
  children,
}: Props) {
  return (
    <Box
      sx={{
        bgcolor: TD_PAGE_BG,
        minHeight: "100%",
        px: { xs: 2, md: 4 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 4, md: 6 },
      }}
    >
      {crumbs?.length ? (
        <Breadcrumbs
          sx={{ mb: 2 }}
          aria-label="breadcrumb"
          separator="›"
        >
          {crumbs.map((c, i) =>
            c.to ? (
              <MuiLink
                key={`${c.label}-${i}`}
                component={Link}
                to={c.to}
                underline="hover"
                variant="body2"
                sx={{
                  color: TD_GREEN,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  "&:hover": { color: TD_GREEN_SOFT },
                }}
              >
                {c.label}
              </MuiLink>
            ) : (
              <Typography
                key={`${c.label}-${i}`}
                sx={{
                  color: TD_MUTED,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {c.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 280px" }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: TD_INK_SOFT,
              m: 0,
            }}
          >
            {title}
          </Typography>
          {subtitle != null && subtitle !== "" ? (
            <Typography
              component="div"
              sx={{
                mt: 1.25,
                maxWidth: 720,
                fontSize: "0.9375rem",
                fontWeight: 600,
                lineHeight: 1.45,
                /* Match Class Details / dashboard accent copy */
                color: TD_GREEN_SOFT,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {headerActions ? (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
              pt: { md: 1 },
            }}
          >
            {headerActions}
          </Box>
        ) : null}
      </Box>

      {children}
    </Box>
  );
}
