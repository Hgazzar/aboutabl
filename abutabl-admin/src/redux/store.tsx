import { configureStore } from "@reduxjs/toolkit";
import loginReducer from "./reducers/loginReducer";
import pagesToggleReducer from "./reducers/pagesToggleReducer";
import employeeReducer from "./reducers/employeeReducer";
import studentReducer from "./reducers/studentReducer";
import rolesReducer from "./reducers/roleReducer";
import gradeReducer from "./reducers/gradeReducer";
import classesReducer from "./reducers/classesReducer";
import schoolReducer from "./reducers/schoolReducer";
import subjectsReducer from "./reducers/subjectsReducer";
import commonReducer from "./reducers/commonReducer";
import fileManagementReducer from "./reducers/fileManagementReducer";
import questionBankReducer from "./reducers/questionBankReducer";
import permissionReducer from "./reducers/permissionReducer";
import profileReducer from "./reducers/profileReducer";
import { notificationsApi } from "./reducers/notificationsApi";
import interactiveGamesReducer from "./reducers/interactiveGamesReducer";

export const store = configureStore({
  reducer: {
    pagesToggle: pagesToggleReducer,
    login: loginReducer,
    employee: employeeReducer,
    profile: profileReducer,
    student: studentReducer,
    grade: gradeReducer,
    classes: classesReducer,
    roles: rolesReducer,
    school: schoolReducer,
    subjects: subjectsReducer,
    common: commonReducer,
    files: fileManagementReducer,
    questions: questionBankReducer,
    permissions: permissionReducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    interactiveGames: interactiveGamesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(notificationsApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
