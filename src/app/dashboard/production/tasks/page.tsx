import { TasksClient } from "./tasks-client";

export default function EmployeeTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks Karyawan</h1>
        <p className="text-muted-foreground">Lihat dan cari tugas per karyawan beserta status pembayarannya</p>
      </div>
      <TasksClient />
    </div>
  );
}
