import { Box, Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { IG_GREEN, IG_GREEN_HOVER } from "./interactiveGamesTokens";

export type InteractiveGamesCrumb = { label: string; to?: string };

type Props = {
  title: string;
  subtitle?: ReactNode;
  crumbs?: InteractiveGamesCrumb[];
  headerActions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared chrome for teacher/admin interactive game routes — matches list pages (e.g. Schools):
 * white header strip + bordered content panel.
 */
export function InteractiveGamesPageShell({
  title,
  subtitle,
  crumbs,
  headerActions,
  children,
}: Props) {
  return (
    <Box sx={{ p: 2 }}>
      {crumbs?.length ? (
        <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb" separator="›">
          {crumbs.map((c, i) =>
            c.to ? (
              <MuiLink
                key={`${c.label}-${i}`}
                component={Link}
                to={c.to}
                underline="hover"
                variant="body2"
                sx={{ color: IG_GREEN, "&:hover": { color: IG_GREEN_HOVER } }}
              >
                {c.label}
              </MuiLink>
            ) : (
              <Typography key={`${c.label}-${i}`} color="text.primary" variant="body2">
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
          p: 3,
          mb: 2,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 280px" }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle != null && subtitle !== "" ? (
            <Typography component="div" variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {headerActions ? (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>{headerActions}</Box>
        ) : null}
      </Box>

      <Box
        sx={{
          bgcolor: "#fff",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
