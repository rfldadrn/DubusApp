export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-lg bg-muted" />
        <div className="h-28 rounded-lg bg-muted" />
        <div className="h-28 rounded-lg bg-muted" />
      </div>

      <div className="h-[420px] rounded-lg bg-muted" />
    </div>
  );
}
