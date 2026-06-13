import { Box, Divider, TextField, Checkbox } from "@mui/material";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import Button from "../shared/Button";
import { addExternalLinkToContent } from "../../redux/reducers/subjectsReducer";
import { useDispatch } from "react-redux";

const ExLink = ({ setLinks }: any) => {
  // ----------- hooks -----------
  const [linkResources, setLinkResources] = useState<any>({
    name: "",
    url: "",
    add_to_library: false,
  });
  const dispatch = useDispatch();

  return (
    <Box>
      <div className="flex flex-col gap-0 mb-4 p-2">
        <label className="text-sm font-semibold mb-1">
          Title <span className="text-red">*</span>
        </label>
        <TextField
          margin="normal"
          required
          fullWidth
          value={linkResources.name}
          onChange={(e) => {
            setLinkResources((prev: any) => ({
              ...prev,
              name: e.target.value,
            }));
          }}
          size="small"
          id="title"
          name="title"
          sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
        />
      </div>
      <div className="flex flex-col gap-0 mb-4 p-2">
        <label className="text-sm font-semibold mb-1">
          URL <span className="text-red">*</span>
        </label>
        <TextField
          margin="normal"
          required
          fullWidth
          size="small"
          id="url"
          name="url"
          value={linkResources.url}
          onChange={(e) => {
            setLinkResources((prev: any) => ({
              ...prev,
              url: e.target.value,
            }));
          }}
          sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
        />
      </div>
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "right",
        }}
      >
        <Button
          onClick={() => {
            setLinkResources({
              name: "",
              url: "",
              add_to_library: false,
            });
          }}
          label="Discard"
          type="bordered"
          className="w-30 m-3"
        />
        <Button
          onClick={async () => {
            await dispatch(
              addExternalLinkToContent({
                ...linkResources,
                add_to_library:
                  linkResources.add_to_library === true ? "1" : "0",
              })
            )
              .unwrap()
              .then((result: any) => {
                setLinks((prev: any) => [
                  ...prev,
                  { ...result?.resource?.[0] },
                ]);
                setLinkResources({
                  name: "",
                  url: "",
                  add_to_library: false,
                });
              });
          }}
          label="Submit"
          className="w-30 m-3"
        />
      </Box>
    </Box>
  );
};

export default ExLink;
