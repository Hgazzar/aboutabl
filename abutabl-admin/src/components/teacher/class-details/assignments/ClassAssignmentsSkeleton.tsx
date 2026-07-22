/** Skeleton matching teacher assignment cards (project pulse style). */
export const ClassAssignmentsSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-busy="true">
    {[0, 1, 2, 3].map((i) => (
      <article
        key={i}
        className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-6 w-3/4 max-w-[220px] animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-4 w-1/2 max-w-[160px] animate-pulse rounded bg-[#F3F4F6]" />
          </div>
          <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-[#ECFDF5]" />
        </div>
        <div className="mb-3 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-[#F3F4F6]" />
            <div className="h-4 w-20 animate-pulse rounded bg-[#F3F4F6]" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-[#F3F4F6]" />
            <div className="h-4 w-12 animate-pulse rounded bg-[#F3F4F6]" />
          </div>
        </div>
        <div className="mb-4 h-2 w-full animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="mb-4 h-10 w-full animate-pulse rounded-xl bg-[#FEF2F2]" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-[#D1FAE5]" />
      </article>
    ))}
  </div>
);

export default ClassAssignmentsSkeleton;
