export default function ManageJobsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-[#f8fbf6] dark:bg-[#22272b] shadow-lg shadow-black/5 dark:shadow-black/20 px-3.5 py-3.5 sm:px-4 sm:py-4">
          <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-3 2xl:gap-5">
            <div className="min-w-0 2xl:flex-[1_1_auto]">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="h-5 w-48 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-4 w-24 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                <div className="h-4 w-24 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                <div className="h-4 w-32 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              </div>
            </div>

            <div className="flex flex-wrap items-stretch 2xl:justify-end gap-2 2xl:flex-[0_0_30%]">
              <div className="h-8 w-24 rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
