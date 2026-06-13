import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material/styles";

type Props = {
  values: { label: string; value: any }[];
  onChange: any;
  name?: string;
  id?: string;
  value?: any;
  styles?: any;
  optionStyles?: any;
  multiple?: boolean;
};

const CustomOption = styled('li')(({ theme }) => ({
  // Custom styles for the options
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  '&[data-focus="true"]': {
    backgroundColor: theme.palette.action.hover,
  },
  '&[aria-selected="true"]': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const SelectBox = ({
  value,
  values = [],
  onChange,
  name,
  id,
  multiple = false,
  styles = {},
  optionStyles = {},
}: Props) => {
  return (
    <FormControl sx={{ minWidth: 120 }}>
      <Autocomplete
        sx={styles}
        id={id}
        multiple={multiple}
        options={values}
        getOptionLabel={(option) => option.label}
        value={value}
        onChange={(event, newValue) => onChange(newValue)}
        isOptionEqualToValue={(option, value) => option.value === value}
        renderOption={(props, option) => (
          <CustomOption {...props} style={optionStyles}>
            {option.label}
          </CustomOption>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select"
            placeholder="Select"
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        )}
      />
    </FormControl>
  );
};

export default SelectBox;
