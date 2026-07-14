import { COMPLETION_STATUS_CARD_CLASS } from "./completionStatusTheme";

export const CompletionStatusSkeleton = () => (
  <article
    className={COMPLETION_STATUS_CARD_CLASS}
    aria-busy="true"
    aria-label="Loading completion status"
  >
    <div className="mb-4 h-5 w-40 animate-pulse rounded bg-[#E5E7EB]" />
    <div className="mb-4 flex gap-1 rounded-[10px] bg-[#F3F4F6] p-0.5 self-start">
      <div className="h-7 w-12 animate-pulse rounded-lg bg-[#E5E7EB]" />
      <div className="h-7 w-24 animate-pulse rounded-lg bg-[#E5E7EB]" />
      <div className="h-7 w-20 animate-pulse rounded-lg bg-[#E5E7EB]" />
    </div>
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
      <div className="h-[220px] w-[220px] animate-pulse rounded-full bg-[#F3F4F6]" />
      <div className="flex w-[160px] flex-col gap-3.5">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-[#F3F4F6]" />
            <div className="h-4 w-8 animate-pulse rounded bg-[#F3F4F6]" />
          </div>
        ))}
      </div>
    </div>
  </article>
);

export default CompletionStatusSkeleton;
