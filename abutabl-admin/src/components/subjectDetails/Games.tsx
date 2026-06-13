import {
  Box,
  Grid,
  Divider,
  Slider,
  Typography,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import Searchbar from "../shared/Searchbar";
import Pagination from "../shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import LoadingWrapper from "@/components/shared/LoadingWrapper";
import {
  deleteGame,
  getGamesDetalis,
} from "../../redux/reducers/subjectsReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import Placeholder from "../shared/Placeholder";
import { useTranslation } from "react-i18next";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const Games = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const GameState = useSelector((state: RootState) => state?.subjects);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<any>(null);

  const param = useParams();

  const permissionState = useSelector((state: RootState) => state.permissions);
  const viewgames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["view-games"] === "1"
  );
  const addgames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["add-games"] === "1"
  );
  const exportgames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["export-games"] === "1"
  );
  const deletegames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["delete-games"] === "1"
  );
  const editgames = permissionState?.permissions?.games?.find(
    (permission: any) => permission["edit-games"] === "1"
  );

  // ------------- side effects ---------------
  const handleChangePage = async (page: number) => {
    setIsLoading(true);
    await dispatch(getGamesDetalis({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await dispatch(getGamesDetalis({ subject_id: param.id }));
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    setRows({
      ...GameState?.games,
    });
  }, [GameState?.games]);
  
  const [filter, setFilter] = useState({
    search: "",
  });
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
            p: 3,
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {/* <Searchbar />{" "} */}
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
                    getGamesDetalis({ subject_id: param.id, search: "" })
                  );
                  setFilter({ search: "" });
                }}
              >
                {t("clear_filters")}
              </Typography>
            )}
            {addgames && (
              <Button
                onClick={() => navigate(`/subject/add-game/${param.id}`)}
                label={t("add_new_game")}
                className="w-30 m-3"
              />
            )}
            {/* {
              exportgames &&
            <Button label="Export" type="bordered" className="w-30 m-3" />
            } */}
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
                <label className="text-sm font-semibold mb-1">
                  {t("game_name")}
                </label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="gameName"
                  name="gameName"
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
                    getGamesDetalis({
                      subject_id: param.id,
                      search: filter.search,
                    })
                  );
                }}
              />
            </Grid>
          </Grid>
        )}

        <Grid sx={{ p: 3 }} container spacing={2}>
          {!rows?.games?.data?.length ? (
            <div className="flex flex-col gap-4 items-center justify-center w-full pb-20">
              <Placeholder name="Games" />
            </div>
          ) : (
            rows?.games?.data?.map((item: any, index: any) => {
              return (
                <Grid item md={2} xs={12} sm={6}>
                  <div
                    className={` p-4 border border-grayDarkHoverd justify-start items-start cursor-pointer rounded-xl md:w-76 ${
                      active === item.id
                        ? " bg-veryLightprimary border-primary"
                        : " hover:bg-veryLightGray"
                    }`}
                    onClick={() => {
                      viewgames && window.open(`GameView/${item.id}`, "_blank");
                    }}
                  >
                    <div
                      onClick={() => setActive(item.id)}
                      key={item.id}
                      className="flex flex-col"
                    >
                      <ActionDropdown
                        color={"#c1c1c1"}
                        className="self-end"
                        id={item.id}
                        actions={[
                          editgames
                            ? {
                                name: t("edit"),
                                action: () => {
                                  navigate(
                                    `/subject/edit-game/${param.id}/${item.id}`
                                  );
                                },
                              }
                            : "",
                          deletegames
                            ? {
                                name: t("delete"),
                                action: () => {
                                  setGameToDelete(item);
                                  setDeleteModalOpen(true);
                                },
                              }
                            : "",
                        ]}
                      />

                      <img
                        className="md:w-36 h-44 self-center py-10 object-contain"
                        src={item.background}
                        alt="login interface"
                      />
                      <div className=" ">
                        <p className="text-black flex justify-center">
                          {item.name}
                        </p>
                        {/* <div className="flex flex-row justify-between ">
                          <Slider defaultValue={item.progress} disabled />
                          <label className="ml-2 text-gray">
                            {item.progress}%
                          </label>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </Grid>
              );
            })
          )}
        </Grid>
        <Pagination
          from={rows?.games?.from}
          to={rows?.games?.to}
          lastPage={rows?.games?.last_page}
          currentPage={rows?.games?.current_page}
          total={rows?.games?.total}
          perPage={rows?.games?.per_page}
          handleChangePage={handleChangePage}
        />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGameToDelete(null);
        }}
        onConfirm={async () => {
          if (gameToDelete) {
            await dispatch(deleteGame({ id: gameToDelete.id }));
            await dispatch(
              getGamesDetalis({
                subject_id: param.id,
              })
            );
          }
        }}
        item="Game"
      />
    </Box>
  );
};

export default Games;
