export const StudentQuizzesSkeleton = () => (
  <article
    className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
    aria-busy="true"
  >
    <div className="mb-5 flex items-center justify-between">
      <div className="h-5 w-20 animate-pulse rounded bg-[#E5E7EB]" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-[#ECFDF5]" />
    </div>
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-[#F9FAFB]" />
      ))}
    </div>
  </article>
);

export default StudentQuizzesSkeleton;
