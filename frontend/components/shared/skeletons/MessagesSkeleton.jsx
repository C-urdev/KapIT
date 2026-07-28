export default function MessagesSkeleton() {
  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border border-[#a3b18a]/30 bg-white dark:border-[#353c44]/30 dark:bg-[#1a1d20]">
      <div className="flex w-full flex-col border-r border-[#a3b18a]/30 dark:border-[#353c44]/30 md:w-80 lg:w-96 shrink-0">
        <div className="p-4 border-b border-[#a3b18a]/30 dark:border-[#353c44]/30">
          <div className="h-10 w-full rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fbf6] dark:hover:bg-[#22272b]">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-1/2 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                  <div className="h-3 w-8 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
                </div>
                <div className="h-3 w-3/4 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden flex-1 flex-col bg-[#f8fbf6]/50 dark:bg-[#22272b]/50 md:flex">
        <div className="flex items-center gap-3 p-4 border-b border-[#a3b18a]/30 dark:border-[#353c44]/30 bg-white dark:bg-[#1a1d20]">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          <div className="h-5 w-48 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-20 w-full rounded-2xl rounded-tl-sm bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
          <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
            <div className="h-20 w-full rounded-2xl rounded-tr-sm bg-[#e5e7eb] dark:bg-[#3a5a40]/20 animate-pulse" />
          </div>
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-32 w-full rounded-2xl rounded-tl-sm bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#1a1d20] border-t border-[#a3b18a]/30 dark:border-[#353c44]/30">
          <div className="h-12 w-full rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
