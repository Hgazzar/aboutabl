import { ReactNode } from "react";

export type StudentActivitiesGridProps = {
  left: ReactNode;
  right: ReactNode;
};

/**
 * Assignments | Quizzes — equal 50% / 50% columns.
 * Widgets must not own layout.
 */
export const StudentActivitiesGrid = ({ left, right }: StudentActivitiesGridProps) => (
  <section className="pt-1">
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
      <div className="flex h-full min-w-0 flex-col">{left}</div>
      <div className="flex h-full min-w-0 flex-col">{right}</div>
    </div>
  </section>
);

export default StudentActivitiesGrid;
