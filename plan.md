Implementation Plan: Smart Query Archive Tracker (Laravel + Inertia.js + React)
Aplikasi pelacak arsip fisik satu layar (single-screen file tracker) untuk Record Center dengan fungsi pencarian instan, validasi sirkulasi atomik (Pinjam/Kembali), dan pencatatan buku register otomatis.

Tech Stack
Framework: Laravel 11.x

Frontend: Inertia.js v2 + React 18 + Tailwind CSS + Lucide React

Database: PostgreSQL / MySQL

State & Handling: React Hooks + Headless UI / Shadcn

Phase 1: Database & Model Setup
[ ] 1.1. Migration Tabel master_arsip

File: database/migrations/xxxx_create_master_arsips_table.php

Field:

id (bigIncrements)

kode_pelaksana (string, unique, index)

no_boks (string, index)

unit_kerja (string)

uraian_identitas (text)

kurun_waktu_awal (year/integer)

kurun_waktu_akhir (year/integer)

lokasi_simpan (string) - cth: 168.05.25

ruang_simpan (string) - cth: DPCL2

rak (string) - cth: R16

status (enum: ['READY', 'DIPINJAM'], default: 'READY')

peminjam_terakhir (string, nullable)

tgl_pinjam_terakhir (date, nullable)

timestamps()

[ ] 1.2. Migration Tabel register_peminjaman

File: database/migrations/xxxx_create_register_peminjamen_table.php

Field:

id (bigIncrements)

no_register (string, unique, index)

tanggal_request (date)

nama_pemohon (string)

kode_pelaksana (string) -> foreign reference ke master_arsip

identitas_arsip (text)

lokasi_simpan (string)

tgl_pengembalian (date, nullable)

timestamps()

[ ] 1.3. Eloquent Models & Relationships

File: app/Models/MasterArsip.php (relasi hasMany ke RegisterPeminjaman)

File: app/Models/RegisterPeminjaman.php (relasi belongsTo ke MasterArsip)

File: database/seeders/MasterArsipSeeder.php (buat data dummy arsip & register)

Phase 2: Business Logic & Backend Controllers
[ ] 2.1. Request Validation Rules

File: app/Http/Requests/SearchArsipRequest.php (kode_pelaksana, no_boks required/nullable)

File: app/Http/Requests/TransactionArsipRequest.php (kode_pelaksana, nama_peminjam required)

[ ] 2.2. Archive Tracking Controller (ArchiveTrackerController)

File: app/Http/Controllers/ArchiveTrackerController.php

Method:

index(): Render halaman utama Inertia Tracker/Index.

search(SearchArsipRequest $request): Query arsip dengan kondisi WHERE kode_pelaksana LIKE ? AND no_boks LIKE ?, return JSON/Inertia props.

borrow(TransactionArsipRequest $request):

Eksekusi dalam DB::transaction().

Kunci baris data dengan lockForUpdate().

Validasi: jika status == 'DIPINJAM', return response status 422 ("Berkas masih dipinjam").

Update status = 'DIPINJAM', peminjam_terakhir, tgl_pinjam_terakhir.

Insert baris baru di register_peminjaman dengan format register otomatis (YYYYMMDD + sequence).

return(TransactionArsipRequest $request):

Eksekusi dalam DB::transaction().

Validasi: jika status == 'READY', return response status 422 ("Berkas sudah berada di rak").

Update status = 'READY', peminjam_terakhir = null.

Update tgl_pengembalian = now() pada baris register aktif terakhir untuk berkas tersebut.

[ ] 2.3. Routing

File: routes/web.php

PHP
Route::get('/', [ArchiveTrackerController::class, 'index'])->name('tracker.index');
Route::post('/tracker/search', [ArchiveTrackerController::class, 'search'])->name('tracker.search');
Route::post('/tracker/borrow', [ArchiveTrackerController::class, 'borrow'])->name('tracker.borrow');
Route::post('/tracker/return', [ArchiveTrackerController::class, 'return'])->name('tracker.return');
Phase 3: Single-Screen Frontend Interface
[ ] 3.1. Main Layout & Smart Query Form Component

File: resources/js/Pages/Tracker/Index.jsx

Desain antarmuka 1 layar penuh (tanpa scroll berlebih):

Header: Branding Record Center + Clock/Timestamp aktif.

Form Input Panel:

Input kode_pelaksana (autofocus untuk barcode scanner fisik).

Input no_boks.

Input nama_pemohon.

Action Bar Button:

Tombol Cari (Blue, Trigger Search)

Tombol Pinjam (Teal/Emerald, Trigger Borrow modal confirmation)

Tombol Kembali (Cyan/Indigo, Trigger Return modal confirmation)

Tombol Reset / Tutup (Red/Slate)

[ ] 3.2. Status Badge & Result Table Component

File: resources/js/Pages/Tracker/Components/SearchResultCard.jsx

Indikator status besar:

READY (Background Hijau / Text Bold)

DIPINJAM - [NAMA] - [TANGGAL] (Background Merah / Text Bold)

Baris ringkasan data arsip: Lokasi Simpan, Ruang Simpan, Rak, Uraian Dokumen.

[ ] 3.3. Dialog Konfirmasi & Toast Notifications

File: resources/js/Pages/Tracker/Components/ConfirmModal.jsx

Dialog konfirmasi sebelum submit Pinjam atau Kembali.

Loading state feedback saat proses query/mutasi berjalan ("Sedang Memproses...").

Phase 4: Barcode Scanner & UX Enhancements
[ ] 4.1. Hardware Scanner Keydown Listener

Pasang onKeyDown detection pada input kode pelaksana untuk menangkap delimiter Enter dari hardware barcode scanner.

Auto-focus kembali ke input kode pelaksana setelah transaksi sukses diproses.

[ ] 4.2. Sound / Audio Feedback (Opsional)

Audio ringkas untuk notifikasi hasil pencarian berhasil/gagal.

Phase 5: Verification & Testing
[ ] 5.1. Unit & Feature Test

File: tests/Feature/ArchiveTrackerTest.php

Test Case:

test_can_search_archive_by_code_and_box()

test_cannot_borrow_already_borrowed_archive()

test_borrow_updates_master_and_creates_register_log()

test_return_updates_master_and_closes_register_log()

test_concurrency_lock_prevents_race_condition()
