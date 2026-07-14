export const StudentRankingsSkeleton = () => (
  <article
    className="overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] md:p-7"
    aria-busy="true"
  >
    <div className="mb-6 grid grid-cols-1 items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
      <div className="space-y-2">
        <div className="h-6 w-36 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-4 w-52 animate-pulse rounded bg-[#F3F4F6]" />
      </div>
      <div className="mx-auto h-12 w-full max-w-[420px] animate-pulse rounded-full bg-[#F3F4F6]" />
      <div className="h-11 w-44 animate-pulse rounded-full bg-[#E5E7EB] justify-self-end" />
    </div>
    <div className="flex justify-center gap-5 overflow-hidden px-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[312px] w-[236px] shrink-0 animate-pulse rounded-[22px] bg-[#F9FAFB]"
        />
      ))}
    </div>
    <div className="mx-auto mt-5 h-[6px] w-[280px] animate-pulse rounded-full bg-[#E5E7EB]" />
  </article>
);

export default StudentRankingsSkeleton;
