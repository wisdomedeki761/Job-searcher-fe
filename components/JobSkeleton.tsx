/**
 * Loading placeholder for the job feed (JOB FEED · LOADING): a 210px glass
 * card holding the three reference skeleton bars.
 */
export default function JobSkeleton() {
  return (
    <div className="card flex h-[210px] flex-col gap-3.5 p-5">
      <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
      <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
      <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
    </div>
  );
}
