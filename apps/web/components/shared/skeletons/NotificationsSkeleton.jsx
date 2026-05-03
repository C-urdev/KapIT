export default function NotificationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        <div className="h-8 w-24 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
      </div>
      
      <div className="overflow-hidden rounded-xl border border-[#a3b18a]/30 bg-white dark:border-[#353c44]/30 dark:bg-[#1a1d20]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 border-b border-[#a3b18a]/10 dark:border-[#353c44]/30 last:border-0">
            <div className="h-12 w-12 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            <div className="flex-1 space-y-2 mt-1">
              <div className="h-4 w-3/4 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
