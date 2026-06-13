import { Box, Grid, Divider, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteSheet,
  getSheetsDetalis,
} from "../../redux/reducers/subjectsReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useTranslation } from "react-i18next";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const Worksheets = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["view-worksheets"] === "1"
  );
  const addworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["add-worksheets"] === "1"
  );
  const exportworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["export-worksheets"] === "1"
  );
  const deleteworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["delete-worksheets"] === "1"
  );
  const editworksheets = permissionState?.permissions?.worksheets?.find(
    (permission: any) => permission["edit-worksheets"] === "1"
  );

  // -------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const SheetsState = useSelector((state: RootState) => state?.subjects);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const param = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<any>(null);

  // Sheets list from API: payload is { status, sheets: [...] }, use array directly
  const sheetsList = Array.isArray(SheetsState?.sheets?.sheets)
    ? SheetsState.sheets.sheets
    : [];

  // ------------- side effects ---------------
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await dispatch(
        getSheetsDetalis({ search: param.search, subject_id: param.id })
      );
      setIsLoading(false);
    })();
  }, []);

  const [filter, setFilter] = useState({
    search: "",
  });
  return (
    <Box>
      <Box
        sx={{
          m: 3,
          boxShadow: "unset",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            p: 3,
          }}
        >
          {/* <Searchbar /> */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {isFiltered && (
              <Typography
                component={"p"}
                sx={{
                  color: "#1EBBA3",
                  fontWeight: "400",
                  mx: 4,
                  cursor: "pointer",
                }}
                onClick={() => {
                  dispatch(
                    getSheetsDetalis({ search: "", subject_id: param.id })
                  );
                  setFilter({ search: "" });
                }}
              >
                {t("clearFilters")}
              </Typography>
            )}
            {addworksheets && (
              <Button
                onClick={() => navigate(`/subjects/add-worksheet/${param.id}`)}
                label={t("addNewResource")}
                className="w-30 m-3"
              />
            )}
            {/* {
              exportworksheets &&
            <Button label="Export" type="bordered" className="w-30 m-3" />
            } */}
            <Button
              label=""
              type="bordered"
              icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
              onClick={() => {
                setIsFiltered(!isFiltered);
              }}
              // setFilter({search:''})
              className="w-30 m-3"
            />
          </Box>
        </Box>
        <Divider />
        {isFiltered && (
          <Grid
            container
            columnGap={5}
            sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "flex-start" }}
          >
            <Grid item xs={12} sm={5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">
                  {t("worksheetName")}
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="worksheetName"
                  name="worksheetName"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                  value={filter.search}
                  onChange={(e: any) => {
                    setFilter((prev: any) => {
                      return {
                        ...prev,
                        search: e.target.value,
                      };
                    });
                  }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <Button
                label={t("filter")}
                className="w-40 mt-6"
                onClick={() => {
                  dispatch(
                    getSheetsDetalis({
                      subject_id: param.id,
                      search: filter.search,
                    })
                  );
                }}
              />
            </Grid>
          </Grid>
        )}
        <Grid container sx={{ p: 3, flexDirection: "row", gap: 4 }}>
          {sheetsList.map((item: any, index: any) => {
            const displayName =
              (typeof lang === "string" && !lang.startsWith("en")
                ? item.name_ar
                : item.name_en) ??
              item.name_ar ??
              item.name_en ??
              item.title ??
              "—";
            return (
              <Grid item xs={12} sm={2.7}>
                <div
                  className="lesson-card border rounded-lg  border-lightGray cursor-pointer hover:border-green hover:bg-lightGreen flex flex-col items-end   gap-1"
                  onClick={() => {
                    viewworksheets &&
                      window.open(`SheetView/${item.id}`, "_blank");
                  }}
                >
                  <ActionDropdown
                    color={"#c1c1c1"}
                    id={item.id}
                    actions={[
                      editworksheets
                        ? {
                            name: t("edit"),
                            action: () => {
                              navigate(
                                `/subjects/edit-worksheet/${param.id}/${item.id}`
                              );
                            },
                          }
                        : "",
                      deleteworksheets
                        ? {
                            name: t("delete"),
                            action: () => {
                              setSheetToDelete(item);
                              setDeleteModalOpen(true);
                            },
                          }
                        : "",
                    ]}
                  />
                  <div className="lesson-card__icon rounded-md  flex justify-center items-center">
                    <img
                      className="w-full h-full"
                      src={item.background}
                      alt="bookmark"
                    />
                  </div>
                  <p className="font-semibold pt-2 w-full text-center">
                    {displayName}
                  </p>
                  <p className="text-gray text-sm pb-1 w-full text-center">
                    {item.size / 1024 > 1024
                      ? Math.round(item.size / 1024 / 1024) + " Mb"
                      : Math.round(item.size / 1024) + " Kb"}
                  </p>
                </div>
              </Grid>
            );
          })}
        </Grid>

        <Pagination />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSheetToDelete(null);
        }}
        onConfirm={async () => {
          if (sheetToDelete) {
            await dispatch(deleteSheet({ id: sheetToDelete.id }));
            await dispatch(
              getSheetsDetalis({
                subject_id: param.id,
              })
            );
          }
        }}
        item="Sheet"
      />
    </Box>
  );
};

export default Worksheets;
