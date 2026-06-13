import { Box, Grid, Divider, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import DataTable from "../shared/DataTable";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectBox from "../shared/SelectBox";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../shared/SwitchBox";
import ActionDropdown from "../shared/ActionDropdown";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  deleteQuiz,
  getQuizzesformSubject,
} from "@/redux/reducers/subjectsReducer";
import { useTranslation } from "react-i18next";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const Quizzes = () => {
  const { t } = useTranslation();

  const columns = [
    {
      name: t("quizname"),
      selector: (row: any) => row.title,
      width: "40%",
    },
    {
      name: t("quiz_code"),
      selector: (row: any) => row.code,
      width: "40%",
    },
    {
      name: t("creation_date"),
      selector: (row: any) => row.created_at,
      width: "20%",
    },
    {
      name: t("due_date"),
      selector: (row: any) => row.due_date,
      width: "20%",
    },
    {
      name: t("status"),
      selector: (row: any) => row.status,
      width: "10%",
    },
    {
      name: t("action"),
      selector: (row: any) => row.action,
      width: "6%",
    },
  ];
  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewquizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["view-quizes"] === "1"
  );
  const addquizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["add-quizes"] === "1"
  );
  const deletequizes = permissionState?.permissions?.quizes?.find(
    (permission: any) => permission["delete-quizes"] === "1"
  );

  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const quizState = useSelector((state: RootState) => state.subjects.quizzes);
  const param = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [filter, setFilter] = useState({
    search: "",
  });

  // ------------- functions ---------------
  const handleChangePage = (page: number) => {
    dispatch(
      getQuizzesformSubject({ paginate: 10, page, subject_id: param.id })
    );
  };

  const handleRowClick = (row: any) => {
    viewquizes && navigate(`/subjects/quiz/${row.id}`);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(
      getQuizzesformSubject({ paginate: 10, page: 1, subject_id: param.id })
    );
  }, []);

  // console.log("quizState",quizState);

  useEffect(() => {
    const tableData = quizState?.data?.map((item: any) => {
      return {
        ...item,

        status: (
          <Typography
            sx={{
              p: 1,
              px: 2,
              borderRedius: "5px",
              color: "#1eba9f",
              bgcolor: "#FFFA",
            }}
          >
            {item.status}
          </Typography>
        ),
        action: (
          <ActionDropdown
            id={item.id}
            actions={[
              // deletequizes ?
              {
                name: t("delete"),
                action: () => {
                  setQuizToDelete(item);
                  setDeleteModalOpen(true);
                },
              },
              {
                name: t("edit"),
                action: () => {
                  navigate(`/subjects/${param.id}/edit-quiz/${item.id}`);
                },
              },
              // : '',
            ]}
          />
        ),
      };
    });

    setRows({
      ...quizState,
      quizzes: tableData,
    });
  }, [quizState]);

  return (
    <Box>
      <Box
        sx={{
          my: 2,
          mr: 2,
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
            // justifyContent: "space-between",
            alignItems: "center",
            justifyContent: "flex-end",
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
                onClick={async () => {
                  await setFilter({
                    search: "",
                  });
                  await dispatch(
                    getQuizzesformSubject({
                      paginate: 10,
                      page: 1,
                      subject_id: param.id,
                      search: "",
                    })
                  );
                }}
              >
                {t("clearfilters")}
              </Typography>
            )}
            {addquizes && (
              <Button
                label={t("addquiz")}
                className="w-30 m-3"
                onClick={() => navigate(`/subjects/${param.id}/add-quiz`)}
              />
            )}
            <Button
              label=""
              type="bordered"
              icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
              onClick={() => {
                setIsFiltered(!isFiltered);
              }}
              className="w-30 m-3"
            />
          </Box>
        </Box>
        <Divider />
        {isFiltered && (
          <Grid
            container
            columnGap={5}
            sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
          >
            <Grid item xs={12} sm={3.5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">{t("quizname")}</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="quizName"
                  name="quizName"
                  value={filter.search}
                  onChange={(e: any) => {
                    setFilter((prev: any) => {
                      return {
                        ...prev,
                        search: e.target.value,
                      };
                    });
                  }}
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <Button
                label={t("filter")}
                className="w-40 mt-6"
                onClick={() => {
                  dispatch(
                    getQuizzesformSubject({
                      paginate: 10,
                      page: 1,
                      subject_id: param.id,
                      search: filter.search,
                    })
                  );
                }}
              />
            </Grid>
          </Grid>
        )}
        <DataTable
          data={rows.quizzes}
          columns={columns}
          handleRowClick={handleRowClick}
        />
        <Pagination
          from={rows?.from}
          to={rows?.to}
          lastPage={rows?.last_page}
          currentPage={rows?.current_page}
          total={rows?.total}
          perPage={rows?.per_page}
          handleChangePage={handleChangePage}
        />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setQuizToDelete(null);
        }}
        onConfirm={async () => {
          if (quizToDelete) {
            await dispatch(deleteQuiz(quizToDelete.id));
            await dispatch(
              getQuizzesformSubject({
                paginate: 10,
                page: 1,
                subject_id: param.id,
              })
            );
          }
        }}
        item="Quiz"
      />
    </Box>
  );
};

export default Quizzes;
