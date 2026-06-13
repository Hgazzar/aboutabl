import { Box, Grid, Typography, TextField, Divider } from "@mui/material";
import React, { useEffect } from "react";
import Button from "../../components/shared/Button";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getProfile, updateProfile } from "@/redux/reducers/profileReducer";
import ProfilePictureCard from "../../components/shared/ProfilePictureCard";
import CustomedDatePicker from "../../components/shared/DatePicker";
import SelectBox from "../../components/shared/SelectBox";

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, loading, updateLoading } = useSelector(
    (state: RootState) => state.profile
  );

  const formik = useFormik({
    initialValues: {
      photo: "",
      full_name_en: "",
      full_name_ar: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      birthday: "",
      gender: "",
      specialization_en: "",
      specialization_ar: "",
      address_en: "",
      address_ar: "",
    },
    onSubmit: async (values) => {
      const hasFile = values.photo && typeof values.photo !== "string";
      if (hasFile) {
        const formData = new FormData();
        formData.append("full_name_en", values.full_name_en);
        formData.append("full_name_ar", values.full_name_ar);
        formData.append("email", values.email);
        formData.append("phone", values.phone);
        formData.append("username", values.username);
        if (values.password) formData.append("password", values.password);
        if (values.birthday) formData.append("birthday", values.birthday);
        if (values.gender) formData.append("gender", values.gender);
        if (values.specialization_en)
          formData.append("specialization_en", values.specialization_en);
        if (values.specialization_ar)
          formData.append("specialization_ar", values.specialization_ar);
        if (values.address_en) formData.append("address_en", values.address_en);
        if (values.address_ar)
          formData.append("address_ar", values.address_ar);
        if ((values.photo as unknown) instanceof File) {
          formData.append("photo", values.photo as unknown as File);
        }
        await dispatch(updateProfile(formData));
      } else {
        const payload: Record<string, string> = {
          full_name_en: values.full_name_en,
          full_name_ar: values.full_name_ar,
          email: values.email,
          phone: values.phone,
          username: values.username,
        };
        if (values.password) payload.password = values.password;
        if (values.birthday) payload.birthday = values.birthday;
        if (values.gender) payload.gender = values.gender;
        if (values.specialization_en)
          payload.specialization_en = values.specialization_en;
        if (values.specialization_ar)
          payload.specialization_ar = values.specialization_ar;
        if (values.address_en) payload.address_en = values.address_en;
        if (values.address_ar) payload.address_ar = values.address_ar;
        await dispatch(updateProfile(payload));
      }
      dispatch(getProfile());
    },
  });

  const userInfo = profile?.userInfo?.[0];

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!userInfo) return;
    formik.setValues({
      photo: userInfo.photo || "",
      full_name_en: userInfo.name_en ?? userInfo.name ?? "",
      full_name_ar: userInfo.name_ar ?? "",
      email: userInfo.email ?? "",
      phone: userInfo.phone ?? "",
      username: userInfo.username ?? "",
      password: "",
      birthday: userInfo.birthday ?? "",
      gender: userInfo.gender ?? "",
      specialization_en: userInfo.specialize ?? "",
      specialization_ar: userInfo.specialize_ar ?? "",
      address_en: userInfo.address_en ?? "",
      address_ar: userInfo.address_ar ?? "",
    });
  }, [userInfo]);

  if (loading && !userInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",
          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">Profile</Typography>
        <Button
          onClick={() => formik.handleSubmit()}
          label={updateLoading ? "Saving…" : "Save changes"}
          className="w-30"
          disabled={updateLoading}
        />
      </Box>
      <Grid container sx={{ m: 3 }} spacing={2} gap={2}>
        <Grid
          item
          xs={11}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <ProfilePictureCard formik={formik} id="photo" />
        </Grid>
        <Grid
          item
          xs={11}
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
            <Typography
              component="p"
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Basic information
            </Typography>
            <Divider />
            <Box sx={{ display: "flex", flexDirection: "row", p: 3, gap: 3, flexWrap: "wrap" }}>
              <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Full Name [English] <span className="text-red">*</span>
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="full_name_en"
                    onChange={formik.handleChange}
                    value={formik.values.full_name_en}
                    name="full_name_en"
                    placeholder="e.g. John Doe"
                    sx={{ margin: 0 }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Email <span className="text-red">*</span>
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                    name="email"
                    placeholder="example@example.com"
                    sx={{ margin: 0 }}
                  />
                </div>
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
                    Experience/specialization (English)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="specialization_en"
                    onChange={formik.handleChange}
                    value={formik.values.specialization_en}
                    name="specialization_en"
                    placeholder="Type experience"
                    sx={{ margin: 0 }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Address (English)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="address_en"
                    onChange={formik.handleChange}
                    value={formik.values.address_en}
                    name="address_en"
                    multiline
                    sx={{ margin: 0 }}
                  />
                </div>
              </Box>
              <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Full Name [Arabic] <span className="text-red">*</span>
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="full_name_ar"
                    onChange={formik.handleChange}
                    value={formik.values.full_name_ar}
                    name="full_name_ar"
                    placeholder="الاسم الكامل"
                    sx={{ margin: 0 }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Phone <span className="text-red">*</span>
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="phone"
                    onChange={formik.handleChange}
                    value={formik.values.phone}
                    name="phone"
                    sx={{ margin: 0 }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">Gender</label>
                  <SelectBox
                    values={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                    ]}
                    onChange={formik.handleChange}
                    id="gender"
                    name="gender"
                    value={formik.values.gender}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Experience/specialization (Arabic)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="specialization_ar"
                    onChange={formik.handleChange}
                    value={formik.values.specialization_ar}
                    name="specialization_ar"
                    placeholder="التخصص"
                    sx={{ margin: 0 }}
                  />
                </div>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Address (Arabic)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="address_ar"
                    onChange={formik.handleChange}
                    value={formik.values.address_ar}
                    name="address_ar"
                    multiline
                    sx={{ margin: 0 }}
                  />
                </div>
              </Box>
            </Box>
          </Box>

          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
            <Typography
              component="p"
              sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
            >
              Credentials
            </Typography>
            <Divider />
            <Box sx={{ display: "flex", flexDirection: "row", p: 3, gap: 3, flexWrap: "wrap" }}>
              <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    Username <span className="text-red">*</span>
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="username"
                    onChange={formik.handleChange}
                    value={formik.values.username}
                    name="username"
                    placeholder="Username"
                    sx={{ margin: 0 }}
                  />
                </div>
              </Box>
              <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                <div className="flex flex-col gap-0 mb-4">
                  <label className="text-sm font-semibold mb-1">
                    New password (leave blank to keep current)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    id="password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    sx={{ margin: 0 }}
                  />
                </div>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default Profile;
