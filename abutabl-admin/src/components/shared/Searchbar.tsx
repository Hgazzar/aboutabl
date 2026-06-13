import * as React from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsIcon from "@mui/icons-material/Directions";

export default function Searchbar({ value, onChange, onSearch }: any) {
  return (
    <Paper
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      sx={{
        p: "2px 4px",
        display: "flex",
        alignItems: "center",
        maxWidth: 400,
        bgcolor: "#F7F9FA",
        border: "unset",
        boxShadow: "none",
      }}
    >
      <IconButton
        onClick={onSearch}
        type="button"
        sx={{ p: "10px" }}
        aria-label="search"
      >
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search"
        value={value}
        onChange={onChange}
        inputProps={{ "aria-label": "search google maps" }}
      />
    </Paper>
  );
}
