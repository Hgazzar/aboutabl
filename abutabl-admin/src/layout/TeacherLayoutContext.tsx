import { createContext, useContext } from "react";

type TeacherLayoutContextValue = {
  openNav: () => void;
};

export const TeacherLayoutContext = createContext<TeacherLayoutContextValue>({
  openNav: () => {},
});

export const useTeacherLayout = () => useContext(TeacherLayoutContext);
