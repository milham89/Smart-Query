<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchArsipRequest;
use App\Http\Requests\TransactionArsipRequest;
use App\Models\MasterArsip;
use App\Models\RegisterPeminjaman;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArchiveTrackerController extends Controller
{
    public function index()
    {
        return Inertia::render('Tracker/Index');
    }

    public function search(SearchArsipRequest $request)
    {
        $query = MasterArsip::query();

        if ($request->filled('kode_pelaksana')) {
            $query->where('kode_pelaksana', 'LIKE', '%' . $request->kode_pelaksana . '%');
        }
        if ($request->filled('no_boks')) {
            $query->where('no_boks', 'LIKE', '%' . $request->no_boks . '%');
        }

        $results = $query->limit(50)->get();

        return response()->json(['results' => $results]);
    }

    public function borrow(TransactionArsipRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $arsip = MasterArsip::where('kode_pelaksana', $request->kode_pelaksana)
                ->lockForUpdate()
                ->first();

            if (!$arsip) {
                return response()->json(['message' => 'Arsip tidak ditemukan.'], 404);
            }

            if ($arsip->status === 'DIPINJAM') {
                return response()->json([
                    'message' => 'Berkas masih dipinjam oleh ' . $arsip->peminjam_terakhir,
                ], 422);
            }

            $arsip->update([
                'status'             => 'DIPINJAM',
                'peminjam_terakhir'  => $request->nama_peminjam,
                'tgl_pinjam_terakhir' => now(),
            ]);

            // Generate no_register: YYYYMMDD + sequence
            $today = now()->format('Ymd');
            $lastReg = RegisterPeminjaman::where('no_register', 'LIKE', $today . '%')
                ->orderByDesc('no_register')
                ->value('no_register');
            $seq = $lastReg ? (int) substr($lastReg, 8) + 1 : 1;
            $noRegister = $today . str_pad($seq, 4, '0', STR_PAD_LEFT);

            RegisterPeminjaman::create([
                'no_register'     => $noRegister,
                'tanggal_request' => now(),
                'nama_pemohon'    => $request->nama_peminjam,
                'kode_pelaksana'  => $arsip->kode_pelaksana,
                'identitas_arsip' => $arsip->uraian_identitas,
                'lokasi_simpan'   => $arsip->lokasi_simpan,
            ]);

            return response()->json([
                'message' => 'Berkas berhasil dipinjam.',
                'arsip'   => $arsip->fresh(),
            ]);
        });
    }

    public function return(TransactionArsipRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $arsip = MasterArsip::where('kode_pelaksana', $request->kode_pelaksana)
                ->lockForUpdate()
                ->first();

            if (!$arsip) {
                return response()->json(['message' => 'Arsip tidak ditemukan.'], 404);
            }

            if ($arsip->status === 'READY') {
                return response()->json([
                    'message' => 'Berkas sudah berada di rak.',
                ], 422);
            }

            $arsip->update([
                'status'            => 'READY',
                'peminjam_terakhir' => null,
            ]);

            // Close the active register entry
            $register = RegisterPeminjaman::where('kode_pelaksana', $arsip->kode_pelaksana)
                ->whereNull('tgl_pengembalian')
                ->latest()
                ->first();
            if ($register) {
                $register->update(['tgl_pengembalian' => now()]);
            }

            return response()->json([
                'message' => 'Berkas berhasil dikembalikan.',
                'arsip'   => $arsip->fresh(),
            ]);
        });
    }

    public function register(Request $request)
    {
        $filter = $request->query('filter', 'dipinjam'); // dipinjam | dikembalikan | semua
        $search = $request->query('search', '');

        $query = RegisterPeminjaman::query()->orderByDesc('created_at');

        if ($filter === 'dipinjam') {
            $query->whereNull('tgl_pengembalian');
        } elseif ($filter === 'dikembalikan') {
            $query->whereNotNull('tgl_pengembalian');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode_pelaksana', 'LIKE', '%' . $search . '%')
                    ->orWhere('nama_pemohon', 'LIKE', '%' . $search . '%')
                    ->orWhere('no_register', 'LIKE', '%' . $search . '%');
            });
        }

        $records = $query->paginate(20);

        return Inertia::render('Tracker/Register', [
            'records' => $records,
            'filter'  => $filter,
            'search'  => $search,
        ]);
    }

    public function upload()
    {
        return Inertia::render('Tracker/Upload');
    }

    public function uploadProcess(Request $request)
    {
        // Increase execution time & memory for large file imports
        set_time_limit(1200);
        ini_set('memory_limit', '1024M');

        $request->validate([
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:xlsx,xls|max:102400',
            'file' => 'nullable|file|mimes:xlsx,xls|max:102400',
        ]);

        $uploadedFiles = [];
        if ($request->hasFile('files')) {
            $uploadedFiles = $request->file('files');
        } elseif ($request->hasFile('file')) {
            $uploadedFiles = [$request->file('file')];
        }

        if (empty($uploadedFiles)) {
            return response()->json(['message' => 'Tidak ada file yang diunggah.'], 422);
        }

        $scriptPath = base_path('scripts/excel-to-json.js');
        $allValidRows = [];
        $processedFilesCount = 0;

        foreach ($uploadedFiles as $index => $file) {
            $tmpPath = $file->storeAs('uploads', 'import_' . time() . '_' . $index . '.xlsx');
            $fullPath = storage_path('app/' . $tmpPath);
            $jsonPath = storage_path('app/uploads/import_' . time() . '_' . $index . '.json');

            $cmd = 'node --max-old-space-size=4096 ' . escapeshellarg($scriptPath) . ' ' . escapeshellarg($fullPath) . ' ' . escapeshellarg($jsonPath);
            exec($cmd . ' 2>&1', $output, $exitCode);

            if ($exitCode === 0 && file_exists($jsonPath)) {
                $data = json_decode(file_get_contents($jsonPath), true);
                if (is_array($data)) {
                    foreach ($data as $row) {
                        if (!empty($row['kode_pelaksana'])) {
                            $allValidRows[$row['kode_pelaksana']] = $row;
                        }
                    }
                    $processedFilesCount++;
                }
                @unlink($jsonPath);
            }
            @unlink($fullPath);
        }

        if (empty($allValidRows)) {
            return response()->json(['message' => 'Gagal membaca data arsip dari file yang diunggah.'], 422);
        }

        $imported = 0;
        $chunks = array_chunk(array_values($allValidRows), 500);
        foreach ($chunks as $chunk) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($chunk, &$imported) {
                MasterArsip::upsert(
                    $chunk,
                    ['kode_pelaksana'],
                    ['no_boks', 'unit_kerja', 'uraian_identitas', 'uraian2', 'kurun_waktu_awal', 'kurun_waktu_akhir', 'lokasi_simpan', 'ruang_simpan', 'rak', 'status', 'peminjam_terakhir', 'tgl_pinjam_terakhir']
                );
                $imported += count($chunk);
            });
        }

        return response()->json([
            'message' => "Import selesai. {$imported} data dari {$processedFilesCount} file berhasil diimport.",
            'imported' => $imported,
            'files_count' => $processedFilesCount,
        ]);
    }
}
