export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0a] p-8 animate-pulse">
      <div className="max-w-md mx-auto space-y-6">
        <div className="h-12 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-12 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mt-8" />
        <div className="h-12 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>
    </div>
  )
}
