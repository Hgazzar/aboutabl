import React, { useEffect, useState } from "react";
import {
  OutlinedInput,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  Stack,
  Chip,
  Typography,
  Checkbox,
  ListItemText,
} from "@mui/material";

interface IMultiSelect {
  options: { label: string; value: string | number }[];
  label: string;
  value?: (string | number)[];
  onChange?: (selected: (string | number)[]) => void;
}

export default function MultiSelect({
  options,
  label,
  value,
  onChange,
}: IMultiSelect) {
  const [selectedOption, setSelectedOptions] = useState<(string | number)[]>(
    Array.isArray(value) ? value : []
  );

  useEffect(() => {
    if (value !== undefined) {
      setSelectedOptions(Array.isArray(value) ? value : []);
    }
  }, [value]);

  return (
    <FormControl sx={{ width: "100%" }}>
      <Typography>{label}</Typography>
      <Select
        multiple
        value={selectedOption}
        onChange={(e) => {
          const v = e.target.value as (string | number)[];
          setSelectedOptions(v);
          onChange?.(v);
        }}
        input={<OutlinedInput />}
        renderValue={(selected) => (
          <Stack gap={1} direction="row" flexWrap="wrap">
            {(selected as (string | number)[]).map((val) => {
              const opt = options.find((o) => o.value === val);
              return (
                <Chip
                  key={String(val)}
                  label={opt?.label ?? String(val)}
                  variant="outlined"
                  style={{ borderRadius: "1px" }}
                />
              );
            })}
          </Stack>
        )}
      >
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            <Checkbox
              size="small"
              checked={selectedOption.indexOf(option.value) > -1}
            />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
