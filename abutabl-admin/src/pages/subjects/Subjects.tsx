import { Box, Grid, Typography, Divider, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import Pagination from "../../components/shared/Pagination";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteSubject,
  getSubjectsList,
} from "../../redux/reducers/subjectsReducer";
import ActionDropdown from "../../components/shared/ActionDropdown";
import LoadingWrapper from "@/components/shared/LoadingWrapper";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const Subjects = () => {

  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsSubjects = permissionState?.permissions?.subjects;

  const editSubjects = permissionsSubjects?.find((permission:any) => permission['edit-subjects'] === "1")
  const deleteSubjects = permissionsSubjects?.find((permission:any) => permission['delete-subjects'] === "1")
  const addSubjects = permissionsSubjects?.find((permission: any) => permission["add-subjects"] === "1")
  const viewSubjects = permissionsSubjects?.find((permission: any) => permission["view-subjects"] === "1")
  const activationSubjects = permissionsSubjects?.find((permission: any) => permission["activation-subjects"] === "1")


  const [active, setActive] = useState<number | null>(null);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const subjectState = useSelector((state: RootState) => state?.subjects);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const defaultLogo = require("../../assets/Logo.png");
  // ------------- functions ---------------
  const handleChangePage = async (page: number) => {
    setIsLoading(true);
    await dispatch(getSubjectsList({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await dispatch(getSubjectsList({ paginate: 10 }));
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    setRows({
      ...subjectState?.subjectsList,
    });
  }, [subjectState?.subjectsList]);

  // Check if image URL is valid (not empty, not just a directory path)
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Check if URL ends with just /storage/ or similar directory paths
    if (url.endsWith('/storage/') || url.endsWith('/storage') || url.trim() === '') {
      return false;
    }
    // Check if URL has a file extension or contains a filename
    const hasFilename = url.split('/').pop()?.includes('.') || false;
    return hasFilename;
  };

  const handleImageError = (subjectId: number) => {
    setImageErrors((prev) => ({
      ...prev,
      [subjectId]: true,
    }));
  };

  const getImageSrc = (item: any) => {
    const hasError = imageErrors[item.id];
    const isValid = isValidImageUrl(item.photo);
    
    if (!isValid || hasError || !item.photo) {
      return defaultLogo;
    }
    return item.photo;
  };
  const [filter, setFilter] = useState({
    search: "",
  });
  return (
    <Box>
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
        <Typography variant="h5">All Subjects</Typography>{" "}

        {
          addSubjects &&
          <Button
            icon={AddCircleOutlineRoundedIcon}
            label="New Subject"
            className="w-30 m-3"
            onClick={() => {
              navigate("/subjects/add-subject");
            }}
          />
        }
      </Box>
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
        <Box sx={{ width: "100%", p: 3 }}>
        <Grid
            container
            columnGap={5}
            // sx={{ bgcolor: "#F7F9FA", p: 2, justifyContent: "center" }}
          >
            <Grid item xs={12} sm={5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Subject name</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="roleName"
                  name="roleName"
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
                label="Filter"
                className="w-40 mt-6"
                onClick={() => {
                   dispatch(getSubjectsList({ paginate: 10,search: filter.search }));
                  // dispatch(getRoleList({ paginate: 10, search: filter.search}));
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3.5}>
            <Typography
                component={"p"}
                sx={{
                  color: "#1EBBA3",
                  fontWeight: "400",
                  mx: 4,
                  cursor: "pointer",
                }}
                onClick={async ()=>{
                  await setFilter({search:''})
                  await dispatch(getSubjectsList({ paginate: 10,search: '' }));
                }}
              >
                Clear filters
              </Typography>
            </Grid>
            
            {/* <Grid item xs={12} sm={5}>
              <div className="flex flex-col gap-0 mb-4">
                <label className="text-sm font-semibold mb-1">Status</label>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  size="small"
                  id="status"
                  placeholder="Active"
                  name="status"
                  sx={{ margin: 0, padding: 0, bgcolor: "#fff" }}
                />
              </div>
            </Grid> */}
          </Grid>
          {/* <Searchbar /> */}
        </Box>
        <Divider />
        <LoadingWrapper isLoading={isLoading}>
          <Grid sx={{ p: 3 }} container spacing={2}>
            {rows?.subjects?.data?.map((item: any, index: any) => {
              return (
                <Grid
                  key={index}
                  onClick={() => navigate(`/subjects/${item.id}`)}
                  item
                  md={3}
                  xs={12}
                  sm={6}
                >
                  <div
                    onClick={() => {
                      setActive(item.id);
                    }}
                    key={item.id}
                    className={`flex p-4 flex-col border border-grayDarkHoverd justify-start items-start cursor-pointer rounded-xl md:w-76 ${
                      active === item.id
                        ? " bg-veryLightprimary border-primary"
                        : " hover:bg-veryLightGray"
                    }`}
                  >
                    {
                      (editSubjects || deleteSubjects) &&
                      <ActionDropdown
                        color={"#c1c1c1"}
                        id={item.id}
                        actions={[
                          editSubjects ?
                          {
                            name: "Edit",
                            action: () => {
                              navigate(`/subjects/edit/${item.id}`);
                            },
                          }
                          :
                          ''
                          ,
                          deleteSubjects ?
                          {
                            name: "Delete",
                            action: () => {
                              setSubjectToDelete(item);
                              setDeleteModalOpen(true);
                            },
                          }
                          :
                          ''
                          ,
                        ]}
                      />
                    }
                    <img
                      className="md:w-30 h-72 self-center py-10"
                      src={getImageSrc(item)}
                      alt={item?.name || "Subject"}
                      onError={() => handleImageError(item.id)}
                      style={{ objectFit: "contain" }}
                    />
                    <div className="p-2">
                      <p className="font-bold">{item?.name}</p>
                      <p className="text-gray">
                        {item?.units_count} unit - {item?.lessons_count} lessons
                      </p>
                    </div>
                  </div>
                </Grid>
              );
            })}
          </Grid>
          <Pagination
            from={rows?.subjects?.from}
            to={rows?.subjects?.to}
            lastPage={rows?.subjects?.last_page}
            currentPage={rows?.subjects?.current_page}
            total={rows?.subjects?.total}
            perPage={rows?.subjects?.per_page}
            handleChangePage={handleChangePage}
          />
        </LoadingWrapper>
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubjectToDelete(null);
        }}
        item="subject"
        onConfirm={async () => {
          if (subjectToDelete) {
            await dispatch(deleteSubject({ id: subjectToDelete.id }));
            await dispatch(
              getSubjectsList({
                paginate: 10,
                page: currentPage,
              })
            );
          }
        }}
      />
    </Box>
  );
};

export default Subjects;
