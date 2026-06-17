Alur bisnis yang saya baca dari schema:
Customer datang (langsung atau lewat Agency/Project) → ambil ukuran (HeaderSizeCustomer + ItemSizeCustomer) → buat Transaction dengan satu atau lebih TransactionItem (tiap item punya kain sendiri, desain sendiri, harga jahit sendiri) → item dikerjakan tukang jahit (assignedTailor, dilacak ProductionLog dan WorkerLog) → kadang disetrika (IroningLog) → dikirim (Delivery/DeliveryItem) → pembayaran dicatat bertahap (Payment, status Unpaid/Partial/Paid) → semua transaksi kas masuk/keluar (termasuk payroll tukang jahit) tercatat di CashLedger.
Ini alur yang cukup lengkap. Tapi ada beberapa area bisnis yang menurut saya layak didiskusikan — apakah memang sudah dihandle, sengaja diabaikan, atau memang gap:
1. Apa yang terjadi kalau transaksi dibatalkan/refund?
Saya tidak melihat field atau status untuk "Cancelled" di TransactionType atau alur refund di Payment. Ada PaymentStatus (Unpaid/Partial/Paid) tapi tidak ada "Refunded" atau "Cancelled". Kalau customer DP lalu batal, bagaimana itu di-handle? Apakah rowStatus = false di Transaction, dan bagaimana dengan uang yang sudah masuk ke CashLedger?
2. Capacity planning tukang jahit
assignedTailor di TransactionItem itu single assignment, tapi tidak ada konsep "berapa banyak job yang sedang dikerjakan tukang X" atau "kapan tukang ini available". Kalau bisnisnya sudah cukup besar, ini bisa jadi pain point: admin assign manual tanpa visibility ke beban kerja masing-masing tukang.
3. Stock fabric tidak otomatis berkurang?
Fabric.stockMeters ada, dan TransactionItem.fabricMeters mencatat berapa meter dipakai — tapi apakah ada trigger/logic yang otomatis mengurangi stockMeters saat TransactionItem dibuat dengan fabricSource = Store? Ini critical kalau bisnisnya beli kain dalam jumlah besar dan butuh tahu kapan harus restock.
4. Approval/quality check sebelum delivery?
Dari StatusItem (configurable) ke Delivery, tidak ada checkpoint eksplisit "QC passed" sebelum barang dikirim. Mungkin ini sudah di-handle lewat salah satu StatusItem custom (misal status "Ready to Deliver"), tapi worth dikonfirmasi.
5. Pricing rules
customerPrice dan employeePrice di Item itu flat per item — tidak ada konsep diskon, harga khusus per agency/project, atau harga grosir untuk volume besar. Untuk bisnis yang sudah melayani Agency/corporate (yang biasanya nego harga), ini mungkin jadi gap nyata: bagaimana harga khusus per agency di-handle sekarang?
Dari lima poin ini, mana yang paling relevan dengan kondisi bisnis kamu sekarang — atau ada concern bisnis lain yang sebenarnya lebih mendesak dan belum saya sebut?
