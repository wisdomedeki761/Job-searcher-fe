/** Neumorphic skeleton loader card for the job feed. */
export default function JobSkeleton() {
  return (
    <div className="glass space-y-3 p-4">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
