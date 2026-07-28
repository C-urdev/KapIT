export default function PageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-[#f5f5f2] dark:bg-[#121416]">
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#a3b18a]/30 dark:border-[#353c44]/30 bg-white dark:bg-[#1a1d20] p-4">
        <div className="h-10 w-32 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-lg animate-pulse mb-8 mt-2" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#a3b18a]/30 dark:border-[#353c44]/30 bg-white dark:bg-[#1a1d20] flex items-center justify-between px-6">
          <div className="h-8 w-24 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-lg animate-pulse lg:hidden" />
          <div className="h-8 w-48 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-lg animate-pulse hidden lg:block" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-full animate-pulse" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white dark:bg-[#1a1d20] rounded-xl border border-[#a3b18a]/30 dark:border-[#353c44]/30 animate-pulse p-4 flex flex-col justify-between">
                  <div className="h-4 w-1/3 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded" />
                  <div className="h-8 w-1/2 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded" />
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-[#1a1d20] rounded-xl border border-[#a3b18a]/30 dark:border-[#353c44]/30 p-4 sm:p-6 space-y-6">
              <div className="h-6 w-1/4 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded animate-pulse mb-4" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-12 w-12 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 w-3/4 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded" />
                    <div className="h-3 w-1/2 bg-[#e5e7eb] dark:bg-[#2a2f35] rounded" />
                    <div className="h-3 w-full bg-[#e5e7eb] dark:bg-[#2a2f35] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
