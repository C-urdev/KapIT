export default function JobsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[700px] mt-6">
      <div className="flex items-center justify-center mb-4">
        <div className="h-4 w-16 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
      </div>
      <div className="aspect-square w-full rounded-2xl border border-[#a3b18a]/30 bg-[#f8fbf6]/50 p-5 shadow-sm dark:border-[#353c44]/30 dark:bg-[#22272b]/50 sm:p-7">
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                <div className="h-4 w-32 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              </div>
            </div>
            <div className="h-14 w-32 rounded-xl bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse hidden sm:block" />
          </div>
          
          <div className="mb-4 flex gap-2">
            <div className="h-6 w-24 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-6 w-24 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>

          <div className="flex-1 space-y-3 mt-4">
            <div className="h-4 w-full rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#a3b18a]/30 dark:border-[#353c44]/30">
            <div className="h-12 flex-1 rounded-xl bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-12 w-full sm:w-32 rounded-xl bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
