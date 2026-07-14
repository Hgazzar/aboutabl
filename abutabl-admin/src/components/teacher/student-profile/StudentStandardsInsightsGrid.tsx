import { ReactNode } from "react";

export type StudentStandardsInsightsGridProps = {
  left: ReactNode;
  right: ReactNode;
};

/**
 * Final Standards | Smart Insight layout.
 * Same ratios as ClassChartsGrid / StudentActivitiesGrid — locked.
 */
export const StudentStandardsInsightsGrid = ({
  left,
  right,
}: StudentStandardsInsightsGridProps) => (
  <section className="pt-1">
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.55fr_1fr]">
      <div className="flex h-full min-w-0 flex-col">{left}</div>
      <div className="flex h-full min-w-0 flex-col">{right}</div>
    </div>
  </section>
);

export default StudentStandardsInsightsGrid;
