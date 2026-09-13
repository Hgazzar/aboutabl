import { useTranslation } from "react-i18next";
import greenStudentBanner from "@/assets/green-student-banner.png";
import { StudentProfileSummary } from "@/types/studentProfile";

export type StudentSummaryBannerProps = {
  student: StudentProfileSummary;
  schoolRank: number | null;
  schoolAvailable: boolean;
};

export const StudentSummaryBanner = ({
  student,
  schoolRank,
  schoolAvailable,
}: StudentSummaryBannerProps) => {
  const { t } = useTranslation();

  const metaParts = [
    t("TEACHER_STUDENT_PROFILE.BANNER_CLASS", {
      value: student.class_label || "—",
    }),
    t("TEACHER_STUDENT_PROFILE.BANNER_GRADE", {
      value: student.grade_label || "—",
    }),
    t("TEACHER_STUDENT_PROFILE.BANNER_RANK_CLASS", {
      value: student.rank || "—",
    }),
  ];

  if (schoolAvailable && schoolRank != null) {
    metaParts.push(
      t("TEACHER_STUDENT_PROFILE.BANNER_RANK_SCHOOL", {
        value: schoolRank,
      })
    );
  } else {
    metaParts.push(t("TEACHER_STUDENT_PROFILE.BANNER_RANK_SCHOOL_UNAVAILABLE"));
  }

  const statusValue = t(
    `TEACHER_STUDENT_PROFILE.STATUS_${(student.status || "no_data").toUpperCase()}`
  );

  return (
    <section
      className="relative flex w-full items-center justify-between gap-6 overflow-hidden rounded-[16px] px-6 py-5 md:px-8 md:py-6"
      style={{
        minHeight: 137,
        backgroundColor: "#23B8A2",
        backgroundImage: `url(${greenStudentBanner})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-[1] min-w-0 flex-1">
        <h2 className="truncate text-[24px] font-bold leading-tight text-white md:text-[28px]">
          {student.name || t("TEACHER_STUDENT_PROFILE.UNKNOWN_STUDENT")}
        </h2>
        <p className="mt-2 truncate text-[14px] font-medium leading-5 text-white md:text-[15px]">
          {metaParts.join("  ")}
        </p>
      </div>

      {/*
        Design: "Statue" label + cyan badge.
        Banner PNG has a baked-in empty plate — mask it so only one badge shows.
      */}
      <div className="relative z-[2] flex shrink-0 flex-col items-center gap-2.5">
        <span className="student-banner-status-label">
          {t("TEACHER_STUDENT_PROFILE.STATUS_LABEL")}
        </span>
        <span className="student-banner-status-badge-wrap">
          <span className="student-banner-status-badge-mask" aria-hidden />
          <span className="student-banner-status-badge" title={statusValue}>
            {statusValue}
          </span>
        </span>
      </div>
    </section>
  );
};

export default StudentSummaryBanner;
