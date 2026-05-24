# 📋 Update Transaction Form - Analisa & Implementasi

## 🔍 **Analisa Masalah**

### **1. ❌ Ukuran tidak muncul di dropdown**

**Penyebab:**
- API `/api/sizes/list` sudah benar, tetapi hanya ada data di table `item_sizes` saja
- Dropdown ukuran mengambil data dari `header_size_customers` (header ukuran per customer + item), bukan langsung dari `item_sizes`
- Data yang dibutuhkan ada **3 level**:
  1. **`item_sizes`** → Field ukuran per jenis item (misal: Kemeja punya field "Lingkar Leher", "Panjang Baju", dll)
  2. **`header_size_customers`** → Header ukuran per customer per item (misal: Customer "Budi" untuk item "Kemeja")
  3. **`item_size_customers`** → Detail nilai ukuran per field (misal: Lingkar Leher = 38cm, Panjang Baju = 72cm)

**Solusi:**
- ✅ Insert dummy data lengkap ke 3 table menggunakan file SQL: `database/dummy-item-sizes.sql`
- File SQL sudah meng-handle auto-increment ID dan relation antar table

---

### **2. ❌ Input harga kain untuk pelanggan**

**Penyebab:**
- Saat fabricSource = "Store", hanya ada dropdown untuk memilih kain dari master
- Harga kain bisa berbeda per pelanggan, tetapi tidak ada input untuk override harga
- Schema Prisma sudah punya field `fabricPrice` dan `fabricMeters` di `TransactionItem`

**Solusi:**
- ✅ Tambahkan input `fabricPrice` (Rp per meter) dengan auto-fill dari master fabric
- ✅ Tambahkan input `fabricMeters` (jumlah meter yang digunakan)
- ✅ Auto-calculate total biaya kain (fabricPrice × fabricMeters)
- ✅ Display harga master sebagai referensi

---

### **3. ❌ Biaya tambahan (bordir, lambang, dll)**

**Penyebab:**
- Schema Prisma sudah punya table `TransactionItemCharge` untuk biaya tambahan
- Form belum ada input untuk menambahkan charges per item

**Solusi:**
- ✅ Tambahkan section "Biaya Tambahan" per item
- ✅ User bisa menambah multiple charges per item dengan:
  - `label` → Nama biaya (misal: "Bordir nama", "Lambang dinas")
  - `amount` → Jumlah biaya (Rp)
  - `note` → Catatan opsional
- ✅ Auto-calculate total biaya tambahan per item
- ✅ Include dalam grand total transaksi

---

## ✅ **Implementasi yang Dilakukan**

### **A. Frontend (transaction-create-form.tsx)**

#### **1. Update Type Definition**
```typescript
type ItemCharge = {
  label: string;
  amount: number;
  note?: string;
};

type TransactionItem = {
  itemId: number;
  fabricSource: string;
  fabricId?: number;
  fabricPrice?: number;        // ✅ NEW
  fabricMeters?: number;       // ✅ NEW
  sewingPrice: number;
  modelDescription?: string;
  sizeHeaderId?: number;
  charges: ItemCharge[];       // ✅ NEW
};
```

#### **2. Tambah State & Functions**
- `addCharge(itemIndex)` → Tambah biaya baru ke item
- `removeCharge(itemIndex, chargeIndex)` → Hapus biaya
- `updateCharge(itemIndex, chargeIndex, field, value)` → Update biaya
- `calculateItemTotal(item)` → Hitung total per item (jahit + kain + charges)
- `calculateGrandTotal()` → Hitung total semua item

#### **3. Update UI - Input Harga Kain**
Ketika `fabricSource = "Store"`:
```tsx
// Auto-fill harga dari master fabric saat dipilih
<Label>Harga Kain per Meter (Rp) *</Label>
<Input
  type="number"
  value={item.fabricPrice || ""}
  onChange={(e) => updateItem(index, "fabricPrice", Number(e.target.value))}
  placeholder="Harga bisa berbeda per pelanggan"
/>

<Label>Jumlah Meter Kain *</Label>
<Input
  type="number"
  step="0.1"
  value={item.fabricMeters || ""}
  onChange={(e) => updateItem(index, "fabricMeters", Number(e.target.value))}
/>

<Label>Total Biaya Kain</Label>
<Input
  value={`Rp ${((fabricPrice || 0) * (fabricMeters || 0)).toLocaleString("id-ID")}`}
  disabled
/>
```

#### **4. Update UI - Biaya Tambahan**
Section baru per item:
```tsx
<div className="md:col-span-2 border-t pt-4">
  <Label>Biaya Tambahan (Bordir, Lambang, dll)</Label>
  <Button onClick={() => addCharge(index)}>
    <Plus /> Tambah Biaya
  </Button>

  {/* Dynamic form untuk setiap charge */}
  {item.charges.map((charge, chargeIndex) => (
    <div key={chargeIndex}>
      <Input placeholder="Label (mis: Bordir nama)" />
      <Input type="number" placeholder="Harga" />
      <Input placeholder="Catatan (opsional)" />
      <Button onClick={() => removeCharge(index, chargeIndex)}>
        <Trash2 />
      </Button>
    </div>
  ))}
</div>
```

#### **5. Update Summary Section**
- Total per item: `Jahit + Kain + Charges`
- Grand total: `SUM(semua item)`
- Sisa pembayaran: `Grand Total - DP`

#### **6. Update Validation**
```typescript
// Validasi harga & meter kain jika fabricSource = "Store"
if (item.fabricSource === "Store" && (!item.fabricPrice || !item.fabricMeters)) {
  toast({ title: "Error", description: "Harga dan meter kain harus diisi" });
  return;
}

// Validasi charges
if (item.charges.some(charge => !charge.label || charge.amount <= 0)) {
  toast({ title: "Error", description: "Biaya tambahan harus valid" });
  return;
}
```

---

### **B. Backend (actions.ts)**

#### **1. Update Type Definition**
```typescript
type ItemChargeInput = {
  label: string;
  amount: number;
  note?: string;
};

type TransactionItemInput = {
  // ... existing fields
  fabricPrice?: number;      // ✅ NEW
  fabricMeters?: number;     // ✅ NEW
  charges: ItemChargeInput[]; // ✅ NEW
};
```

#### **2. Update Total Calculation**
```typescript
// Calculate total amount including fabric cost and charges
let totalAmount = 0;
for (const item of data.items) {
  totalAmount += item.sewingPrice;
  
  // Add fabric cost
  if (item.fabricSource === "Store" && item.fabricPrice && item.fabricMeters) {
    totalAmount += item.fabricPrice * item.fabricMeters;
  }
  
  // Add charges
  const chargesTotal = item.charges.reduce((sum, charge) => sum + charge.amount, 0);
  totalAmount += chargesTotal;
}
```

#### **3. Update Database Insert**
```typescript
items: {
  create: data.items.map((item) => ({
    // ... existing fields
    fabricPrice: item.fabricPrice || null,
    fabricMeters: item.fabricMeters || null,
    charges: {
      create: item.charges.map((charge) => ({
        label: charge.label,
        amount: charge.amount,
        note: charge.note || null,
      })),
    },
  })),
}
```

#### **4. Update Invoice Data**
Include fabric cost dan charges dalam data invoice untuk cetak/WhatsApp

---

## 📊 **Database Schema**

### **Item Sizes (3 Level)**

```
┌─────────────────┐
│   item_sizes    │  ← Field ukuran per jenis item
│  (Kemeja: ...)  │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
┌────────▼────────────┐   ┌────────▼────────────┐
│ header_size_customers│  ← Header ukuran per customer + item
│ (Customer 2, Kemeja)│
└────────┬────────────┘
         │
┌────────▼────────────┐
│ item_size_customers │  ← Detail nilai ukuran
│ (Lingkar Leher: 38cm)│
└─────────────────────┘
```

### **Transaction Structure**

```
┌──────────────────┐
│   transactions   │
└────────┬─────────┘
         │
┌────────▼─────────────┐
│ transaction_items    │
│ - sewingPrice        │
│ - fabricPrice ✅ NEW │
│ - fabricMeters ✅ NEW│
└────────┬─────────────┘
         │
┌────────▼──────────────────┐
│ transaction_item_charges  │  ✅ NEW USAGE
│ - label                   │
│ - amount                  │
│ - note                    │
└───────────────────────────┘
```

---

## 🚀 **Cara Menggunakan**

### **1. Insert Dummy Data Ukuran**

```bash
# Jalankan file SQL di PostgreSQL
psql -U your_user -d your_database -f database/dummy-item-sizes.sql
```

File ini akan:
- ✅ Insert field ukuran untuk Kemeja (7 fields)
- ✅ Insert field ukuran untuk Celana (7 fields)
- ✅ Insert header ukuran untuk customer id 2 (kemeja & celana)
- ✅ Insert detail nilai ukuran dummy

### **2. Test di Form Transaksi**

1. Buka `/dashboard/transactions/create`
2. Pilih **Pelanggan** (misal: customer id 2)
3. Tambah item, pilih **Jenis Item** (Kemeja atau Celana)
4. **Ukuran Pelanggan** dropdown seharusnya sudah muncul ✅
5. Jika pilih **Sumber Kain = Kain Toko**:
   - Pilih jenis kain
   - Input harga per meter (auto-fill dari master)
   - Input jumlah meter
   - Total biaya kain auto-calculate ✅
6. Klik **Tambah Biaya** untuk menambah charges:
   - Input label (misal: "Bordir nama")
   - Input harga (misal: 25000)
   - Input catatan (opsional)
   - Bisa tambah multiple charges ✅
7. Lihat **Total Item** yang sudah include semua biaya
8. Lihat **Ringkasan Transaksi** dengan grand total ✅

---

## 🧪 **Testing Checklist**

- [ ] Ukuran muncul di dropdown setelah insert dummy data
- [ ] Bisa pilih ukuran yang sudah ada
- [ ] Bisa tambah ukuran baru via dialog "+"
- [ ] Input harga kain auto-fill dari master fabric
- [ ] Input harga kain bisa diubah manual (custom per pelanggan)
- [ ] Total biaya kain auto-calculate (price × meters)
- [ ] Bisa tambah multiple biaya tambahan per item
- [ ] Bisa hapus biaya tambahan
- [ ] Total per item = jahit + kain + charges
- [ ] Grand total = sum semua item
- [ ] Validasi: harga & meter kain wajib jika fabricSource = Store
- [ ] Validasi: label & amount charges harus valid
- [ ] Data tersimpan ke database dengan benar
- [ ] Invoice/receipt include semua biaya

---

## 📝 **Catatan Penting**

1. **Ukuran tidak muncul?**
   - Pastikan sudah jalankan SQL: `database/dummy-item-sizes.sql`
   - Cek apakah `header_size_customers` ada untuk customer + item yang dipilih
   - Cek `rowStatus = true` di semua table terkait

2. **Custom harga kain per pelanggan**
   - Harga akan auto-fill dari master fabric
   - User bisa ubah manual sesuai kesepakatan dengan pelanggan
   - Harga yang disimpan di `transaction_items.fabricPrice` adalah harga final

3. **Biaya tambahan**
   - Bisa tambah sebanyak-banyaknya per item
   - Setiap charge punya label, amount, dan note
   - Total charges masuk ke grand total transaksi

---

## 🎯 **Summary Perubahan**

| **Fitur** | **Status** | **File** |
|-----------|------------|----------|
| Input harga kain custom | ✅ Done | transaction-create-form.tsx |
| Input jumlah meter kain | ✅ Done | transaction-create-form.tsx |
| Form biaya tambahan | ✅ Done | transaction-create-form.tsx |
| Calculate total per item | ✅ Done | transaction-create-form.tsx |
| Calculate grand total | ✅ Done | transaction-create-form.tsx |
| Save fabricPrice & fabricMeters | ✅ Done | actions.ts |
| Save charges to DB | ✅ Done | actions.ts |
| Dummy data ukuran | ✅ Done | database/dummy-item-sizes.sql |
| Validation harga kain | ✅ Done | transaction-create-form.tsx |
| Validation charges | ✅ Done | transaction-create-form.tsx |

---

## 📞 **Support**

Jika ada pertanyaan atau issue:
1. Cek file ini untuk troubleshooting
2. Cek query verifikasi di `dummy-item-sizes.sql`
3. Cek console browser untuk error frontend
4. Cek terminal untuk error backend

Build Status: ✅ **SUCCESS** (0 errors, 0 warnings)
