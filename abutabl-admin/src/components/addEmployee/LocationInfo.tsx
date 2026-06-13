import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect } from "react";
import {
  getCityList,
  getGovernmentList,
} from "../../redux/reducers/commonReducer";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import SelectBox from "../shared/SelectBox";
import { selectBoxOptions } from "../../utils/functions";

type InfoProps = {
  values: any;
  onChange: any;
};

const LocationInfo = ({ values, onChange }: InfoProps) => {
  // -------------- hooks -------------
  const commonState = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch();

  // ------------- side effects --------------
  useEffect(() => {
    dispatch(getGovernmentList());
  }, []);

  useEffect(() => {
    dispatch(
      getCityList({
        govern_id: values?.govern_id ? values?.govern_id : 120,
      })
    );
  }, [values?.govern_id]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Location information
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Governments <span className="text-red">*</span>
            </label>

            <SelectBox
              values={
                commonState?.governmentList?.length > 0
                  ? selectBoxOptions(commonState?.governmentList, "name_en")
                  : []
              }
              onChange={onChange}
              id="govern_id"
              name="govern_id"
              value={values.govern_id}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Address details ( English )
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              id="address_en"
              onChange={onChange}
              value={values.address_en}
              name="address_en"
              placeholder="Type Address"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              City <span className="text-red">*</span>
            </label>
            <SelectBox
              values={
                commonState?.cityList?.length > 0
                  ? selectBoxOptions(commonState?.cityList, "city")
                  : []
              }
              onChange={onChange}
              id="city_id"
              name="city_id"
              value={values.city_id}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Address details ( Arabic ){" "}
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              id="address_ar"
              onChange={onChange}
              value={values.address_ar}
              name="address_ar"
              placeholder="Type Address"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default LocationInfo;
