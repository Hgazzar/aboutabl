import { Skeleton } from "@mui/material";

/** Lightweight skeleton for Students tab section 1 (toolbar + banner + KPI). */
export const StudentProfileSkeleton = () => (
  <div className="space-y-6 px-6 py-6 md:px-8">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2.5">
        <Skeleton variant="rounded" width={220} height={44} sx={{ borderRadius: "12px" }} />
        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "10px" }} />
      </div>
      <div className="flex gap-2.5">
        <Skeleton variant="rounded" width={140} height={44} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" width={130} height={44} sx={{ borderRadius: "10px" }} />
        <Skeleton variant="rounded" width={120} height={44} sx={{ borderRadius: "10px" }} />
      </div>
    </div>
    <Skeleton
      variant="rounded"
      sx={{ borderRadius: "16px", width: "100%", aspectRatio: "1149 / 137" }}
    />
    <div className="grid gap-6 md:grid-cols-3">
      <Skeleton variant="rounded" height={118} sx={{ borderRadius: "16px" }} />
      <Skeleton variant="rounded" height={118} sx={{ borderRadius: "16px" }} />
      <Skeleton variant="rounded" height={118} sx={{ borderRadius: "16px" }} />
    </div>
  </div>
);

export default StudentProfileSkeleton;
