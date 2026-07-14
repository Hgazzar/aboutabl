import { CLASSES_PERFORMANCE_CARD_CLASS } from "./classesPerformanceTheme";

export const ClassesPerformanceSkeleton = () => (
  <article
    className={CLASSES_PERFORMANCE_CARD_CLASS}
    aria-busy="true"
    aria-label="Loading classes performance"
  >
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="h-5 w-44 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-4 w-52 animate-pulse rounded bg-[#F3F4F6]" />
      </div>
      <div className="flex gap-4 pt-0.5">
        <div className="h-4 w-16 animate-pulse rounded bg-[#F3F4F6]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#F3F4F6]" />
      </div>
    </div>
    <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-xl bg-[#F9FAFB]">
      <div className="absolute inset-x-8 bottom-10 top-8 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-px w-full bg-[#E5E7EB]" />
        ))}
      </div>
      <div className="absolute inset-x-10 bottom-8 top-12 animate-pulse rounded-full bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent opacity-60" />
    </div>
  </article>
);

export default ClassesPerformanceSkeleton;
