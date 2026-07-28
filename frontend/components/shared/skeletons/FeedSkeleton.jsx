export default function FeedSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <div className="rounded-xl border border-[#a3b18a]/30 bg-[#f8fbf6]/50 p-4 dark:border-[#353c44]/30 dark:bg-[#22272b]/50">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          <div className="h-12 flex-1 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#a3b18a]/30 pt-3 dark:border-[#444d57]/30">
          <div className="h-8 w-28 rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>
      </div>

      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-[#a3b18a]/30 bg-white p-4 dark:border-[#353c44]/30 dark:bg-[#1a1d20]">
          <div className="flex gap-3 mb-4">
            <div className="h-12 w-12 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-1/3 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-xl bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse mb-4" />
          <div className="flex items-center gap-4 pt-4 border-t border-[#a3b18a]/30 dark:border-[#353c44]/30">
            <div className="h-8 w-16 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-8 w-16 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="h-8 w-16 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
