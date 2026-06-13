import { Box, Grid, Typography, Divider, Card } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import PendingIcon from "@mui/icons-material/Pending";
import SwitchBox from "../../components/shared/SwitchBox";
import DataTable from "../../components/shared/DataTable";
import AddIcon from "@mui/icons-material/Add";
import ActionDropdown from "../../components/shared/ActionDropdown";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getUnitsformSubject } from "../../redux/reducers/subjectsReducer";
import Placeholder from "../../components/shared/Placeholder";
import AddUnitModal from "../../components/modals/AddUnitModal";
import AddLessonModal from "../../components/modals/AddLessonModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import AddContentModal from "../../components/modals/AddContentModal";
import ContentStatusModal from "../../components/modals/ContentStatusModal";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Searchbar from "../../components/shared/Searchbar";
import TextEditor from "../../components/shared/TextEditor";

const columns = [
  {
    name: "Sort",
    selector: (row: any) => row.sort,
    width: "10%",
  },
  {
    name: "File name",
    selector: (row: any) => row.file,
    width: "25%",
  },
  {
    name: "Type",
    selector: (row: any) => row.type,
    width: "10%",
  },

  {
    name: "Created at",
    selector: (row: any) => row.creatat,
    width: "15%",
  },
  {
    name: "Created by",
    selector: (row: any) => row.creatby,
    width: "15%",
  },
  {
    name: "status",
    selector: (row: any) => row.status,
    width: "10%",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    width: "10%",
  },
];
const data = [
  {
    id: 1,
    sort: (
      <img
        className="w-6 h-6"
        src={require("../../assets/menu.png")}
        alt="drag and drop icon"
      />
    ),
    file: "Lessson 1 introduction",
    type: "Video",
    createAt: "17 jun 2014",
    createBy: "ahmed ",
    status: <SwitchBox />,
    action: (
      <ActionDropdown
        actions={[
          {
            name: "Edit unit name",
          },
          {
            name: "Assign to student",
          },
          {
            name: "Change status",
            action: () => {},
          },
        ]}
      />
    ),
  },
  {
    id: 2,
    sort: (
      <img
        className="w-6 h-6"
        src={require("../../assets/menu.png")}
        alt="drag and drop icon"
      />
    ),
    file: "Lessson 1 introduction",
    type: "Video",
    createAt: "17 jun 2014",
    createBy: "ahmed ",
    status: <SwitchBox />,
    action: (
      <ActionDropdown
        actions={[
          {
            name: "Edit unit name",
          },
          {
            name: "Assign to student",
          },
          {
            name: "Change status",
            action: () => {},
          },
        ]}
      />
    ),
  },
];
const Tickets = () => {
  const param = useParams();
  const dispatch = useDispatch();
  const [isFiltered, setIsFiltered] = useState(false);
  const [open, setOpen] = React.useState({
    unitModal: false,
    lessonModal: false,
    deleteContentModal: false,
    contentModal: false,
    contentStatusModal: false,
  });
  const subjectUnitState = useSelector(
    (state: RootState) => state.subjects.units
  );
  const [lessons, setLessons] = useState<any>({});
  const [action, setAction] = useState<"add" | "edit">("add");
  // ------------ functions --------------
  const handleOpen = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: true }));
  const handleClose = (modal: any) =>
    setOpen((prev: any) => ({ ...prev, [modal]: false }));

  // ------------ side effects -------------
  // useEffect(() => {
  //   dispatch(getUnitsformSubject({ data: { paginate: 10 }, id: param.id }));
  // }, []);

  // useEffect(() => {
  //   if (subjectUnitState?.units?.length) {
  //     setLessons(subjectUnitState?.units[0]);
  //   }
  // }, [subjectUnitState?.units]);

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
        <Typography variant="h5">Tickets</Typography>{" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => {
              setAction("add");
              handleOpen("unitModal");
            }}
            label="New Ticket"
            icon={AddIcon}
            className="w-30 h-30"
          />
        </Box>
      </Box>
      <Grid container sx={{ m: 3 }} gap={3}>
        <Grid
          item
          xs={11}
          md={3.5}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                p: 3,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                component={"p"}
                sx={{ fontSize: "18px", fontWeight: "600" }}
              >
                Tickets{" "}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                px: 3,
              }}
            >
              <Searchbar />
              <Button
                label=""
                type="bordered"
                icon={!isFiltered ? FilterAltOutlinedIcon : CloseIcon}
                onClick={() => setIsFiltered(!isFiltered)}
                className="w-30 m-3"
              />
            </Box>
            <Divider />
            {[
              {
                Text: "T # want to Create an account in..",
                title: "Created by :Future Language school",
                time: "12m",
              },
              {
                Text: "T # want to Create an account in..",
                title: "Created by :Future Language school",
                time: "12m",
              },
              {
                Text: "T # want to Create an account in..",
                title: "Created by :Future Language school",
                time: "12m",
              },
            ].map((item: any, index: any) => (
              <Box sx={{}}>
                <div className="lesson-card border p-5   border-lightGray cursor-pointer hover:border-green hover:bg-lightGreen flex flex-row items-start gap-1">
                  <div className="lesson-card__icon rounded-full p-2 m-1 bg-white shadow-md flex justify-center items-center">
                    <img
                      src={require("../../assets/Schoollogo30.png")}
                      alt="book"
                      className="text-Orange "
                    />
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-dark font-semibold pt-2">
                        {item.Text}
                      </p>
                      <p className="text-gray text-sm pt-2">{item.title}</p>
                      <Typography
                        sx={{
                          p: 1,
                          borderRedius: "5px",
                          color: "#5E4DB2",
                          bgcolor: "#F3F0FF",
                          width: "fit-content",
                        }}
                      >
                        New
                      </Typography>
                    </div>
                    <div>
                      <p className="text-gray text-sm ">{item.time}</p>
                    </div>
                  </div>
                </div>
              </Box>
            ))}
          </Box>
        </Grid>
        <Grid
          item
          xs={11}
          md={7.5}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224", mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                p: 3,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  component={"p"}
                  sx={{ fontSize: "18px", fontWeight: "400" }}
                >
                  Ticket Details{" "}
                </Typography>
              </Box>
              <Button label="Close ticket" type="danger" className="w-30 m-3" />
            </Box>
            <Box
              sx={{
                m: 3,
                boxShadow: "unset",

                bgcolor: "#fff",
              }}
            >
              <Box>
                <div className="flex flex-row items-start gap-1">
                  <div className="p-2 m-1 flex justify-center items-center flex-row">
                    <img
                      src={require("../../assets/Schoollogo30.png")}
                      alt="book"
                      className="text-Orange "
                    />
                    <div className="flex justify-center items-center flex-col">
                      <p className="text-dark font-semibold pt-2">
                        {" "}
                        Future Language school
                      </p>
                      <p className="text-gray text-sm pt-2"> Future@edu.com</p>
                    </div>
                  </div>
                </div>
              </Box>
            </Box>
            <Box
              sx={{
                m: 3,
              }}
            >
              <Typography sx={{ fontSize: "18px", fontWeight: "600", m: 2 }}>
                {" "}
                Create an account issue
              </Typography>
              <Typography sx={{ color: "gray", m: 2 }}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam
                animi fugiat officia possimus voluptas incidunt labore,
                laudantium eius, non illum deserunt, facere mollitia at
                quibusdam! Praesentium eum perspiciatis blanditiis assumenda!
              </Typography>
            </Box>
            <Box
              sx={{
                m: 3,
                boxShadow: "unset",

                bgcolor: "#fff",
              }}
            >
              <div className="flex flex-row items-start gap-1">
                <div
                  className="p-2 m-1 flex justify-center items-center flex-row cursor-pointer border border-lightGray rounded-md
                "
                >
                  <img
                    src={require("../../assets/Documenticon.png")}
                    alt="book"
                    className="text-Orange "
                  />
                  <div className="flex justify-center items-center flex-col m-3">
                    <p className="text-dark font-semibold pt-2"> Document</p>
                    <p className="text-gray text-xs pt-2"> 11.5Mb</p>
                  </div>
                  <img
                    src={require("../../assets/downloadIcon.png")}
                    alt="book"
                    className="text-Orange "
                  />
                </div>
              </div>
            </Box>
            <Box>
              <Box
                sx={{
                  m: 3,
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <Typography
                  sx={{
                    bgcolor: "#FAF9F9",
                    borderRadius: "10px",
                    px: 1,
                    border: "1px solid #FAF9F9",
                  }}
                >
                  All Replies
                </Typography>
              </Box>
              <Box
                sx={{
                  m: 3,
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <Box
                  sx={{
                    m: 3,
                    boxShadow: "unset",

                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Typography
                    sx={{
                      border: "1px solid #FAF9F9",
                      bgcolor: "#FAF9F9",
                      borderRadius: "10px",
                      p: 1,
                    }}
                  >
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Fuga consequuntur iste impedit ipsam adipisci autem velit,
                    ut aliquam voluptatum officiis obcaecati facere perspiciatis
                    beatae sunt ipsa, nihil, deserunt suscipit nam! Lorem ipsum
                    dolor sit amet consectetur adipisicing elit. Architecto
                    cumque laudantium hic ratione beatae, mollitia provident
                    repellat earum ullam impedit asperiores, voluptatem sed
                    consequatur porro quis repudiandae consequuntur libero
                    itaque?
                  </Typography>
                </Box>
                <Box sx={{ m: 3 }}>
                  <div className="lesson-card__icon rounded-full h-20 w-20  bg-white shadow-md flex justify-center items-center">
                    <img
                      src={require("../../assets/padgelogo.png")}
                      alt="logo"
                      className="h-12 w-12"
                    />
                  </div>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                m: 3,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div className="flex flex-row gap-0 mb-20">
                <label className="text-sm font-semibold mb-1">
                  Description (Arabic) <span className="text-red">*</span>
                </label>

                <TextEditor
                  id={"des_ar"}
                  placeholder="Add your description ..."
                />
              </div>
              <Button
                onClick={() => {
                  setAction("add");
                  handleOpen("unitModal");
                }}
                label="Send replay"
                className="w-30 h-10"
              />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <AddContentModal
        open={open.contentModal}
        onClose={() => handleClose("contentModal")}
      />

      <ContentStatusModal
        open={open.contentStatusModal}
        onClose={() => handleClose("contentStatusModal")}
      />

      <AddUnitModal
        open={open.unitModal}
        onClose={() => handleClose("unitModal")}
        action={action}
      />

      <AddLessonModal
        open={open.lessonModal}
        onClose={() => handleClose("lessonModal")}
        action={action}
      />

      <DeleteConfirmationModal
        open={open.deleteContentModal}
        onClose={() => handleClose("deleteContentModal")}
        onConfirm={() => {}}
        item={"Content"}
      />
    </>
  );
};

export default Tickets;
