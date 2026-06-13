import React from "react";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

type Props = {
  values: any;
  onChange: any;
  name?: string;
  id?: string;
  value?: any;
  styles?: any;
  multiple?: boolean;
};

const SelectBox = ({
  value,
  values,
  onChange,
  name,
  id,
  multiple = false,
  styles = {},
}: Props) => {
  return (
    <FormControl sx={{ minWidth: 120 }}>
      <Select
        sx={styles}
        id={id}
        multiple={multiple}
        name={name}
        defaultValue={""}
        size="small"
        displayEmpty
        value={value}
        inputProps={{ "aria-label": "Without label" }}
        onChange={onChange}
      >
        <MenuItem value="" disabled>
          <em>Select</em>
        </MenuItem>

        {values?.map((item: any) => {
          return (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default SelectBox;
