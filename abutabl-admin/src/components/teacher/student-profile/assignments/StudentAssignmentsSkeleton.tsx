export const StudentAssignmentsSkeleton = () => (
  <article
    className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
    aria-busy="true"
  >
    <div className="mb-5 flex items-center justify-between">
      <div className="h-5 w-28 animate-pulse rounded bg-[#E5E7EB]" />
      <div className="h-9 w-44 animate-pulse rounded-xl bg-[#F3F4F6]" />
    </div>
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-[#F9FAFB]" />
      ))}
    </div>
    <div className="mt-auto pt-5">
      <div className="h-11 w-full animate-pulse rounded-xl bg-[#F3F4F6]" />
    </div>
  </article>
);

export default StudentAssignmentsSkeleton;
