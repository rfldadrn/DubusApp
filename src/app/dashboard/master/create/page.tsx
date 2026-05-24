import { MasterDataForms } from "./master-data-forms";

export default function MasterCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Data Master</h1>
        <p className="text-muted-foreground">Kelola data master sistem</p>
      </div>
      <MasterDataForms />
    </div>
  );
}
