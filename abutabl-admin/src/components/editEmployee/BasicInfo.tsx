import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";
import { useLocation } from "react-router-dom";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const BasicInfo = ({ formik, values, onChange }: InfoProps) => {
  const location = useLocation();
  const isEmployee = location.pathname.includes("employee");
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Basic information
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
              Full Name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="full_name_en"
              onChange={onChange}
              value={values.full_name_en}
              name="full_name_en"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          {/* <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Second name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="lname_en"
              onChange={onChange}
              value={values.lname_en}
              name="lname_en"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div> */}
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Email
            </label>
            <TextField
              margin="normal"
              fullWidth
              size="small"
              id="email"
              onChange={onChange}
              value={values.email}
              name="email"
              placeholder="example@example.com"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          {!isEmployee && (
            <>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Date of birth
                </label>

                <CustomedDatePicker
                  formik={formik}
                  id="birthday"
                  name="birthday"
                />
              </div>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Experience/specialization ( English )
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="specialization_en"
                  onChange={onChange}
                  value={values.specialization_en}
                  name="specialization_en"
                  placeholder="Type experience"
                  sx={{ margin: 0, padding: 0 }}
                />
              </div>
            </>
          )}
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Full Name [Arabic]
            </label>
            <TextField
              margin="normal"
              fullWidth
              size="small"
              id="full_name_ar"
              onChange={onChange}
              value={values.full_name_ar}
              name="full_name_ar"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          {/* <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Second name [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="lname_ar"
              onChange={onChange}
              value={values.lname_ar}
              name="lname_ar"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div> */}
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Phone
            </label>
            <TextField
              margin="normal"
              fullWidth
              size="small"
              id="phone"
              onChange={onChange}
              value={values.phone}
              name="phone"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          {!isEmployee && (
            <>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Gender</label>

                <SelectBox
                  values={[
                    {
                      label: "Male",
                      value: "male",
                    },
                    {
                      label: "Female",
                      value: "female",
                    },
                  ]}
                  onChange={onChange}
                  id="gender"
                  name="gender"
                  value={values.gender}
                />
              </div>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  Experience/specialization ( Arabic ){" "}
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="specialization_ar"
                  name="specialization_ar"
                  onChange={onChange}
                  value={values.specialization_ar}
                  placeholder="Type experience"
                  sx={{ margin: 0, padding: 0 }}
                />
              </div>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
