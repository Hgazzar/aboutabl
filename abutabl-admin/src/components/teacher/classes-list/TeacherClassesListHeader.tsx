import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";
import { ClassesListSort } from "@/types/teacherClassesList";

export type TeacherClassesListHeaderProps = {
  total: number;
  searchQuery: string;
  sortBy: ClassesListSort;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ClassesListSort) => void;
};

export const TeacherClassesListHeader = ({
  total,
  searchQuery,
  sortBy,
  onSearchChange,
  onSortChange,
}: TeacherClassesListHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-6 md:px-8 md:py-7">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-[2rem]">
          {t("TEACHER_CLASSES.MY_CLASSES")}
        </h1>
        <p className="mt-2 text-sm text-gray-500 md:text-[0.9375rem]">
          {t("TEACHER_CLASSES.LIST_SUBTITLE", { count: total })}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <SearchIcon
            sx={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 20,
              color: "#9CA3AF",
            }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("TEACHER_CLASSES.SEARCH_PLACEHOLDER")}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <div className="relative w-full sm:w-auto sm:min-w-[180px]">
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as ClassesListSort)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          >
            <option value="name_asc">{t("TEACHER_CLASSES.SORT_NAME_ASC")}</option>
            <option value="name_desc">{t("TEACHER_CLASSES.SORT_NAME_DESC")}</option>
            <option value="performance_desc">{t("TEACHER_CLASSES.SORT_PERFORMANCE")}</option>
            <option value="students_desc">{t("TEACHER_CLASSES.SORT_STUDENTS")}</option>
          </select>
          <KeyboardArrowDownIcon
            sx={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 20,
              color: "#6B7280",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default TeacherClassesListHeader;
