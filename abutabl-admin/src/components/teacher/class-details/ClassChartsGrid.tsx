import { ReactNode } from "react";

export type ClassChartsGridProps = {
  left: ReactNode;
  right: ReactNode;
};

/**
 * Same grid ratios as Overview ClassOverviewChartsSection.
 * Columns stretch so both cards share equal height.
 */
export const ClassChartsGrid = ({ left, right }: ClassChartsGridProps) => (
  <section className="pt-1">
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.55fr_1fr]">
      <div className="flex h-full min-w-0 flex-col">{left}</div>
      <div className="flex h-full min-w-0 flex-col">{right}</div>
    </div>
  </section>
);

export default ClassChartsGrid;
